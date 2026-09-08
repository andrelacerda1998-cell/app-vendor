import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, View, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, type LatLng } from 'react-native-maps';

// Google só no Android; no iOS o provider nativo (Apple Maps) evita a dependência
// do SDK Google (AirGoogleMaps), que o dev-client iOS não tem linkada.
const MAP_PROVIDER = Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined;
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { CustomText } from '@/components/CustomText';
import { Colors } from '@/constants/Colors';
import { useApi } from '@/contexts/ApiContext';
import { API_ROUTES } from '@/constants/ApiRoutes';
import { getPoints } from '@/utils/map/getPoints';
import decodePolyline from '@/utils/map/decodePolyline';

type Coords = { latitude?: number | null; longitude?: number | null };

// Coordenada plausível: finita, dentro do globo e fora da "null island" (0,0),
// que é o que chega quando ainda não há localização. Sem isto, uma origem a
// (0,0) desenhava um arco a atravessar o Atlântico.
const valid = (c?: Coords | null): c is { latitude: number; longitude: number } =>
  !!c &&
  Number.isFinite(Number(c.latitude)) &&
  Number.isFinite(Number(c.longitude)) &&
  Math.abs(Number(c.latitude)) <= 90 &&
  Math.abs(Number(c.longitude)) <= 180 &&
  !(Math.abs(Number(c.latitude)) < 0.5 && Math.abs(Number(c.longitude)) < 0.5);

/**
 * Pré-visualização do caminho até ao cliente. Não é navegação (isso é dentro
 * das apps de mapas) — é um relance do trajeto que, ao toque, abre o Waze /
 * Google / Apple Maps com o destino preenchido. O mapa em si não recebe
 * gestos (pointerEvents none): o toque é todo do cartão, para o alvo ser o
 * mapa inteiro e não competir com o arrastar.
 */
const ServiceRouteMap = ({
  serviceId,
  destination,
  origin,
  onPress,
}: {
  serviceId?: number | string;
  destination?: Coords | null;
  origin?: Coords | null;
  onPress: () => void;
}) => {
  const { t } = useTranslation();
  const { api } = useApi();
  const mapRef = useRef<MapView | null>(null);
  const [route, setRoute] = useState<LatLng[]>([]);

  const dest = useMemo<LatLng | null>(
    () =>
      valid(destination)
        ? { latitude: Number(destination.latitude), longitude: Number(destination.longitude) }
        : null,
    [destination],
  );
  const start = useMemo<LatLng | null>(
    () =>
      valid(origin)
        ? { latitude: Number(origin.latitude), longitude: Number(origin.longitude) }
        : null,
    [origin],
  );

  // Rota real do backend; se falhar, uma curva entre origem e destino.
  useEffect(() => {
    if (!serviceId) return;
    let active = true;

    api.get(API_ROUTES.VENDOR_GET_SERVICE_ROUTE(serviceId))
      .then((res) => {
        const payload = res.data?.data ?? res.data;
        const raw = payload?.route?.coordinates;
        const encoded = payload?.route?.polyline;
        let coords: LatLng[] = [];

        if (Array.isArray(raw)) {
          coords = raw
            .filter((p: any) => Number.isFinite(p?.latitude) && Number.isFinite(p?.longitude))
            .map((p: any) => ({ latitude: Number(p.latitude), longitude: Number(p.longitude) }));
        }
        if (coords.length < 2 && typeof encoded === 'string') {
          coords = decodePolyline(encoded);
        }
        if (active && coords.length > 1) setRoute(coords);
      })
      .catch(() => {});

    return () => { active = false; };
  }, [api, serviceId]);

  const fallback = useMemo(
    () => (start && dest ? getPoints([start, dest]) : []),
    [start, dest],
  );
  const line = route.length > 1 ? route : fallback;

  // Enquadra a câmara na rota (ou origem+destino, ou só o destino).
  const fit = () => {
    const pts = line.length > 1 ? line : [start, dest].filter(Boolean) as LatLng[];
    if (pts.length > 1 && mapRef.current) {
      mapRef.current.fitToCoordinates(pts, {
        edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
        animated: false,
      });
    }
  };

  useEffect(() => { fit(); }, [line.length, dest, start]);

  if (!dest) return null;

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} className="rounded-2xl overflow-hidden mt-3" style={{ height: 168 }}>
      <View pointerEvents="none" style={{ flex: 1 }}>
        <MapView
          ref={mapRef}
          provider={MAP_PROVIDER}
          style={{ flex: 1 }}
          onMapReady={fit}
          initialRegion={{
            latitude: dest.latitude,
            longitude: dest.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}
        >
          {line.length > 1 && (
            <Polyline coordinates={line} strokeColor={Colors.brand} strokeWidth={4} />
          )}
          {start && (
            <Marker coordinate={start} anchor={{ x: 0.5, y: 0.5 }}>
              <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.support_primary, borderWidth: 2, borderColor: '#fff' }} />
            </Marker>
          )}
          <Marker coordinate={dest} anchor={{ x: 0.5, y: 1 }}>
            <Feather name="map-pin" size={28} color={Colors.brand} />
          </Marker>
        </MapView>
      </View>

      {/* Pista de que é tocável e o que faz. */}
      <View
        className="absolute flex-row items-center rounded-full px-3 py-1.5"
        style={{ bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)' }}
      >
        <Feather name="navigation" size={13} color={Colors.brand} />
        <CustomText size="extraSmall" color="secondary" boldness="bold" classes="ml-1.5">
          {t('services.service.status.open_in_maps')}
        </CustomText>
      </View>
    </TouchableOpacity>
  );
};

export default ServiceRouteMap;
