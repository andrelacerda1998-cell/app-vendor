import { CustomText } from '@/components/CustomText'
import { Colors } from '@/constants/Colors'
import React, { useState } from 'react'
import { Control, Controller, FieldErrors, FieldValues, useForm, UseFormHandleSubmit } from 'react-hook-form'
import { View } from 'react-native';
import { ScrollView } from 'react-native'
import { useWindowDimensions } from 'react-native';
import { useTranslation } from "react-i18next"

const InstructionsStep = () => {
    const { t } = useTranslation();
    const { width } = useWindowDimensions();
    const [currentIndex, setCurrentIndex] = useState(0);
    const adjustedWidth = width - 40; // Adjusting for padding (p-5 is 20px on each side)

    const screens = [
        {
            title: t('auth.sign_up.instructions.first_title'),
            description: t('auth.sign_up.instructions.first_description'),
        },
        {
            title: t('auth.sign_up.instructions.second_title'),
            description: t('auth.sign_up.instructions.second_description'),
        },
        {
            title: t('auth.sign_up.instructions.third_title'),
            description: t('auth.sign_up.instructions.third_description'),
        }
    ];

    const handleScroll = (event: any) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / width);
        setCurrentIndex(index);
    };

    return (
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
            <ScrollView
                horizontal
                pagingEnabled
                onScroll={handleScroll}
                scrollEventThrottle={16}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1, alignItems: 'flex-end' }}
            >
                {screens.map((screen, index) => (
                    <View key={index} style={{ width: adjustedWidth }}>
                        <CustomText size="title" color="secondary" boldness="medium" numberOfLines={8}>
                            {screen.title}
                        </CustomText>
                        <CustomText color="gray_medium" numberOfLines={8} classes="mt-2">
                            {screen.description}
                        </CustomText>
                    </View>
                ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', marginBottom: 40, marginTop: 20 }}>
                {screens.map((_, index) => (
                    <View
                        key={index}
                        style={{
                            width: index === currentIndex ? 26 : 8,
                            height: 8,
                            backgroundColor: index === currentIndex ? Colors.support_primary : Colors.gray_medium,
                            marginHorizontal: 5,
                            borderRadius: 999
                        }}
                    />
                ))}
            </View>
        </View>
    )
}

export default InstructionsStep;