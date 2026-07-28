import React from 'react'
import { useTranslation } from "react-i18next";
import { ScrollView } from 'react-native-gesture-handler';
import { ListCard } from '@/components/ui';
import { VendorDataInterface } from "@/types/session";
import IBAN from "iban";

interface PaymentProps {
    vendorData: VendorDataInterface | null
}

const Payment = ({ vendorData }: PaymentProps) => {
  const { t } = useTranslation();

  const items = [
    {
      key: 'iban',
      label: t('profile.my_profile.iban'),
      value: vendorData?.iban ? IBAN.printFormat(vendorData?.iban) : t('profile.payments.empty_iban'),
    },
    {
      key: 'price_rate',
      label: t('profile.payments.price_rate'),
      value: vendorData?.price_rate ? `${vendorData?.price_rate}€` : t('profile.payments.empty_price_rate'),
    },
    {
      key: 'company_name',
      label: t('profile.payments.company_name'),
      value: vendorData?.company_name ? vendorData?.company_name : t('profile.payments.empty_company_name'),
    },
    {
      key: 'company_address',
      label: t('profile.payments.company_address'),
      value: vendorData?.company_address ? vendorData?.company_address : t('profile.payments.empty_company_address'),
    },
    {
      key: 'at_user',
      label: t('profile.payments.at_user'),
      value: vendorData?.at_user ? vendorData?.at_user : t('profile.payments.empty_at_user'),
    },
  ];

  return (
    <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 32 }}>
      <ListCard items={items} />
    </ScrollView>
  );
}

export default Payment
