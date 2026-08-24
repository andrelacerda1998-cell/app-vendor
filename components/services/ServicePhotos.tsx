/**
 * FOTOS ANTES/DEPOIS do trabalho.
 *
 * São OPCIONAIS por decisão do produto: nunca bloqueiam o "Finalizar" nem
 * mostram avisos a impedir. Servem só para o técnico se proteger caso o
 * cliente reclame do estado em que ficou o trabalho.
 */
import React, { useEffect, useState } from 'react';
import { View, Modal, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useTranslation } from 'react-i18next';
import { CustomText } from '@/components/CustomText';
import { Card, SectionHeader, SkeletonBlock, ErrorState } from '@/components/ui';
import { Colors } from '@/constants/Colors';
import { useApi } from '@/contexts/ApiContext';
import { useDialog } from '@/contexts/DialogContext';
import { API_ROUTES } from '@/constants/ApiRoutes';
import XIcon from '@/assets/icons/x';

type Collection = 'before' | 'after';

/** Foto já guardada no servidor. */
interface Photo {
  id: number;
  url: string;
}

/**
 * Foto a ser enviada (ou que falhou). Fica na grelha com o preview local para
 * o técnico ver logo que a foto "entrou", sem esperar pelo servidor.
 */
interface Upload {
  key: string;
  collection: Collection;
  uri: string;
  /** Guardado para o "repetir" não obrigar a tirar a foto outra vez. */
  asset: any;
  failed: boolean;
}

const COLLECTIONS: Collection[] = ['before', 'after'];
const THUMB = 76;

/**
 * O backend (ServicePhotosController) valida `max:10240`, ou seja 10 MB.
 * Validamos ANTES de enviar para o técnico perceber o que se passou em vez de
 * levar um 422 genérico depois de esperar pelo upload.
 */
const MAX_PHOTO_BYTES = 10240 * 1024;

/** `quality: 0.7` mantém o detalhe do trabalho e faz o caso comum caber no limite. */
const PICKER_OPTIONS = { quality: 0.7 } as const;

const ServicePhotos = ({ serviceId, enabled }: { serviceId?: number | string; enabled: boolean }) => {
  const { t } = useTranslation();
  const { api } = useApi();
  const { openDialog } = useDialog();
  const { showActionSheetWithOptions } = useActionSheet();

  const [photos, setPhotos] = useState<Record<Collection, Photo[]>>({ before: [], after: [] });
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const load = async () => {
    if (!serviceId) return;
    setLoadError(false);
    try {
      const r = await api.get(API_ROUTES.VENDOR_SERVICE_PHOTOS(serviceId));
      const data = r?.data?.data?.photos ?? {};
      setPhotos({ before: data.before ?? [], after: data.after ?? [] });
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [serviceId]);

  const showDialog = (title: string, subtitle: string) => {
    openDialog({
      icon: <XIcon color={Colors.primary} />,
      title,
      subtitle,
      closeAfterMSeconds: 4000,
      closeOnClickOutside: true,
    });
  };

  /** Permissão recusada: explicar e oferecer as Definições. Nunca falhar calado. */
  const openSettingsDialog = (subtitle: string) => {
    openDialog({
      icon: <XIcon color={Colors.primary} />,
      title: t('service_photos.permission_denied_title'),
      subtitle,
      closeOnClickOutside: true,
      cancelButtonText: t('geolocation.settings_dialog_cancel'),
      successButtonText: t('geolocation.settings_dialog_confirm'),
      onSuccess: () => {
        Linking.openSettings().catch(() => {});
      },
    });
  };

  /** ImagePicker dá `fileSize`; se faltar, medimos o blob antes de enviar. */
  const getFileSize = async (asset: any): Promise<number | null> => {
    if (typeof asset?.fileSize === 'number' && asset.fileSize > 0) return asset.fileSize;
    try {
      const res = await fetch(asset.uri);
      const blob = await res.blob();
      return blob.size || null;
    } catch {
      return null;
    }
  };

  const send = async (upload: Upload) => {
    setUploads((prev) =>
      prev.some((u) => u.key === upload.key)
        ? prev.map((u) => (u.key === upload.key ? { ...u, failed: false } : u))
        : [...prev, upload],
    );

    try {
      const form = new FormData();
      form.append('collection', upload.collection);
      form.append('photo', {
        uri: upload.asset.uri,
        name: upload.asset.fileName || `${upload.collection}-${Date.now()}.jpg`,
        type: upload.asset.mimeType || 'image/jpeg',
      } as any);

      const r = await api.post(API_ROUTES.VENDOR_SERVICE_PHOTOS(serviceId!), form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const saved = r?.data?.data;
      setUploads((prev) => prev.filter((u) => u.key !== upload.key));
      if (saved?.id && saved?.url) {
        setPhotos((prev) => ({
          ...prev,
          [upload.collection]: [...prev[upload.collection], { id: saved.id, url: saved.url }],
        }));
      } else {
        load();
      }
    } catch {
      setUploads((prev) => prev.map((u) => (u.key === upload.key ? { ...u, failed: true } : u)));
    }
  };

  const addPhoto = async (collection: Collection, asset: any) => {
    const size = await getFileSize(asset);
    if (size !== null && size > MAX_PHOTO_BYTES) {
      showDialog(t('service_photos.error_title'), t('service_photos.error_file_too_big'));
      return;
    }
    send({
      key: `${collection}-${Date.now()}-${Math.random()}`,
      collection,
      uri: asset.uri,
      asset,
      failed: false,
    });
  };

  const pickCamera = async (collection: Collection) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      return openSettingsDialog(t('service_photos.camera_permission_required'));
    }
    const r = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
    if (!r.canceled && r.assets?.length) addPhoto(collection, r.assets[0]);
  };

  const pickLibrary = async (collection: Collection) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return openSettingsDialog(t('service_photos.library_permission_required'));
    }
    const r = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    if (!r.canceled && r.assets?.length) addPhoto(collection, r.assets[0]);
  };

  const openPicker = (collection: Collection) => {
    const options = [
      t('service_photos.camera'),
      t('service_photos.library'),
      t('general.cancel'),
    ];
    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: 2,
        title: collection === 'before'
          ? t('service_photos.add_before')
          : t('service_photos.add_after'),
      },
      (index?: number) => {
        if (index === 0) pickCamera(collection);
        if (index === 1) pickLibrary(collection);
      },
    );
  };

  const Section = ({ collection }: { collection: Collection }) => {
    const saved = photos[collection];
    const pending = uploads.filter((u) => u.collection === collection);
    const empty = saved.length === 0 && pending.length === 0;

    return (
      <View className="mt-4">
        <CustomText color="muted" boldness="bold" size="extraSmall">
          {collection === 'before' ? t('service_photos.before') : t('service_photos.after')}
        </CustomText>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-2"
          contentContainerStyle={{ gap: 8 }}
        >
          {saved.map((p) => (
            <TouchableOpacity
              key={p.id}
              activeOpacity={0.85}
              onPress={() => setPreview(p.url)}
              style={{ width: THUMB, height: THUMB, borderRadius: 12, overflow: 'hidden' }}
            >
              <Image
                source={{ uri: p.url }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                transition={150}
              />
            </TouchableOpacity>
          ))}

          {pending.map((u) => (
            <TouchableOpacity
              key={u.key}
              activeOpacity={u.failed ? 0.85 : 1}
              disabled={!u.failed}
              onPress={() => send(u)}
              style={{ width: THUMB, height: THUMB, borderRadius: 12, overflow: 'hidden' }}
            >
              <Image
                source={{ uri: u.uri }}
                style={{ width: '100%', height: '100%', opacity: 0.4 }}
                contentFit="cover"
              />
              <View
                className="absolute inset-0 items-center justify-center"
                style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
              >
                {u.failed ? (
                  <>
                    <Feather name="rotate-ccw" size={18} color={Colors.danger} />
                    <CustomText size="extraSmall" color="danger" boldness="bold" classes="mt-0.5">
                      {t('general.try_again')}
                    </CustomText>
                  </>
                ) : (
                  <ActivityIndicator size="small" color={Colors.brand} />
                )}
              </View>
            </TouchableOpacity>
          ))}

          {enabled && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => openPicker(collection)}
              className="items-center justify-center border"
              style={{
                width: THUMB,
                height: THUMB,
                borderRadius: 12,
                borderColor: Colors.line,
                borderStyle: 'dashed',
                backgroundColor: Colors.card_high,
              }}
            >
              <Feather name="camera" size={20} color={Colors.brand} />
              <CustomText size="extraSmall" color="muted" classes="mt-0.5">
                {t('service_photos.add')}
              </CustomText>
            </TouchableOpacity>
          )}

          {/* Sem fotos e já não dá para acrescentar: dizer que ficou sem registo. */}
          {empty && !enabled && (
            <View className="justify-center" style={{ height: THUMB }}>
              <CustomText size="small" color="muted">
                {t('service_photos.none')}
              </CustomText>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  if (!serviceId) return null;

  return (
    <Card className="mt-3">
      {/* "Recomendado" e não "Obrigatório": as fotos protegem o técnico, mas
          nunca bloqueiam a conclusão do serviço. */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 pr-3">
          <Feather name="camera" size={16} color={Colors.muted} />
          <CustomText size="medium" color="secondary" boldness="bolder" classes="ml-2" numberOfLines={1}>
            {t('service_photos.title')}
          </CustomText>
        </View>
        <CustomText size="extraSmall" color="muted" numberOfLines={1}>
          {t('service_photos.recommended')}
        </CustomText>
      </View>

      <CustomText size="extraSmall" color="muted" numberOfLines={3} classes="mt-1">
        {t('service_photos.hint')}
      </CustomText>

      {loading ? (
        <View className="flex-row mt-4" style={{ gap: 8 }}>
          {[0, 1, 2].map((i) => (
            <SkeletonBlock key={i} width={THUMB} height={THUMB} radius={12} />
          ))}
        </View>
      ) : loadError ? (
        <View className="mt-3">
          <ErrorState
            title={t('service_photos.error_load_title')}
            subtitle={t('service_photos.error_load_subtitle')}
            onRetry={load}
          />
        </View>
      ) : (
        COLLECTIONS.map((c) => <Section key={c} collection={c} />)
      )}

      {/* Miniatura em grande */}
      <Modal
        visible={!!preview}
        transparent
        animationType="fade"
        onRequestClose={() => setPreview(null)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setPreview(null)}
          className="flex-1 items-center justify-center p-5"
          style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}
        >
          {!!preview && (
            <Image
              source={{ uri: preview }}
              style={{ width: '100%', height: '70%' }}
              contentFit="contain"
            />
          )}
          <View className="flex-row items-center mt-5">
            <Feather name="x" size={16} color={Colors.muted} />
            <CustomText size="small" color="muted" classes="ml-2">
              {t('service_photos.close_preview')}
            </CustomText>
          </View>
        </TouchableOpacity>
      </Modal>
    </Card>
  );
};

export default ServicePhotos;
