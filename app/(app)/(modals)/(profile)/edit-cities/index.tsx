import BackHeader from '@/components/app/BackHeader';
import { CustomText } from '@/components/CustomText';
import CitySurveyStep from '@/components/complete-profile/Steps/CitySurveyStep';
import { Colors } from '@/constants/Colors';
import { useDialog } from '@/contexts/DialogContext';
import CheckMark from '@/assets/icons/check-mark';
import { router } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Editar as cidades onde se trabalha, depois do onboarding.
 *
 * O passo das cidades só existia dentro do "Completar perfil": uma vez o
 * perfil completo, não havia forma nenhuma de mudar onde se trabalha. Quem se
 * mudasse, ou quisesse alargar a zona, ficava preso à escolha do primeiro dia.
 *
 * Reutiliza o mesmo passo do onboarding em vez de o duplicar -- assim a regra
 * do mínimo de cidades, a pesquisa e o gravar são exactamente os mesmos.
 */
const EditCities = () => {
    const { t } = useTranslation();
    const { openDialog } = useDialog();

    const voltar = () => {
        if (router.canGoBack()) return router.back();
        return router.push('/(app)/(tabs)/profile');
    };

    const guardado = () => {
        openDialog({
            icon: <CheckMark color={Colors.primary} />,
            title: t('profile.edit.cities_saved_title'),
            subtitle: t('profile.edit.cities_saved_subtitle'),
            closeAfterMSeconds: 2000,
            closeOnClickOutside: true,
            onClose: voltar,
        });
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.primary }}>
            <BackHeader
                backButtonColor="secondary"
                middleItem={() => (
                    <CustomText color="secondary" boldness="medium" numberOfLines={1}>
                        {t('profile.edit.cities_title')}
                    </CustomText>
                )}
                otherClasses="p-5"
            />
            <View className="flex-1 px-5">
                <CitySurveyStep onNext={guardado} submitLabel={t('profile.edit.save_changes')} />
            </View>
        </SafeAreaView>
    );
};

export default EditCities;
