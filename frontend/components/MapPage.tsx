'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useAuthStore } from '@/store/authStore'
import { addressApi } from '@/lib/api'
import { AddressSearch } from './AddressSearch'
import { Header } from './Header'
import { ApartmentList } from './ApartmentList'
import { AddReviewButton } from './AddReviewButton'
import { AddReviewModal } from './AddReviewModal'

// Динамическая загрузка карты (для SSR)
const Map = dynamic(() => import('./Map').then((mod) => mod.Map), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Загрузка карты...</p>
      </div>
    </div>
  ),
})

interface Marker {
  id: string
  latitude: number
  longitude: number
  apartmentsCount: number
  reviewsCount: number
  isActive: boolean
}

export function MapPage() {
  const { user, checkAuth } = useAuthStore()
  const [markers, setMarkers] = useState<Marker[]>([])
  const [selectedAddress, setSelectedAddress] = useState<{
    id: string
    address: {
      id: string
      city: string
      street: string
      building: string
    }
    apartments: Array<{ id: string; number: string; reviewsCount: number }>
    totalReviewsCount: number
  } | null>(null)
  const [showAddReview, setShowAddReview] = useState(false)
  const [selectedApartment, setSelectedApartment] = useState<string | null>(null)
  const [selectedAddressForReview, setSelectedAddressForReview] = useState<any>(null)
  const [isLoadingAddress, setIsLoadingAddress] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    loadMarkers()
  }, []) // Загружаем маркеры только один раз при монтировании

  const loadMarkers = useCallback(async () => {
    try {
      const response = await addressApi.getMapMarkers()
      setMarkers(response.markers)
    } catch (error) {
      console.error('Error loading markers:', error)
    }
  }, [])

  const handleAddressSelect = async (address: any) => {
    console.log('Address selected from search:', address, 'User:', user?.id)
    
    if (!user) {
      // Перенаправление на страницу авторизации
      window.location.href = '/login'
      return
    }

    setIsLoadingAddress(true)

    try {
      let addressId = address.id
      let addressData = address

      // Если адрес из Nominatim (не из БД), создаем его в БД
      if (!address.fromDatabase || address.id.startsWith('nominatim_')) {
        console.log('Creating new address in database:', address)
        try {
          const createdAddress = await addressApi.create({
            country: address.country,
            city: address.city,
            street: address.street || '',
            building: address.building || '',
            latitude: address.latitude,
            longitude: address.longitude,
          })
          addressId = createdAddress.address.id
          console.log('Address created with ID:', addressId)
          
          // Загружаем полные данные адреса из БД
          const response = await addressApi.getById(addressId)
          addressData = response.address
        } catch (error: any) {
          console.error('Error creating address:', error)
          alert(`Ошибка при сохранении адреса: ${error.response?.data?.message || error.message || 'Попробуйте еще раз'}`)
          return
        }
      } else {
        // Адрес уже в БД, загружаем полные данные
        console.log('Loading address data from database:', addressId)
        const response = await addressApi.getById(addressId)
        addressData = response.address
      }

      // Открываем форму добавления отзыва с выбранным адресом
      setSelectedApartment(null)
      setSelectedAddressForReview({
        id: addressId,
        country: address.country,
        city: address.city,
        street: address.street || '',
        building: address.building || '',
        latitude: address.latitude,
        longitude: address.longitude,
        fromDatabase: true,
      })
      setShowAddReview(true)
    } catch (error: any) {
      console.error('Error handling address selection:', error)
      alert(`Ошибка при обработке адреса: ${error.response?.data?.message || error.message || 'Неизвестная ошибка'}`)
    } finally {
      setIsLoadingAddress(false)
    }
  }

  const handleMarkerClick = async (addressId: string) => {
    console.log('Marker clicked:', addressId, 'User:', user?.id)
    
    if (!user) {
      // Перенаправление на страницу авторизации
      window.location.href = '/login'
      return
    }

    // Сбрасываем предыдущий выбор
    setSelectedAddress(null)
    setIsLoadingAddress(true)

    try {
      console.log('Loading address data for:', addressId)
      const response = await addressApi.getById(addressId)
      console.log('Address loaded:', response)
      
      const totalReviewsCount = response.apartments.reduce(
        (sum, apt) => sum + (apt.reviewsCount ?? 0),
        0
      )
      
      setSelectedAddress({
        id: response.address.id,
        address: {
          id: response.address.id,
          city: response.address.city,
          street: response.address.street,
          building: response.address.building,
        },
        apartments: response.apartments.map((apt) => ({
          id: apt.id,
          number: apt.number,
          reviewsCount: apt.reviewsCount ?? 0,
        })),
        totalReviewsCount,
      })
      
      console.log('Apartment list should be visible now')
    } catch (error: any) {
      console.error('Error loading address:', error)
      alert(`Ошибка при загрузке адреса: ${error.response?.data?.message || error.message || 'Неизвестная ошибка'}`)
    } finally {
      setIsLoadingAddress(false)
    }
  }

  const handleApartmentClick = (apartmentId: string) => {
    setSelectedApartment(apartmentId)
    setSelectedAddress(null)
    // TODO: Открыть страницу/модалку с отзывами квартиры
    window.location.href = `/apartment/${apartmentId}`
  }

  const handleCloseApartmentList = () => {
    setSelectedAddress(null)
  }

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 relative">
        <div className="absolute top-4 left-4 z-10 w-96 max-w-[calc(100%-2rem)] pointer-events-none">
          <div className="pointer-events-auto">
            <AddressSearch onSelect={handleAddressSelect} />
          </div>
        </div>

        {user && (
          <div className="absolute top-4 right-4 z-10 pointer-events-none">
            <div className="pointer-events-auto">
              <AddReviewButton onClick={() => setShowAddReview(true)} />
            </div>
          </div>
        )}

        <div className="w-full h-full relative" style={{ zIndex: 1 }}>
          <Map markers={markers} onMarkerClick={handleMarkerClick} />
        </div>

        {isLoadingAddress && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
            <div className="pointer-events-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                <span className="text-gray-700 dark:text-gray-300">Загрузка адреса...</span>
              </div>
            </div>
          </div>
        )}
        
        {selectedAddress && !isLoadingAddress && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4 pointer-events-none">
            <div className="pointer-events-auto">
              <ApartmentList
                address={selectedAddress.address}
                apartments={selectedAddress.apartments}
                totalReviewsCount={selectedAddress.totalReviewsCount}
                onApartmentClick={handleApartmentClick}
                onClose={handleCloseApartmentList}
              />
            </div>
          </div>
        )}

        {showAddReview && (
          <AddReviewModal
            onClose={() => {
              setShowAddReview(false)
              setSelectedApartment(null)
              setSelectedAddressForReview(null)
            }}
            onSuccess={() => {
              // Обновляем маркеры после создания отзыва
              loadMarkers()
              setSelectedAddressForReview(null)
            }}
            initialApartmentId={selectedApartment}
            initialAddress={selectedAddressForReview}
          />
        )}
      </div>
    </div>
  )
}

