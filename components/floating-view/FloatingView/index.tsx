import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { useService } from '@/contexts/ServiceContext';
import { useTranslation } from 'react-i18next';
 

const { width } = Dimensions.get('window');

 
const FloatingView: React.FC = () => {
  const { t } = useTranslation();
  const { activeService } = useService();

  if (!activeService) return null;

  return (
    <View
      className="absolute bottom-12 bg-black/70 p-2.5 rounded-lg items-center"
      style={{
        left: width / 4,
        width: width / 2,
        zIndex: 9999,
        borderColor: 'white',
        borderWidth: 1
      }}
    >
       <Text className="text-white font-bold">{t('services.service.open.in_progress')}</Text>              
    </View>
  );
};

export default FloatingView;