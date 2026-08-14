import {useTranslation} from "react-i18next";
import { track, AnalyticsEvent } from '@/utils/analytics';
import {useSession} from "@/contexts/SessionContext";
import {useEffect, useRef, useState} from "react";
import {Colors} from "@/constants/Colors";
import {SafeAreaView} from "react-native-safe-area-context";
import {StatusBar, View} from "react-native";
import BackHeader from "@/components/app/BackHeader";
import {CustomText} from "@/components/CustomText";
import {router} from "expo-router";
import ProgressBar from "@/components/auth/signup/ProgressBar";
import BillingStep from "@/components/complete-profile/Steps/BillingStep";
import ContactsStep from "@/components/complete-profile/Steps/ContactsStep";
import IbanStep from "@/components/complete-profile/Steps/IbanStep";
import CitySurveyStep from "@/components/complete-profile/Steps/CitySurveyStep";
import DocumentsProfileStep from "@/components/complete-profile/Steps/DocumentsProfileStep";
import { VendorDataInterface } from "@/types/session";
import { useAppStateStatus } from "@/contexts/AppStateStatusContext";

export type SignUpData = {
    username: string;
    name: string;
    nif: string;
    email: string;
    date_birthday: Date;
    password: string;
    password_confirmation: string;
    phone_number: string;
    language: string;
    gender_id: number;
    price_rate: number;
};

enum VerifySteps {
    'instructions' = 0,
    // `billing` funde o antigo acesso à AT + morada de faturação num só passo.
    'billing' = 1,
    'iban' = 2,
    // `contacts` funde a verificação de telemóvel + email num só ecrã.
    'contacts' = 3,
    'citySurvey' = 4,
    'documents' = 5,
}

/**
 * Ordem REAL de apresentação (os documentos são o primeiro ecrã).
 * A barra de progresso segue esta ordem — usar o valor do enum dava
 * 100% logo no arranque e depois caía.
 *
 * Passou de 8 para 5 passos: as permissões deixaram de ser um ecrã (pedidas no
 * momento em que fazem falta), o acesso à AT + morada de faturação fundiram-se
 * em `billing`, e a verificação de telemóvel + email fundiram-se em `contacts`.
 */
const DISPLAY_ORDER: VerifySteps[] = [
    VerifySteps.documents,
    VerifySteps.billing,
    VerifySteps.iban,
    VerifySteps.contacts,
    VerifySteps.citySurvey,
];

const CompleteProfile = () => {
    // Entrada no completar-perfil: marca o início da 2.ª metade do onboarding.
    useEffect(() => {
        track(AnalyticsEvent.ONBOARDING_STARTED, { flow: 'complete_profile' });
    }, []);

    const { t } = useTranslation();
    const { vendorData, isLoadingUserData, fetchAndSaveUserData } = useSession();
    const { appStateStatus } = useAppStateStatus();
    const [step, setStep] = useState<VerifySteps>(VerifySteps.instructions);
    const [docsStepDone, setDocsStepDone] = useState(false);
    // Os concelhos não têm sinal persistente de "feito" no vendorData; um flag
    // de sessão evita que reapareçam depois de passados (ex.: ao adiar os
    // contactos, o encaminhamento voltaria a cair no survey).
    const [surveyStepDone, setSurveyStepDone] = useState(false);
    // Passos adiados nesta sessão ("faço isto mais tarde"). Sem isto, o
    // goToNextDataStep reencaminhava para o mesmo passo enquanto o dado
    // faltasse — carregar em "mais tarde" não saía dali.
    const [skipped, setSkipped] = useState<VerifySteps[]>([]);
    const skipStep = (which: VerifySteps) => {
        const next = skipped.includes(which) ? skipped : [...skipped, which];
        setSkipped(next);
        goToNextDataStep(vendorData as VendorDataInterface, next, surveyStepDone);
    };

    const totalSteps = DISPLAY_ORDER.length;
    const currentStepNumber = Math.max(DISPLAY_ORDER.indexOf(step), 0) + 1;
    const hasInitialized = useRef(false);

    useEffect(() => {
        // Começa sempre pelos documentos (saltável), mesmo antes de vendorData carregar.
        handleNextStep(vendorData as VendorDataInterface);
    }, []);

    useEffect(() => {
        if (!hasInitialized.current) {
            hasInitialized.current = true;
            return;
        }
        if (appStateStatus !== 'active' || isLoadingUserData) return;
        handleGoBack();
    }, [appStateStatus, isLoadingUserData]);

    const handleGoBack = () => {
        if (
            !vendorData?.at_user ||
            !vendorData?.company_address ||
            !vendorData?.iban ||
            vendorData?.user?.phone_number_verified_at === null ||
            vendorData?.user?.email_verified_at === null
        ) {
            return;
        }
        if (router.canGoBack()) {
            return router.back();
        }
        router.replace('/(app)/(tabs)/home');
    }

    const handleSurveyComplete = () => {
        track(AnalyticsEvent.ONBOARDING_COMPLETED);
        fetchAndSaveUserData();
        // Fecho com expectativas (prazo de análise, como será avisado) em vez
        // de largar o técnico na Home sem saber se acabou.
        router.replace('/(app)/(pages)/(onboarding-success)/onboarding-success');
    };

    const goToNextDataStep = (
        data: VendorDataInterface,
        adiados: VerifySteps[] = skipped,
        surveyDone: boolean = surveyStepDone,
    ) => {
        const phoneMissing = !data?.user?.phone_number_verified_at;
        const emailMissing = !data?.user?.email_verified_at;
        // `billing` = só o acesso à AT; a morada passou para o passo do IBAN.
        if (!data?.at_user && !adiados.includes(VerifySteps.billing)) {
            setStep(VerifySteps.billing);
        } else if ((!data?.iban || !data?.company_address) && !adiados.includes(VerifySteps.iban)) {
            // `iban` cobre pagamento + morada de faturação.
            setStep(VerifySteps.iban);
        } else if ((phoneMissing || emailMissing) && !adiados.includes(VerifySteps.contacts)) {
            // `contacts` cobre telemóvel + email no mesmo ecrã.
            setStep(VerifySteps.contacts);
        } else if (!surveyDone) {
            setStep(VerifySteps.citySurvey);
        } else {
            handleSurveyComplete();
        }
    };

    const handleNextStep = (data: VendorDataInterface) => {
        // Documentos primeiro (saltável, "enviar mais tarde"); auto-salta se não faltarem documentos.
        if (!docsStepDone) {
            setStep(VerifySteps.documents);
        } else {
            goToNextDataStep(data);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-bg">
            <StatusBar backgroundColor={Colors.bg} barStyle="light-content" />

            <BackHeader
                backButtonColor="secondary"
                middleItem={() => (
                    <CustomText
                        size="medium"
                        color="secondary"
                        boldness="medium"
                    >
                        {t('complete_profile.header')}
                    </CustomText>
                )}
                otherClasses="p-5"
                onBack={() => {
                    if (router.canGoBack()) {
                        return router.back();
                    }
                    router.replace('/(app)/(tabs)/home');
                }}
            />

            <View className="px-5">
                <CustomText color="muted" size="small" boldness="semiBold" classes="mb-2">
                    {t('auth.sign_up.step_counter', { current: currentStepNumber, total: totalSteps })}
                </CustomText>
                <ProgressBar percentage={(currentStepNumber / totalSteps) * 100} />
            </View>

            <View className="flex-1">
                {step === VerifySteps.billing && (
                    <BillingStep
                        onNext={(data: VendorDataInterface) => handleNextStep(data)}
                        onSkip={() => skipStep(VerifySteps.billing)}
                    />
                )}
                {step === VerifySteps.iban && (
                    <IbanStep
                        onNext={(data: VendorDataInterface) => handleNextStep(data)}
                        onSkip={() => skipStep(VerifySteps.iban)}
                    />
                )}
                {step === VerifySteps.contacts && (
                    <ContactsStep
                        onNext={(data: VendorDataInterface) => handleNextStep(data)}
                        onSkip={() => skipStep(VerifySteps.contacts)}
                    />
                )}
                {step === VerifySteps.citySurvey && (
                    <CitySurveyStep onNext={() => { setSurveyStepDone(true); goToNextDataStep(vendorData as VendorDataInterface, skipped, true); }} />
                )}
                {step === VerifySteps.documents && (
                    <DocumentsProfileStep onNext={() => { setDocsStepDone(true); goToNextDataStep(vendorData as VendorDataInterface); }} />
                )}
            </View>
        </SafeAreaView>
    );
}

export default CompleteProfile
