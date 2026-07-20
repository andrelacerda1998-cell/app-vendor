import TouchOpacity from "@/components/TouchOpacity";
import {CustomText} from "@/components/CustomText";
import {View} from "react-native";
import React from "react";
import {useTranslation} from "react-i18next";

export type AcceptRejectType = {
  id: string|null;
  service_id: string|null;
  accepted: boolean;
}

const AcceptReject = ({ id, serviceId, setSelected }: any) => {
  const { t } = useTranslation();

  return (
    <View className="flex-row justify-between space-x-3">
      <TouchOpacity
        rounded="lg"
        itemsCenter
        bgColor="support_primary"
        otherClasses="py-3 mt-2 flex-1"
        onPress={() => setSelected({id: id, service_id: serviceId, accepted: true})}
      >
        <CustomText color="primary" boldness="medium">
          {t('services.service.proposal.accept')}
        </CustomText>
      </TouchOpacity>
      <TouchOpacity
        rounded="lg"
        itemsCenter
        border
        borderColor="support_primary"
        otherClasses="py-3 mt-2 flex-1"
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