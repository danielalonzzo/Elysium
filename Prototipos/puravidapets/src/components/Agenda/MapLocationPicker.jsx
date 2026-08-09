import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.75rem'
};

// Default center: Costa Rica (as per "Pura Vida Pets")
const defaultCenter = {
  lat: 9.9281,
  lng: -84.0907
};

export default function MapLocationPicker({ onLocationSelect }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  const [map, setMap] = useState(null);
  const [markerPosition, setMarkerPosition] = useState(defaultCenter);

  const onLoad = useCallback(function callback(mapInstance) {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(function callback(mapInstance) {
    setMap(null);
  }, []);

  const handleMapClick = (e) => {
    const newPos = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    };
    setMarkerPosition(newPos);
    if (onLocationSelect) {
      onLocationSelect(newPos);
    }
  };

  if (!isLoaded) return <div className="p-4 text-center text-[var(--color-brand-orange)] font-bold">Loading Map...</div>;

  return (
    <div className="shadow-[8px_8px_0px_0px_rgba(76,29,3,1)] rounded-xl overflow-hidden border-2 border-[var(--color-brand-dark)]">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={12}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
      >
        <Marker position={markerPosition} />
      </GoogleMap>
    </div>
  );
}
