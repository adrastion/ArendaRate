'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { addressApi } from '@/lib/api'
import { AddressSearchResult } from '@/types'
import { useTranslation } from '@/lib/useTranslation'
import { pluralApartmentsLocale, pluralReviewsLocale } from '@/lib/pluralize'

interface AddressSearchProps {
  onSelect: (address: AddressSearchResult) => void
  /** Геолокация пользователя — адреса ближе к ней показываются первыми в поиске */
  userLocation?: { lat: number; lng: number } | null
}

// Кэш результатов поиска на клиенте
const searchCache = new Map<string, AddressSearchResult[]>()
const MAX_CACHE_SIZE = 50

export function AddressSearch({ onSelect, userLocation = null }: AddressSearchProps) {
  const { t, locale } = useTranslation()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AddressSearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSelect = useCallback((address: AddressSearchResult) => {
    setQuery('')
    setIsOpen(false)
    onSelect(address)
  }, [onSelect])

  useEffect(() => {
    if (query.length < 3) {
      setResults([])
      setIsOpen(false)
      return
    }

    // Ключ кэша: запрос + геолокация (при наличии), т.к. с near результаты сортируются иначе
    const cacheKey = query.toLowerCase() + (userLocation ? `|${userLocation.lat},${userLocation.lng}` : '')
    const cached = searchCache.get(cacheKey)
    if (cached) {
      setResults(cached)
      setIsOpen(true)
      return
    }

    const searchTimeout = setTimeout(async () => {
      setIsLoading(true)
      try {
        console.log('🔍 Starting address search for:', query, userLocation ? '(with user location)' : '')
        const response = await addressApi.search(query, {
          near: userLocation ?? undefined,
        })
        console.log('✅ Search response received:', response)

        if (response && response.addresses) {
          console.log(`📋 Found ${response.addresses.length} addresses`)
          if (searchCache.size >= MAX_CACHE_SIZE) {
            const firstKey = searchCache.keys().next().value
            if (firstKey) {
              searchCache.delete(firstKey)
            }
          }
          searchCache.set(cacheKey, response.addresses)
          
          setResults(response.addresses)
          setIsOpen(true)
        } else {
          console.warn('⚠️ Response format unexpected:', response)
          setResults([])
          setIsOpen(true)
        }
      } catch (error: any) {
        console.error('Search error:', error)
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        })
        setResults([])
        setIsOpen(true) // Показываем пустой список даже при ошибке
      } finally {
        setIsLoading(false)
      }
    }, 500) // Увеличиваем debounce для снижения нагрузки

    return () => clearTimeout(searchTimeout)
  }, [query, userLocation])

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('search.placeholder')}
          className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((address) => (
            <SearchResultItem
              key={address.id}
              address={address}
              onSelect={handleSelect}
              t={t}
              locale={locale}
            />
          ))}
        </div>
      )}

      {isOpen && results.length === 0 && query.length >= 3 && !isLoading && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-4 text-center text-gray-500 dark:text-gray-400">
          {t('search.nothingFound')}
        </div>
      )}
    </div>
  )
}

// Мемоизированный компонент для результата поиска
const SearchResultItem = React.memo(({ 
  address, 
  onSelect,
  t,
  locale,
}: { 
  address: AddressSearchResult
  onSelect: (address: AddressSearchResult) => void
  t: (key: string) => string
  locale: 'ru' | 'en'
}) => (
  <button
    onClick={() => onSelect(address)}
    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-b-0 text-gray-900 dark:text-gray-100"
  >
    <div className="font-medium text-gray-900 dark:text-gray-100">
      {address.formattedAddress || `${address.city}, ${address.street}, ${address.building}`}
    </div>
    <div className="text-sm text-gray-500 dark:text-gray-400">
      {address.apartmentsCount > 0 ? (
        <>
          {address.apartmentsCount} {pluralApartmentsLocale(address.apartmentsCount, locale)}
          {address.reviewsCount !== undefined && (
            <>
              {' • '}
              {address.reviewsCount > 0 ? (
                <>{address.reviewsCount} {pluralReviewsLocale(address.reviewsCount, locale)}</>
              ) : (
                <span className="text-gray-400">{t('apartmentList.noReviews')}</span>
              )}
            </>
          )}
        </>
      ) : (
        <span className="text-gray-400 dark:text-gray-500">{t('apartmentList.noReviews')}</span>
      )}
    </div>
  </button>
))

SearchResultItem.displayName = 'SearchResultItem'