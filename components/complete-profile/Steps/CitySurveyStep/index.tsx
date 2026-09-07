import { CustomText } from '@/components/CustomText';
import CustomTextInput from '@/components/CustomTextInput';
import CustomTouchableOpacity from '@/components/CustomTouchableOpacity';
import { API_ROUTES } from '@/constants/ApiRoutes';
import { Colors } from '@/constants/Colors';
import { useApi } from '@/contexts/ApiContext';
import { CityInterface } from '@/types/cities';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, TouchableOpacity, View } from 'react-native';

const MIN_AVAILABLE = 3;

// Pesquisa tolerante a acentos e maiusculas: "sao" encontra "São".
const normalize = (s: string) =>
    s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

const CitySurveyStep = ({ onNext }: { onNext: () => void }) => {
    const { t } = useTranslation();
    const { api } = useApi();

    const [catalog, setCatalog] = useState<CityInterface[]>([]);
    const [availableIds, setAvailableIds] = useState<number[]>([]);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        api.get(API_ROUTES.VENDOR_CITIES_GET)
            .then((res) => {
                const data = res.data.data;
                setCatalog(data.cities ?? []);
                setAvailableIds(data.selected?.available_city_ids ?? []);
            })
            .finally(() => setLoading(false));
    }, []);

    const byId = useMemo(() => {
        const m = new Map<number, CityInterface>();
        catalog.forEach((c) => m.set(c.id, c));
        return m;
    }, [catalog]);

    // Mostradas sem pesquisa: as sugeridas MAIS todas as ativas. As ativas são
    // onde o técnico já pode receber pedidos, por isso nunca ficam escondidas.
    const suggested = useMemo(
        () => catalog.filter((c) => c.suggested || c.active),
        [catalog],
    );

    // Sugeridas agrupadas por distrito; distritos com cidades ativas primeiro,
    // depois por ordem alfabética.
    const groupedSuggested = useMemo(() => {
        const groups: Record<string, CityInterface[]> = {};
        suggested.forEach((c) => {
            (groups[c.district] ??= []).push(c);
        });
        return Object.entries(groups).sort(([a, ca], [b, cb]) => {
            const aActive = ca.some((c) => c.active) ? 0 : 1;
            const bActive = cb.some((c) => c.active) ? 0 : 1;
            if (aActive !== bActive) return aActive - bActive;
            return a.localeCompare(b);
        });
    }, [suggested]);

    const results = useMemo(() => {
        const q = normalize(query);
        if (!q) return [];
        return catalog.filter((c) => normalize(c.name).includes(q)).slice(0, 30);
    }, [query, catalog]);

    const toggleAvailable = (id: number) => {
        setAvailableIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    };


    const canContinueAvailable = availableIds.length >= MIN_AVAILABLE;


    const submit = () => {
        setSubmitting(true);
        api.post(API_ROUTES.VENDOR_CITIES_SAVE, {
            available_city_ids: availableIds,
        })
            .then(() => onNext())
            .finally(() => setSubmitting(false));
    };


    // Botão-cidade em grelha (fase disponíveis: sugeridas / fase preferidas: escolha do top).
    const CityTile = ({
        city,
        selected,
        badge,
        onPress,
    }: {
        city: CityInterface;
        selected: boolean;
        badge?: number;
        onPress: () => void;
    }) => (
        <View style={{ width: '48%' }}>
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={onPress}
                style={{
                    backgroundColor: selected ? Colors.support_primary + '20' : Colors.card_high,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: selected ? Colors.support_primary : Colors.card_high,
                    paddingHorizontal: 12,
                    height: 60, // altura fixa: cartões iguais com ou sem "Ativa"
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                }}
            >
                {badge ? (
                    <View
                        style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            backgroundColor: Colors.support_primary,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <CustomText size="extraSmall" color="on_brand" boldness="bold">
                            {String(badge)}
                        </CustomText>
                    </View>
                ) : null}
                <View style={{ flex: 1 }}>
                    <CustomText
                        size="small"
                        color={selected ? 'support_primary' : 'secondary'}
                        boldness="semiBold"
                        numberOfLines={1}
                    >
                        {city.name}
                    </CustomText>
                    {/* Cidades já ativas na Piquet: verde, para se distinguirem. */}
                    {city.active && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success }} />
                            <CustomText size="extraSmall" color="success" boldness="regular">
                                {t('complete_profile.cities.active_label')}
                            </CustomText>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        </View>
    );

    const selectedCountLabel =
        availableIds.length === 1
            ? t('complete_profile.cities.selected_count_one')
            : t('complete_profile.cities.selected_count_other', { count: availableIds.length });

    const StatusPill = ({ done, label }: { done: boolean; label: string }) => (
        <View
            style={{
                alignSelf: 'flex-start',
                backgroundColor: (done ? Colors.success : Colors.gray_medium) + '33',
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 4,
                marginTop: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
            }}
        >
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: done ? Colors.success : Colors.gray_light }} />
            <CustomText size="small" color={done ? 'success' : 'gray_light'} boldness="semiBold">
                {label}
            </CustomText>
        </View>
    );

    if (loading) {
        return (
            <View className="flex-1 p-5">
                <View className="h-6 rounded opacity-50 mb-3" style={{ width: '80%', backgroundColor: Colors.gray_strong }} />
                <View className="h-4 rounded opacity-40 mb-6" style={{ width: '90%', backgroundColor: Colors.gray_strong }} />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {Array.from({ length: 8 }).map((_, j) => (
                        <View key={j} className="h-12 rounded-xl opacity-40" style={{ width: '48%', backgroundColor: Colors.gray_strong }} />
                    ))}
                </View>
            </View>
        );
    }

    // ---------- FASE 1: disponíveis ----------
    return (
        <View className="flex-1 p-5">
            <View className="mb-2">
                <CustomText size="large" color="secondary" boldness="bold">
                    {t('complete_profile.cities.available_title')}
                </CustomText>
                <CustomText size="small" color="muted" boldness="regular" classes="mt-1">
                    {t('complete_profile.cities.available_subtitle')}
                </CustomText>
                <StatusPill
                    done={canContinueAvailable}
                    label={
                        canContinueAvailable
                            ? selectedCountLabel
                            : t('complete_profile.cities.min_progress', { count: availableIds.length })
                    }
                />
            </View>

            {/* Pesquisa/autocomplete */}
            <CustomTextInput
                size="medium"
                fontSize="medium"
                textBoldness="regular"
                textColor="secondary"
                text={query}
                onChangeText={setQuery}
                placeholder={t('complete_profile.cities.search_placeholder')}
                classes="mb-3"
            />

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {query ? (
                    // Resultados da pesquisa
                    results.length > 0 ? (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {results.map((city) => (
                                <CityTile
                                    key={city.id}
                                    city={city}
                                    selected={availableIds.includes(city.id)}
                                    onPress={() => toggleAvailable(city.id)}
                                />
                            ))}
                        </View>
                    ) : (
                        <CustomText size="small" color="muted" boldness="regular">
                            {t('complete_profile.cities.no_results', { query })}
                        </CustomText>
                    )
                ) : (
                    // Sugeridas em destaque, agrupadas por distrito
                    <View style={{ gap: 20 }}>
                        {groupedSuggested.map(([district, cities]) => (
                            <View key={district}>
                                <CustomText size="extraSmall" color="muted" boldness="semiBold" classes="mb-3 tracking-widest">
                                    {district.toUpperCase()}
                                </CustomText>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                    {cities.map((city) => (
                                        <CityTile
                                            key={city.id}
                                            city={city}
                                            selected={availableIds.includes(city.id)}
                                            onPress={() => toggleAvailable(city.id)}
                                        />
                                    ))}
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            <View className="pt-5">
                <CustomTouchableOpacity
                    size="large"
                    type="support_primary"
                    textColor="on_brand"
                    textBoldness="bold"
                    text={t('complete_profile.cities.continue')}
                    onPress={submit}
                    disabled={!canContinueAvailable || submitting}
                />
            </View>
        </View>
    );
};

export default CitySurveyStep;
