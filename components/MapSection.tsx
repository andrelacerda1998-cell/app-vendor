import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import { Platform } from "react-native";
import React, { FC } from "react";

interface MapProps {
  contentHeight?: number;
  mapRef?: React.RefObject<MapView>;
  centerMap?: () => void;
  children?: React.ReactNode;
}

const darkMapStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#0c0c0c' }],
  },
  {
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8a8a8a' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#0c0c0c' }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#1f1f1f' }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#626262' }],
  },
  {
    featureType: 'administrative.land_parcel',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#626262' }],
  },
  {
    featureType: 'poi',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#1f1f1f' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#595959' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#0c0c0c' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#292929' }],
  },
  {
    featureType: 'transit',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#121212' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#3d3d3d' }],
  }
];

const MapSection: FC<MapProps> = ({
  contentHeight,
  mapRef,
  centerMap,
  children
}) => {
  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      mapPadding={{
        top: 50,
        right: 10,
        bottom: contentHeight ? contentHeight + (Platform.OS === 'ios' ? 40 : 80) : 400,
        left: 10,
      }}
      ref={mapRef}
      style={{height: '100%', width: '100%', marginTop: 50}}
      customMapStyle={darkMapStyle}
      onMapLoaded={centerMap}
    >
      { children }
    </MapView>
  );
}

export default MapSection;
