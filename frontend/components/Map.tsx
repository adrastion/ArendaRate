'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { addressApi } from '@/lib/api'
import { pluralApartments, pluralReviews } from '@/lib/pluralize'

// Инициализация иконок Leaflet (исправление проблемы с отображением маркеров)
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface Marker {
  id: string
  latitude: number
  longitude: number
  apartmentsCount: number
  reviewsCount: number
  isActive: boolean
}

const DEFAULT_CENTER: [number, number] = [55.751574, 37.573856] // Москва
const DEFAULT_ZOOM = 10

interface MapProps {
  markers: Marker[]
  onMarkerClick: (addressId: string) => void
  /** Начальный центр карты (например, геолокация пользователя). При изменении карта перелетает. */
  center?: [number, number]
  /** Начальный зум. При изменении center обновляется. */
  zoom?: number
  /** Геолокация пользователя — отображается маркером на карте */
  userLocation?: { lat: number; lng: number } | null
}

// Обновление центра и зума карты при изменении props (например, после получения геолокации)
function SetView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [map, center[0], center[1], zoom])
  return null
}

// Компонент для автофита карты под маркеры (только при первой загрузке и если центр по умолчанию — без геолокации)
function MapBounds({
  markers,
  isInitialFit,
  useDefaultCenter,
}: {
  markers: Marker[]
  isInitialFit: { current: boolean }
  useDefaultCenter: boolean
}) {
  const map = useMap()

  useEffect(() => {
    if (useDefaultCenter && markers.length > 0 && !isInitialFit.current) {
      try {
        const bounds = L.latLngBounds(
          markers.map((m) => [m.latitude, m.longitude])
        )
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 15,
        })
        isInitialFit.current = true
      } catch (error) {
        console.warn('Could not set bounds:', error)
      }
    }
  }, [markers, map, isInitialFit, useDefaultCenter])

  return null
}

// Компонент для перемещения контрола масштабирования
function ZoomControlPosition() {
  const map = useMap()

  useEffect(() => {
    // Перемещаем контрол масштабирования в левый нижний угол
    if (map.zoomControl) {
      map.zoomControl.setPosition('bottomleft')
    }
  }, [map])

  return null
}

// Компонент для удаления стандартной атрибуции и скрытия флагов
function AttributionCleaner() {
  const map = useMap()

  useEffect(() => {
    // Удаляем стандартную атрибуцию Leaflet
    const attributionControl = map.attributionControl
    if (attributionControl) {
      map.removeControl(attributionControl)
    }

    // Скрываем все изображения и флаги в атрибуции через короткий интервал
    const hideFlags = () => {
      const attributionEls = document.querySelectorAll('.leaflet-control-attribution')
      attributionEls.forEach((el) => {
        // Скрываем все изображения
        const imgs = el.querySelectorAll('img')
        imgs.forEach((img) => {
          img.style.display = 'none'
          img.style.visibility = 'hidden'
        })
        
        // Удаляем эмодзи флагов
        const text = el.textContent || ''
        if (text.includes('🇺🇦') || text.includes('UA')) {
          el.textContent = el.textContent?.replace(/🇺🇦/g, '').replace(/UA/g, '') || ''
        }
      })
    }

    // Проверяем сразу и периодически
    hideFlags()
    const interval = setInterval(hideFlags, 100)
    
    // Также проверяем при изменениях DOM
    const observer = new MutationObserver(hideFlags)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      clearInterval(interval)
      observer.disconnect()
    }
  }, [map])

  return null
}

// Иконка маркера геолокации пользователя (синяя точка с обводкой)
const userLocationIcon = L.divIcon({
  className: 'custom-marker-user-location',
  html: `
    <div style="
      position: relative;
      width: 20px;
      height: 20px;
      background: #2563eb;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

export function Map({ markers, onMarkerClick, center = DEFAULT_CENTER, zoom = DEFAULT_ZOOM, userLocation = null }: MapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const isInitialFit = useRef<boolean>(false)

  // Создаем пользовательские иконки для маркеров
  const activeIcon = useMemo(() => {
    return L.divIcon({
      className: 'custom-marker-active',
      html: `
        <div style="
          background-color: #0EA5E9;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
          cursor: pointer;
        ">
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })
  }, [])

  const inactiveIcon = useMemo(() => {
    return L.divIcon({
      className: 'custom-marker-inactive',
      html: `
        <div style="
          background-color: #9CA3AF;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          cursor: pointer;
        ">
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    })
  }, [])

  // Мемоизируем маркеры с количеством квартир для активных
  const markersWithIcons = useMemo(() => {
    return markers.map((marker) => {
      const icon = marker.isActive 
        ? L.divIcon({
            className: 'custom-marker-active',
            html: `
              <div style="
                background-color: #0EA5E9;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 11px;
                cursor: pointer;
              ">
                ${marker.apartmentsCount}
              </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          })
        : inactiveIcon

      return { ...marker, icon }
    })
  }, [markers, inactiveIcon])

  return (
    <div className="w-full h-full" style={{ minHeight: '500px' }}>
      <MapContainer
        ref={mapRef as any}
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        zoomControl={true}
        attributionControl={false}
      >
        <SetView center={center} zoom={zoom} />
        <LayersControl position="bottomleft" collapsed={true}>
          <LayersControl.BaseLayer checked name="Стандартная карта">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Спутник">
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Светлая карта">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Темная карта">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Топографическая карта">
            <TileLayer
              attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        
        <MapBounds
          markers={markers}
          isInitialFit={isInitialFit}
          useDefaultCenter={center[0] === DEFAULT_CENTER[0] && center[1] === DEFAULT_CENTER[1]}
        />
        <ZoomControlPosition />
        <AttributionCleaner />
        
        {/* Кастомная атрибуция без флагов */}
        <div className="leaflet-bottom leaflet-right" style={{ zIndex: 1000, pointerEvents: 'none' }}>
          <div className="leaflet-control-attribution leaflet-control" style={{ background: 'rgba(255, 255, 255, 0.8)', padding: '2px 5px', fontSize: '11px', pointerEvents: 'auto' }}>
            © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" style={{ color: '#0078a8', textDecoration: 'none' }}>OpenStreetMap</a>
          </div>
        </div>

        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userLocationIcon}
            zIndexOffset={1000}
          >
            <Popup>
              <div style={{ padding: '8px', textAlign: 'center' }}>
                <strong>Вы здесь</strong>
              </div>
            </Popup>
          </Marker>
        )}
        {markersWithIcons.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.latitude, marker.longitude]}
            icon={marker.icon}
            eventHandlers={{
              click: () => {
                onMarkerClick(marker.id)
              },
            }}
          >
            <Popup>
              <div style={{ padding: '10px' }}>
                <strong>{marker.apartmentsCount} {pluralApartments(marker.apartmentsCount)}</strong>
                <br />
                {marker.reviewsCount} {pluralReviews(marker.reviewsCount)}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
