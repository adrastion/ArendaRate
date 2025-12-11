'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { addressApi } from '@/lib/api'
import { AddressSearchResult } from '@/types'

interface AddressSearchProps {
  onSelect: (address: AddressSearchResult) => void
}

// Кэш результатов поиска на клиенте
const searchCache = new Map<string, AddressSearchResult[]>()
const MAX_CACHE_SIZE = 50

export function AddressSearch({ onSelect }: AddressSearchProps) {
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

    // Проверяем кэш
    const cached = searchCache.get(query.toLowerCase())
    if (cached) {
      setResults(cached)
      setIsOpen(true)
      return
    }

    const searchTimeout = setTimeout(async () => {
      setIsLoading(true)
      try {
        console.log('🔍 Starting address search for:', query)
        const response = await addressApi.search(query)
        console.log('✅ Search response received:', response)
        
        if (response && response.addresses) {
          console.log(`📋 Found ${response.addresses.length} addresses`)
          // Сохраняем в кэш
          if (searchCache.size >= MAX_CACHE_SIZE) {
            const firstKey = searchCache.keys().next().value
            searchCache.delete(firstKey)
          }
          searchCache.set(query.toLowerCase(), response.addresses)
          
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
  }, [query])

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по адресу (город, улица, дом)..."
          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((address) => (
            <SearchResultItem
              key={address.id}
              address={address}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}

      {isOpen && results.length === 0 && query.length >= 3 && !isLoading && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
          Ничего не найдено
        </div>
      )}
    </div>
  )
}

// Мемоизированный компонент для результата поиска
const SearchResultItem = React.memo(({ 
  address, 
  onSelect 
}: { 
  address: AddressSearchResult
  onSelect: (address: AddressSearchResult) => void 
}) => (
  <button
    onClick={() => onSelect(address)}
    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-gray-900"
  >
    <div className="font-medium text-gray-900">
      {address.formattedAddress || `${address.city}, ${address.street}, ${address.building}`}
    </div>
    <div className="text-sm text-gray-500">
      {address.apartmentsCount > 0 ? (
        <>
          {address.apartmentsCount} {address.apartmentsCount === 1 ? 'квартира' : address.apartmentsCount < 5 ? 'квартиры' : 'квартир'}
          {address.reviewsCount !== undefined && (
            <>
              {' • '}
              {address.reviewsCount > 0 ? (
                <>{address.reviewsCount} {address.reviewsCount === 1 ? 'отзыв' : address.reviewsCount < 5 ? 'отзыва' : 'отзывов'}</>
              ) : (
                <span className="text-gray-400">Нет отзывов</span>
              )}
            </>
          )}
        </>
      ) : (
        <span className="text-gray-400">Нет отзывов</span>
      )}
    </div>
  </button>
))

SearchResultItem.displayName = 'SearchResultItem'