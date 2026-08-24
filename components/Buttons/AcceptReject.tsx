import TouchOpacity from "@/components/TouchOpacity";
import {CustomText} from "@/components/CustomText";
import {View} from "react-native";
import React from "react";
import {useTranslation} from "react-i18next";
import SlideToAccept from "@/components/Buttons/SlideToAccept";

export type AcceptRejectType = {
  id: string|null;
  service_id: string|null;
  accepted: boolean;
}

/**
 * Aceitar passou a exigir um ARRASTO (evita aceites acidentais com o telemóvel
 * no bolso); recusar continua a ser um toque. A lógica/endpoints não mudam —
 * continua tudo a passar pelo `setSelected` do ecrã pai.
 */
const AcceptReject = ({ id, serviceId, setSelected, disabled = false }: any) => {
  const { t } = useTranslation();

  return (
    <View className="mt-2">
      <SlideToAccept
        label={t('services.service.proposal.slide_to_accept', { defaultValue: 'Deslizar para aceitar' })}
        disabled={disabled}
        onConfirm={() => setSelected({id: id, service_id: serviceId, accepted: true})}
      />
      <TouchOpacity
        rounded="lg"
        itemsCenter
        border
        borderColor="support_primary"
        otherClasses="py-3 mt-3"
        onPress={() => setSelected({id: id, service_id: serviceId, accepted: false})}
      >
        <CustomText color="support_primary" boldness="medium">
          {t('services.service.proposal.refuse')}
        </CustomText>
      </TouchOpacity>
    </View>
  );
}

export default AcceptReject;
