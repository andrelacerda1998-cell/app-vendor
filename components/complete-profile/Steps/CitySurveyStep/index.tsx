import Checkbox from '@/components/Checkbox';
import { CustomText } from '@/components/CustomText';
import CustomTouchableOpacity from '@/components/CustomTouchableOpacity';
import { API_ROUTES } from '@/constants/ApiRoutes';
import { Colors } from '@/constants/Colors';
import { useApi } from '@/contexts/ApiContext';
import { SurveyCityInterface } from '@/types/survey';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, TouchableOpacity, View } from 'react-native';

const CitySurveyStep = ({ onNext }: { onNext: () => void }) => {
    const { t } = useTranslation();
    const { api } = useApi();
    const [cities, setCities] = useState<SurveyCityInterface[]>([]);
    const [selectedAllowedIds, setSelectedAllowedIds] = useState<number[]>([]);
    const [selectedSurveyIds, setSelectedSurveyIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        api.get(API_ROUTES.VENDOR_SURVEY_GET_CITIES)
            .then((res) => {
                const data: SurveyCityInterface[] = res.data.data.cities;
                setCities(data);
                setSelectedAllowedIds(data.filter((c) => c.type === 'allowed' && c.voted).map((c) => c.id));
                setSelectedSurveyIds(data.filter((c) => c.type === 'survey' && c.voted).map((c) => c.id));
                if (data.length === 0) onNext();
            })
            .finally(() => setLoading(false));
    }, []);

    const isSelected = (city: SurveyCityInterface) =>
        city.type === 'allowed'
            ? selectedAllowedIds.includes(city.id)
            : selectedSurveyIds.includes(city.id);

    const toggleCity = (city: SurveyCityInterface) => {
        if (city.type === 'allowed') {
            setSelectedAllowedIds((prev) =>
                prev.includes(city.id) ? prev.filter((x) => x !== city.id) : [...prev, city.id]
            );
        } else {
            setSelectedSurveyIds((prev) =>
                prev.includes(city.id) ? prev.filter((x) => x !== city.id) : [...prev, city.id]
            );
        }
    };

    const submit = () => {
        setSubmitting(true);
        api.post(API_ROUTES.VENDOR_SURVEY_VOTE, {
            allowed_zone_ids: selectedAllowedIds,
            survey_city_ids: selectedSurveyIds,
        })
            .then(() => onNext())
            .finally(() => setSubmitting(false));
    };

    const groupedDistricts = cities.reduce<Record<string, SurveyCityInterface[]>>((acc, city) => {
        const key = city.district ?? '';
        if (!acc[key]) acc[key] = [];
        acc[key].push(city);
        return acc;
    }, {});

    const districtEntries = Object.entries(groupedDistricts);

    const selectedCount = selectedAllowedIds.length + selectedSurveyIds.length;

    return (
        <View className="flex-1 p-5">
            <View className="mb-4">
                <CustomText size="large" color="secondary" boldness="bold">
                    {t('complete_profile.survey.title')}
                </CustomText>
                <CustomText size="small" color="muted" boldness="regular" classes="mt-1">
                    {t('complete_profile.survey.subtitle')}
                </CustomText>
                {selectedCount > 0 && (
                    <View
                        style={{
                            alignSelf: 'flex-start',
                            backgroundColor: Colors.support_primary + '33',
                            borderRadius: 999,
                            paddingHorizontal: 12,
                            paddingVertical: 4,
                            marginTop: 10,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.support_primary }} />
                        <CustomText size="small" color="support_primary" boldness="semiBold">
                            {t('complete_profile.survey.zones_selected_other', { count: selectedCount })}
                        </CustomText>
                    </View>
                )}
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View style={{ gap: 16 }}>
                        {Array.from({ length: 3 }).map((_, i) => (
                            <View key={i}>
                                <View className="h-4 bg-gray_strong rounded opacity-50 mb-3" style={{ width: '50%' }} />
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                    {[0, 1, 2, 3].map((j) => (
                                        <View key={j} className="h-14 bg-gray_strong rounded-xl opacity-40" style={{ width: '48%' }} />
                                    ))}
                                </View>
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={{ gap: 20 }}>
                        {districtEntries.map(([district, districtCities]) => {
                            const isAvailable = districtCities.some((c) => c.active);
                            return (
                                <View key={district}>
                                    <CustomText
                                        size="extraSmall"
                                        color="muted"
                                        boldness="semiBold"
                                        classes="mb-3 tracking-widest"
                                    >
                                        {district
                                            ? `${district.toUpperCase()} — ${isAvailable
                                                ? t('complete_profile.survey.district_available')
                                                : t('complete_profile.survey.district_coming_soon')}`
                                            : (isAvailable
                                                ? t('complete_profile.survey.district_available')
                                                : t('complete_profile.survey.district_coming_soon'))}
                                    </CustomText>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                        {districtCities.map((city) => {
                                            const selected = isSelected(city);
                                            return (
                                                <View
                                                    key={city.id}
                                                    style={{ width: '48%' }}
                                                >
                                                    <TouchableOpacity
                                                        activeOpacity={0.7}
                                                        onPress={() => toggleCity(city)}
                                                        style={{
                                                            backgroundColor: selected ? Colors.support_primary + '20' : Colors.card_high,
                                                            borderRadius: 10,
                                                            borderWidth: 1,
                                                            borderColor: selected ? Colors.support_primary : Colors.card_high,
                                                            paddingHorizontal: 10,
                                                            paddingVertical: 10,
                                                            flexDirection: 'column',
                                                            alignItems: 'flex-start',
                                                            gap: 6,
                                                        }}
                                                    >
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                            <Checkbox
                                                                size="small"
                                                                label=""
                                                                checked={selected}
                                                                onChange={() => toggleCity(city)}
                                                                checkedColor="support_primary"
                                                                checkMarkColor="primary"
                                                                uncheckedBorderColor="muted"
                                                                unCheckedBackgroundColor="primary"
                                                            />
                                                            <CustomText size="small" color="secondary" boldness="semiBold" numberOfLines={1}>
                                                                {city.city}
                                                            </CustomText>
                                                        </View>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 2 }}>
                                                            <View
                                                                style={{
                                                                    width: 6,
                                                                    height: 6,
                                                                    borderRadius: 3,
                                                                    backgroundColor: city.active ? Colors.support_primary : Colors.gray_medium,
                                                                }}
                                                            />
                                                            <CustomText
                                                                size="extraSmall"
                                                                color={city.active ? 'support_primary' : 'muted'}
                                                                boldness="regular"
                                                            >
                                                                {city.active
                                                                    ? t('complete_profile.survey.city_active')
                                                                    : t('complete_profile.survey.city_coming_soon')}
                                                            </CustomText>
                                                        </View>
                                                    </TouchableOpacity>
                                                </View>
                                            );
                                        })}
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>

            <View className="pt-5">
                {/* Cidades forçadas — sem botão "saltar" (o passo auto-avança quando não há cidades) */}
                <CustomTouchableOpacity
                    size="large"
                    type="support_primary"
                    textColor="on_brand"
                    textBoldness="bold"
                    text={t('complete_profile.survey.submit')}
                    onPress={submit}
                    disabled={submitting || selectedCount === 0}
                />
            </View>
        </View>
    );
};

export default CitySurveyStep;
