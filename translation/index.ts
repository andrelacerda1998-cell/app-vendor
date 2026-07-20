import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as resources from './resources';
import * as Localization from "expo-localization";

const language = Localization.getLocales();
const languageTag = language[0].languageTag ?? 'en_US'

i18n
    .use(initReactI18next)
    .init({
        compatibilityJSON: 'v4',
        resources: {
            ...Object.entries(resources).reduce((acc, [key, value]) => {
                console.warn(key)
                return {
                    ...acc,
                    [key]: {
                        translation: value,
                    },
                };
            }, {}),
        },
        lng: languageTag.replace('-', '_').split('_')[0] === 'pt' ? 'pt_PT' : 'en_US',
        fallbackLng: 'pt_PT',
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
