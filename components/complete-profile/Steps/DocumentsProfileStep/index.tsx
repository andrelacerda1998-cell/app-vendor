import React, { useEffect, useState } from 'react';
import { ScrollView, View, ActivityIndicator, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import Modal from 'react-native-modal';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { CustomText } from '@/components/CustomText';
import CustomTouchableOpacity from '@/components/CustomTouchableOpacity';
import { Colors } from '@/constants/Colors';
import { useApi } from '@/contexts/ApiContext';
import { useDialog } from '@/contexts/DialogContext';
import { useSession } from '@/contexts/SessionContext';
import { API_ROUTES } from '@/constants/ApiRoutes';
import i18n from '@/translation';
import DynamicSizingSheet from '@/components/sheets/DynamicSizingSheet';
import XIcon from '@/assets/icons/x';

type DocType = { id: number; name: string; description?: string; uploaded?: boolean };

/**
 * Passo de Documentos do complete-profile (build 12). Carrega mesmo via POST /vendor/documents
 * (autenticado). Tem "Submeter mais tarde" — os documentos podem ficar para depois.
 */
const DocumentsProfileStep = ({ onNext }: { onNext: () => void }) => {
  const { t } = useTranslation();
  const { api } = useApi();
  const { openDialog } = useDialog();
  const { vendorData } = useSession();
  const [types, setTypes] = useState<DocType[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeDoc, setActiveDoc] = useState<DocType | null>(null);

  // Documentos já submetidos (à espera de aprovação) — marcados como concluídos.
  const submittedIds = (vendorData?.pending_documents ?? []).map((d: any) => d.id);

  useEffect(() => {
    api.get(API_ROUTES.GET_DOCUMENTS_TYPES, {
      headers: { 'Accept-Language': i18n.language === 'pt_PT' ? 'pt-pt' : 'en' },
    })
      .then((res: any) => {
        const list: DocType[] = res?.data?.data?.types || [];
        setTypes(list.map((tp) => ({ ...tp, uploaded: submittedIds.includes(tp.id) })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Só avança sozinho se o backend não pedir documentos.
    if (!loading && types.length === 0) onNext();
  }, [loading, types.length]);

  // O backend (CreateVendorDocumentRequest) limita o ficheiro a 2 MB (max:2048).
  const MAX_FILE_BYTES = 2048 * 1024;

  const showError = (subtitle: string) => {
    openDialog({
      icon: <XIcon color={Colors.primary} />,
      title: t('errors.documents_submit.title'),
      subtitle,
      closeAfterMSeconds: 3500,
      closeOnClickOutside: true,
    });
  };

  /** Tamanho em bytes: ImagePicker dá `fileSize`, DocumentPicker dá `size`. */
  const getFileSize = async (file: any): Promise<number | null> => {
    const known = file?.fileSize ?? file?.size;
    if (typeof known === 'number' && known > 0) return known;
    try {
      const res = await fetch(file.uri);
      const blob = await res.blob();
      return blob.size || null;
    } catch {
      return null;
    }
  };

  const openSettingsDialog = (subtitle: string) => {
    setPickerOpen(false);
    openDialog({
      icon: <XIcon color={Colors.primary} />,
      title: t('complete_profile.documents.permission_denied_title'),
      subtitle,
      closeOnClickOutside: true,
      cancelButtonText: t('geolocation.settings_dialog_cancel'),
      successButtonText: t('geolocation.settings_dialog_confirm'),
      onSuccess: () => {
        Linking.openSettings().catch(() => {});
      },
    });
  };

  const upload = async (file: any) => {
    if (!activeDoc) return;
    setPickerOpen(false);

    // Validar o tamanho ANTES de enviar: assim o técnico percebe o que
    // aconteceu em vez de levar um "Ocorreu um erro" genérico do 422.
    const size = await getFileSize(file);
    if (size !== null && size > MAX_FILE_BYTES) {
      setActiveDoc(null);
      showError(t('auth.sign_up.documents.submit.error_file_too_big'));
      return;
    }

    const docId = activeDoc.id;
    setUploadingId(docId);
    try {
      const form = new FormData();
      form.append('type', String(docId));
      form.append('document', {
        uri: file.uri,
        name: file.fileName || file.name || `doc-${docId}.jpg`,
        type: file.mimeType || file.type || 'image/jpeg',
      } as any);
      await api.post(API_ROUTES.POST_DOCUMENTS, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setTypes((prev) => prev.map((d) => (d.id === docId ? { ...d, uploaded: true } : d)));
    } catch (e: any) {
      // 413/422 do lado do servidor: quase sempre é tamanho.
      const status = e?.response?.status;
      const serverErrors = e?.response?.data?.errors?.document;
      const isTooBig = status === 413 || (Array.isArray(serverErrors) && serverErrors.length > 0);
      showError(isTooBig
        ? t('auth.sign_up.documents.submit.error_file_too_big')
        : t('errors.documents_submit.subtitle'));
    } finally {
      setUploadingId(null);
      setActiveDoc(null);
    }
  };

  // quality 0.7 mantém o documento legível e faz o caso comum caber nos 2 MB
  // (uma foto de câmara a quality 1 estoura o limite quase sempre).
  const PICKER_OPTIONS = { allowsEditing: true, quality: 0.7 } as const;

  const pickCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      return openSettingsDialog(t('auth.sign_up.documents.camera_permission_required'));
    }
    const r = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
    if (!r.canceled && r.assets?.length) upload(r.assets[0]);
  };
  const pickLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return openSettingsDialog(t('auth.sign_up.documents.library_permission_required'));
    }
    const r = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    if (!r.canceled && r.assets?.length) upload(r.assets[0]);
  };
  const pickFile = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/jpeg', 'image/png'], copyToCacheDirectory: false });
    if (!r.canceled && r.assets?.length) upload(r.assets[0]);
  };

  const allUploaded = types.length > 0 && types.every((d) => d.uploaded);

  return (
    <View className="flex-1 p-5">
      <CustomText size="subtitle" color="secondary" boldness="bolder" numberOfLines={2}>
        {t('auth.sign_up.documents.title')}
      </CustomText>
      <CustomText color="muted" numberOfLines={3} classes="mt-1">
        {t('auth.sign_up.documents.subtitle')}
      </CustomText>

      <ScrollView className="flex-1 mt-6" showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={Colors.brand} style={{ marginTop: 24 }} />
        ) : (
          <View style={{ gap: 12 }}>
            {types.map((doc) => (
              <View
                key={doc.id}
                className="flex-row items-center bg-card border rounded-2xl p-4"
                style={{ borderColor: Colors.line }}
              >
                <Ionicons
                  name={doc.uploaded ? 'checkmark-circle' : 'document-text-outline'}
                  size={22}
                  color={doc.uploaded ? Colors.success : Colors.muted}
                />
                <View className="flex-1 ml-3">
                  <CustomText color="secondary" boldness="bold" size="medium" numberOfLines={2}>
                    {doc.name}
                  </CustomText>
                  {doc.uploaded ? (
                    <CustomText color="success" size="small" classes="mt-0.5">
                      {t('complete_profile.documents.submitted', { defaultValue: 'Submetido' })}
                    </CustomText>
                  ) : doc.description ? (
                    <CustomText color="muted" size="small" numberOfLines={2} classes="mt-0.5">
                      {doc.description}
                    </CustomText>
                  ) : null}
                </View>
                <CustomTouchableOpacity
                  size="small"
                  type={doc.uploaded ? 'secondary_outline' : 'support_primary'}
                  textColor={doc.uploaded ? 'secondary' : 'on_brand'}
                  textBoldness="bold"
                  text={doc.uploaded
                    ? t('complete_profile.documents.replace', { defaultValue: 'Substituir' })
                    : t('auth.sign_up.documents.document.upload')}
                  disabled={uploadingId === doc.id}
                  onPress={() => { setActiveDoc(doc); setPickerOpen(true); }}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View className="pt-4" style={{ gap: 12 }}>
        <CustomTouchableOpacity
          size="large"
          type="support_primary"
          textColor="on_brand"
          textBoldness="bold"
          text={t('general.continue')}
          onPress={onNext}
          disabled={!allUploaded}
        />
        <CustomTouchableOpacity
          size="large"
          type="transparent"
          textColor="muted"
          textBoldness="regular"
          text={t('complete_profile.documents.later', { defaultValue: 'Submeter documentos mais tarde' })}
          onPress={onNext}
          classes="self-center"
        />
      </View>

      {pickerOpen && (
        <Modal
          isVisible
          animationIn="slideInUp"
          animationOut="slideOutDown"
          backdropColor="rgba(0,0,0,0.7)"
          onBackdropPress={() => setPickerOpen(false)}
          onBackButtonPress={() => setPickerOpen(false)}
        >
          <DynamicSizingSheet
            type="scrollView"
            enablePanDownToClose
            onClose={() => setPickerOpen(false)}
            backgroundStyle={{ backgroundColor: Colors.card }}
            handleComponent={() => null}
          >
            <View className="p-5" style={{ gap: 4 }}>
              {[
                { icon: 'camera', label: t('auth.sign_up.documents.select_file.camera'), onPress: pickCamera },
                { icon: 'image', label: t('auth.sign_up.documents.select_file.library'), onPress: pickLibrary },
                { icon: 'folder', label: t('auth.sign_up.documents.select_file.files'), onPress: pickFile },
              ].map((opt, i) => (
                <CustomTouchableOpacity
                  key={i}
                  size="large"
                  type="transparent"
                  textColor="secondary"
                  textBoldness="semiBold"
                  text={opt.label}
                  onPress={opt.onPress}
                  itemsCenter={false}
                  classes="space-x-3"
                  Icon={() => <Feather name={opt.icon as any} size={22} color={Colors.brand} />}
                />
              ))}
            </View>
          </DynamicSizingSheet>
        </Modal>
      )}
    </View>
  );
};

export default DocumentsProfileStep;
