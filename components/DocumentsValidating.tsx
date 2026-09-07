import React from 'react'
import {TouchableOpacity, View} from "react-native"
import { CustomText } from "./CustomText"
import { Feather } from "@expo/vector-icons"
import { Colors } from "@/constants/Colors"
import {useSession} from "@/contexts/SessionContext";
import {useRouter} from "expo-router";
import { useTranslation } from "react-i18next"

/**
 * Aviso de documentos EM VALIDAÇÃO (informativo).
 * Os documentos em falta são cobertos pelo cartão "Precisa de completar o seu perfil"
 * (o fluxo de completar perfil começa precisamente nos documentos) — não duplicar.
 */
const DocumentsValidating = () => {
  const { t } = useTranslation();
  const { vendorData } = useSession();
  const router = useRouter();

  const hasPending = (vendorData?.pending_documents?.length ?? 0) > 0;
  const hasMissing = (vendorData?.missing_documents?.length ?? 0) > 0;

  if (!hasPending || hasMissing) {
    return null;
  }

  return (
    <TouchableOpacity
      onPress={() => router.push('/(app)/(modals)/documents')}
      className="mb-2 flex-row items-center p-4 rounded-2xl border"
      style={{ backgroundColor: Colors.card,  borderColor: Colors.line }}
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: 'rgba(233,162,59,0.15)' }}
      >
        <Feather name="clock" size={20} color={Colors.warning} />
      </View>
      <CustomText color="muted" size="small" numberOfLines={3} classes="flex-1">
        {t('documents_validating.pending')}
      </CustomText>
    </TouchableOpacity>
  )
}

export default DocumentsValidating
