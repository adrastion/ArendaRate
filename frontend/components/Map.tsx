'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { addressApi } from '@/lib/api'

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

interface MapProps {
  markers: Marker[]
  onMarkerClick: (addressId: string) => void
}

// Компонент для автофита карты под маркеры (только при первой загрузке)
function MapBounds({ markers, isInitialFit }: { markers: Marker[]; isInitialFit: { current: boolean } }) {
  const map = useMap()

  useEffect(() => {
    if (markers.length > 0 && !isInitialFit.current) {
      try {
        const bounds = L.latLngBounds(
          markers.map((m) => [m.latitude, m.longitude])
        )
        map.fitBounds(bounds, { 
          padding: [50, 50],
          maxZoom: 15 
        })
        isInitialFit.current = true
      } catch (error) {
        console.warn('Could not set bounds:', error)
      }
    }
  }, [markers, map, isInitialFit])

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

export function Map({ markers, onMarkerClick }: MapProps) {
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
        center={[55.751574, 37.573856]} // Москва по умолчанию
        zoom={10}
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        whenCreated={(mapInstance) => {
          mapRef.current = mapInstance
        }}
        zoomControl={true}
      >
        <LayersControl position="bottomright" collapsed={true}>
          <LayersControl.BaseLayer checked name="Стандартная карта">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Темная карта">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Топографическая карта">
            <TileLayer
              attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        
        <MapBounds markers={markers} isInitialFit={isInitialFit} />
        <ZoomControlPosition />

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
                <strong>{marker.apartmentsCount} квартир</strong>
                <br />
                {marker.reviewsCount} отзывов
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
