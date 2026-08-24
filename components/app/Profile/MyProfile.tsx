import React from 'react'
import { useTranslation } from "react-i18next";
import { ScrollView } from 'react-native-gesture-handler';
import { ListCard } from '@/components/ui';
import { VendorDataInterface } from "@/types/session";
import { parseValidDate } from "@/utils/date";

interface MyProfileProps {
  vendorData: VendorDataInterface | null
}

const MyProfile: React.FC<MyProfileProps> = ({
  vendorData
}) => {
  const { t } = useTranslation();

  const formatDate = (dateString?: string | null) => {
    const date = parseValidDate(dateString);
    if (!date) return "—";
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' };
    return date.toLocaleDateString('en-GB', options);
  };

  const items = [
    {
      key: 'birth_date',
      label: t('profile.my_profile.birth_date'),
      value: formatDate(vendorData?.user.date_birthday),
    },
    {
      key: 'nif',
      label: t('profile.my_profile.nif'),
      value: vendorData?.user.nif ? String(vendorData.user.nif) : '—',
    },
    {
      key: 'phone_number',
      label: t('profile.my_profile.phone_number'),
      value: vendorData?.user.phone_number ? String(vendorData.user.phone_number) : '—',
    },
    {
      key: 'password',
      label: t('profile.my_profile.password'),
      value: '••••••••••••',
    },
  ];

  return (
    <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 32 }}>
      <ListCard items={items} />
    </ScrollView>
  )
}

export default MyProfile
