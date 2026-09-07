import {Colors} from '@/constants/Colors';
import {Feather, FontAwesome6, Ionicons, MaterialCommunityIcons} from '@expo/vector-icons';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Platform, TouchableOpacity, View} from 'react-native';
import BackHeader from '@/components/app/BackHeader';
import {CustomText} from "@/components/CustomText";
import ServiceInProgress from "@/components/modals/services/ServiceInProgress";
import {useService} from "@/contexts/ServiceContext";
import MapView, {Polyline, PROVIDER_GOOGLE, Marker, LatLng} from "react-native-maps";
import {getPoints} from "@/utils/map/getPoints";
import {useApi} from "@/contexts/ApiContext";
import {API_ROUTES} from "@/constants/ApiRoutes";
import decodePolyline from "@/utils/map/decodePolyline";
import { useNavChooser } from "@/hooks/useNavChooser";
import { useTranslation } from "react-i18next";

const isValidCoordinate = (coord?: number) =>
    coord !== undefined && coord !== null && !isNaN(coord);

// Deslocamento mínimo (em graus, ~5,5 m) para a câmera acompanhar o vendor.
// Abaixo disso a câmera fica parada, evitando tremer com o jitter do GPS.
const MIN_RECENTER_DEGREES = 0.00005;

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

const formatServiceAddress = (address?: {
  name?: string | null;
  address?: string | null;
  street_name?: string | null;
  postal_code?: string | null;
  city?: string | null;
}) => {
  const parts = [
    address?.street_name,
    address?.postal_code,
    address?.city,
  ].filter((value): value is string => Boolean(value && String(value).trim()));

  if (parts.length > 0) return parts.join(', ');
  if (address?.name?.trim()) return address.name.trim();
  if (address?.address?.trim()) return address.address.trim();
  return null;
};

const Progress = () => {
  const { t } = useTranslation();
  const { openService, setOpenService } = useService();
  const { api } = useApi();
  const mapRef = useRef<MapView | null>(null);
  const hasCenteredRef = useRef(false);
  const lastCenteredRef = useRef<{ lat: number; lng: number } | null>(null);
  const [isFollowing, setIsFollowing] = useState(true);
  const [contentHeight, setContentHeight] = useState(0);
  const [routeCoordinates, setRouteCoordinates] = useState<LatLng[]>([]);

  const destinationLat = parseFloat(String(openService?.address?.latitude));
  const destinationLng = parseFloat(String(openService?.address?.longitude));
  const vendorLat = parseFloat(String(openService?.vendor?.location?.latitude));
  const vendorLng = parseFloat(String(openService?.vendor?.location?.longitude));

  const validDestination = isValidCoordinate(destinationLat) && isValidCoordinate(destinationLng);
  const validUserLocation = isValidCoordinate(vendorLat) && isValidCoordinate(vendorLng);

  // So Apple/Google/Waze, via useNavChooser. Antes usava o react-native-map-link,
  // que abria uma lista longa (Citymapper, Moovit, Yandex...) impossivel de
  // restringir a estas tres.
  const chooseNavApp = useNavChooser();
  const handlePressNavigation = () =>
    chooseNavApp(openService?.address, openService?.address?.name);

  useEffect(() => {
    if (!openService?.id) return;

    let isActive = true;
    setRouteCoordinates([]);

    api.get(API_ROUTES.VENDOR_GET_SERVICE_ROUTE(openService.id))
      .then((res) => {
        const payload = res.data?.data ?? res.data;
        const routeCoordinatesRaw = payload?.route?.coordinates;
        const encodedPolyline = payload?.route?.polyline;

        if (Array.isArray(routeCoordinatesRaw) && routeCoordinatesRaw.length > 1) {
          const normalized = routeCoordinatesRaw
            .filter((point: any) =>
              Number.isFinite(point?.latitude) && Number.isFinite(point?.longitude),
            )
            .map((point: any) => ({
              latitude: Number(point.latitude),
              longitude: Number(point.longitude),
            }));

          if (isActive && normalized.length > 1) {
            setRouteCoordinates(normalized);
            return;
          }
        }

        if (!encodedPolyline || typeof encodedPolyline !== "string") return;

        const decoded = decodePolyline(encodedPolyline);
        if (isActive && decoded.length > 1) {
          setRouteCoordinates(decoded);
        }
      })
      .catch((err) => {
        console.error("Failed to load service route:", err);
      });

    return () => {
      isActive = false;
    };
  }, [api, openService?.id]);

  const fallbackRouteCoordinates = useMemo(
    () =>
      getPoints([
        { latitude: vendorLat, longitude: vendorLng },
        { latitude: destinationLat, longitude: destinationLng },
      ]),
    [destinationLat, destinationLng, vendorLat, vendorLng],
  );

  const polylineCoordinates =
    routeCoordinates.length > 1 ? routeCoordinates : fallbackRouteCoordinates;

  const customerAddress = formatServiceAddress(openService?.address);

  useEffect(() => {
    if (!openService?.id) return;
    if (openService?.customer?.name?.trim()) return;

    api.get(API_ROUTES.GET_SERVICE_DETAILS(`${openService.id}`))
      .then((response) => {
        const service = response.data?.data?.service;
        if (service) {
          setOpenService(service);
        }
      })
      .catch(() => {});
  }, [api, customerAddress, openService?.customer?.name, openService?.id, setOpenService]);

  // Segue o vendor como um GPS: centraliza uma vez com zoom de rua e depois só
  // reposiciona a câmera quando ele se desloca além de um mínimo, evitando que o
  // mapa fique se mexendo com o jitter de localização enquanto está parado.
  // Enquanto o usuário estiver explorando o mapa (isFollowing = false), não mexe.
  useEffect(() => {
    if (!mapRef.current || !validUserLocation || !isFollowing) return;

    // Primeira centralização: define o zoom de navegação uma única vez.
    if (!hasCenteredRef.current) {
      hasCenteredRef.current = true;
      lastCenteredRef.current = { lat: vendorLat, lng: vendorLng };
      mapRef.current.animateCamera(
        { center: { latitude: vendorLat, longitude: vendorLng }, zoom: 16 },
        { duration: 500 },
      );
      return;
    }

    // Depois: só reposiciona se o vendor se moveu mais que o deslocamento mínimo,
    // preservando o zoom atual. Parado (ou jitter) = câmera imóvel.
    const last = lastCenteredRef.current!;
    const movedEnough =
      Math.abs(last.lat - vendorLat) > MIN_RECENTER_DEGREES ||
      Math.abs(last.lng - vendorLng) > MIN_RECENTER_DEGREES;
    if (!movedEnough) return;

    lastCenteredRef.current = { lat: vendorLat, lng: vendorLng };
    mapRef.current.animateCamera(
      { center: { latitude: vendorLat, longitude: vendorLng } },
      { duration: 800 },
    );
  }, [vendorLat, vendorLng, validUserLocation, isFollowing]);

  // Reativa o follow e recentraliza imediatamente no vendor.
  const recenterOnVendor = () => {
    setIsFollowing(true);
    if (mapRef.current && validUserLocation) {
      lastCenteredRef.current = { lat: vendorLat, lng: vendorLng };
      mapRef.current.animateCamera(
        { center: { latitude: vendorLat, longitude: vendorLng }, zoom: 16 },
        { duration: 500 },
      );
    }
  };

  return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.primary }}>
          <View className="flex-1 bg-black">
              <BackHeader
                  backButtonColor="secondary"
                  middleItem={() => (
                      <View className="flex flex-row items-center px-2 max-w-[85%]">
                          {customerAddress ? (
                            <CustomText
                              color="secondary"
                              boldness="bold"
                              size="small"
                              numberOfLines={2}
                              classes="text-center"
                            >
                                {customerAddress}
                            </CustomText>
                          ) : null}
                      </View>
                  )}
                  rigthItem={() => (
                      <TouchableOpacity onPress={handlePressNavigation} className="flex items-end">
                          <Feather name="navigation" size={30} color={Colors.secondary}/>
                      </TouchableOpacity>
                  )}
                  otherClasses="px-5 py-8 bg-primary rounded-b-3xl absolute top-0 left-0 right-0 z-20"
              />

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
                  onPanDrag={() => {
                      if (isFollowing) setIsFollowing(false);
                  }}
                  initialRegion={
                      validUserLocation
                          ? {
                              latitude: vendorLat,
                              longitude: vendorLng,
                              latitudeDelta: 0.01,
                              longitudeDelta: 0.01,
                          }
                          : undefined
                  }
              >
                  {validDestination && (
                      <Marker coordinate={{latitude: destinationLat, longitude: destinationLng}}>
                          <FontAwesome6 name="location-dot" size={30} color={Colors.secondary}/>
                      </Marker>
                  )}
                  {validUserLocation && vendorLat !== undefined && vendorLng !== undefined && (
                      <Marker coordinate={{ latitude: vendorLat, longitude: vendorLng }}>
                          <View className="border-2 border-[#C3A5FF] rounded-full w-12 h-12 items-center justify-center p-2 bg-[#C3A5FF]/50">
                              <Ionicons name="car-sport" size={28} color={Colors.secondary} />
                          </View>
                      </Marker>
                  )}

                  {validUserLocation && validDestination && polylineCoordinates.length > 1 && (
                      <Polyline
                          strokeColor={'#b87f27'}
                          strokeWidth={4}
                          coordinates={polylineCoordinates}
                      />
                  )}
              </MapView>

              {!isFollowing && validUserLocation && (
                  <TouchableOpacity
                      onPress={recenterOnVendor}
                      style={{
                          position: 'absolute',
                          right: 20,
                          bottom: (contentHeight || 0) + 24,
                          zIndex: 30,
                          backgroundColor: Colors.primary,
                      }}
                      className="w-12 h-12 rounded-full items-center justify-center shadow-lg"
                  >
                      <MaterialCommunityIcons name="crosshairs-gps" size={26} color={Colors.secondary} />
                  </TouchableOpacity>
              )}

          </View>
          <ServiceInProgress onContentHeightChange={setContentHeight} />
      </SafeAreaView>
  );
};

export default Progress;
