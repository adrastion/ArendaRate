'use client'

import React from 'react'

interface Apartment {
  id: string
  number: string
  reviewsCount: number
}

interface Address {
  id: string
  city: string
  street: string
  building: string
}

interface ApartmentListProps {
  address: Address
  apartments: Apartment[]
  totalReviewsCount: number
  onApartmentClick: (apartmentId: string) => void
  onClose: () => void
}

export function ApartmentList({
  address,
  apartments,
  totalReviewsCount,
  onApartmentClick,
  onClose,
}: ApartmentListProps) {
  return (
    <div className="apartment-list bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">
              {address.city}, {address.street}, {address.building}
            </h3>
            <p className="text-sm text-gray-500">
              {totalReviewsCount > 0 ? (
                <>
                  Всего отзывов: {totalReviewsCount}
                </>
              ) : (
                <span className="text-gray-400">Нет отзывов</span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onClose()
            }}
            className="text-gray-400 hover:text-gray-600 ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
        {apartments.length > 0 && (
          <p className="text-xs text-gray-400 mt-1">
            {apartments.length} {apartments.length === 1 ? 'квартира' : apartments.length < 5 ? 'квартиры' : 'квартир'}
          </p>
        )}
      </div>
      <div className="divide-y divide-gray-200">
        {apartments.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            <p>В этом доме пока нет квартир с отзывами</p>
            <p className="text-sm text-gray-400 mt-2">Нет отзывов</p>
          </div>
        ) : (
          apartments.map((apartment) => (
            <ApartmentItem
              key={apartment.id}
              apartment={apartment}
              onApartmentClick={onApartmentClick}
            />
          ))
        )}
      </div>
    </div>
  )
}

// Мемоизированный компонент для элемента квартиры
const ApartmentItem = React.memo(({ 
  apartment, 
  onApartmentClick 
}: { 
  apartment: Apartment
  onApartmentClick: (id: string) => void 
}) => (
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault()
      e.stopPropagation()
      onApartmentClick(apartment.id)
    }}
    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
  >
    <div className="flex justify-between items-center">
      <span className="font-medium">Кв. {apartment.number}</span>
      <span className="text-sm text-gray-500">
        {apartment.reviewsCount > 0 ? (
          <>
            {apartment.reviewsCount}{' '}
            {apartment.reviewsCount === 1 ? 'отзыв' : apartment.reviewsCount < 5 ? 'отзыва' : 'отзывов'}
          </>
        ) : (
          <span className="text-gray-400">Нет отзывов</span>
        )}
      </span>
    </div>
  </button>
))

ApartmentItem.displayName = 'ApartmentItem'

