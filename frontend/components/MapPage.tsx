'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useAuthStore } from '@/store/authStore'
import { addressApi } from '@/lib/api'
import { AddressSearch } from './AddressSearch'
import { Header } from './Header'
import { ApartmentList } from './ApartmentList'
import { AddReviewButton } from './AddReviewButton'
import { AddReviewModal } from './AddReviewModal'
import { useTranslation } from '@/lib/useTranslation'
import { UserRole } from '@/types'

function MapLoadingPlaceholder() {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">{t('map.loading')}</p>
      </div>
    </div>
  )
}

// Динамическая загрузка карты (для SSR)
const Map = dynamic(() => import('./Map').then((mod) => mod.Map), {
  ssr: false,
  loading: () => <MapLoadingPlaceholder />,
})

interface Marker {
  id: string
  latitude: number
  longitude: number
  apartmentsCount: number
  reviewsCount: number
  isActive: boolean
}

const DEFAULT_MAP_CENTER: [number, number] = [55.751574, 37.573856] // Москва
const DEFAULT_MAP_ZOOM = 10
const USER_LOCATION_ZOOM = 12

export function MapPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user, checkAuth } = useAuthStore()
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
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
  }, [])

  // Определение геолокации пользователя для центра карты и приоритета в поиске
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      () => {
        // Отказ или ошибка — остаёмся на центре по умолчанию (Москва)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    )
  }, [])

  const loadMarkers = useCallback(async () => {
    try {
      const response = await addressApi.getMapMarkers()
      setMarkers(response.markers)
    } catch (error) {
      console.error('Error loading markers:', error)
    }
  }, [])

  const handleAddressSelect = async (address: any) => {
    console.log('Address selected from search:', address)

    setIsLoadingAddress(true)

    try {
      let addressId = address.id

      // Если адрес из Nominatim (не из БД), создаем его в БД
      if (!address.fromDatabase || address.id.startsWith('nominatim_')) {
        if (user) {
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
          } catch (error: any) {
            console.error('Error creating address:', error)
            alert(`${t('mapPage.addressSaveError')}: ${error.response?.data?.message || error.message || ''}`)
            return
          }
        } else {
          // Неавторизованный пользователь: перенаправляем на логин, потом можно будет открыть адрес
          window.location.href = '/login'
          return
        }
      }

      // Переход на страницу со всеми отзывами по дому
      router.push(`/address/${addressId}`)
    } catch (error: any) {
      console.error('Error handling address selection:', error)
      alert(`${t('mapPage.addressError')}: ${error.response?.data?.message || error.message || ''}`)
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
      alert(`${t('mapPage.addressLoadError')}: ${error.response?.data?.message || error.message || ''}`)
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
        <div className="absolute top-4 left-4 md:left-4 z-10 w-[calc(100%-2rem)] md:w-52 pointer-events-none left-4">
          <div className="pointer-events-auto relative">
            <div className="pr-14 md:pr-0">
              <AddressSearch
                onSelect={handleAddressSelect}
                userLocation={userLocation}
                placeholder="Добавленные адреса"
                inputClassName="h-12 py-3 w-full"
              />
            </div>
            {user && user.role !== UserRole.LANDLORD && (
              <div className="md:hidden absolute top-0 right-0">
                <AddReviewButton onClick={() => setShowAddReview(true)} />
              </div>
            )}
          </div>
        </div>

        {user && user.role !== UserRole.LANDLORD && (
          <div className="hidden md:block absolute top-4 right-4 z-10 pointer-events-none">
            <div className="pointer-events-auto">
              <AddReviewButton onClick={() => setShowAddReview(true)} />
            </div>
          </div>
        )}

        <div className="w-full h-full relative" style={{ zIndex: 1 }}>
          <Map
            markers={markers}
            onMarkerClick={handleMarkerClick}
            center={userLocation ? [userLocation.lat, userLocation.lng] : DEFAULT_MAP_CENTER}
            zoom={userLocation ? USER_LOCATION_ZOOM : DEFAULT_MAP_ZOOM}
            userLocation={userLocation}
          />
        </div>

        {isLoadingAddress && (
          <div className="absolute left-1/2 transform -translate-x-1/2 z-50 pointer-events-none" style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
            <div className="pointer-events-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                <span className="text-gray-700 dark:text-gray-300">{t('map.loadingAddress')}</span>
              </div>
            </div>
          </div>
        )}
        
        {selectedAddress && !isLoadingAddress && (
          <div className="absolute left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4 pointer-events-none" style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
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

