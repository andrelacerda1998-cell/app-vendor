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
import AtUserStep from "@/components/complete-profile/Steps/AtUserStep";
import SmsVerification from "@/components/SmsVerification";
import CompanyAddressStep from "@/components/complete-profile/Steps/CompanyAddressStep";
import IbanStep from "@/components/complete-profile/Steps/IbanStep";
import EmailConfirmation from "@/components/EmailConfirmation";
import CitySurveyStep from "@/components/complete-profile/Steps/CitySurveyStep";
import DocumentsProfileStep from "@/components/complete-profile/Steps/DocumentsProfileStep";
import PermissionsStep from "@/components/complete-profile/Steps/PermissionsStep";
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
    'atUser' = 1,
    'companyAddress' = 2,
    'iban' = 3,
    'phoneVerification' = 4,
    'citySurvey' = 5,
    'emailVerification' = 6,
    'documents' = 7,
    'permissions' = 8,
}

/**
 * Ordem REAL de apresentação (os documentos são o primeiro ecrã).
 * A barra de progresso segue esta ordem — usar o valor do enum dava
 * 100% logo no arranque (documents = 7) e depois caía para 14%.
 */
const DISPLAY_ORDER: VerifySteps[] = [
    VerifySteps.documents,
    VerifySteps.permissions,
    VerifySteps.atUser,
    VerifySteps.companyAddress,
    VerifySteps.iban,
    VerifySteps.phoneVerification,
    VerifySteps.citySurvey,
    VerifySteps.emailVerification,
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
    const [permissionsStepDone, setPermissionsStepDone] = useState(false);
    // Passos adiados nesta sessão ("faço isto mais tarde"). Sem isto, o
    // goToNextDataStep reencaminhava para o mesmo passo enquanto o dado
    // faltasse — carregar em "mais tarde" não saía dali.
    const [skipped, setSkipped] = useState<VerifySteps[]>([]);
    const skipStep = (which: VerifySteps) => {
        const next = skipped.includes(which) ? skipped : [...skipped, which];
        setSkipped(next);
        goToNextDataStep(vendorData as VendorDataInterface, next);
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

    const goToNextDataStep = (data: VendorDataInterface, adiados: VerifySteps[] = skipped) => {
        if (!data?.at_user && !adiados.includes(VerifySteps.atUser)) {
            setStep(VerifySteps.atUser);
        } else if (!data?.company_address && !adiados.includes(VerifySteps.companyAddress)) {
            setStep(VerifySteps.companyAddress);
        } else if (!data?.iban) {
            setStep(VerifySteps.iban);
        } else if (data?.user?.phone_number_verified_at === null) {
            setStep(VerifySteps.phoneVerification);
        } else if (data?.user?.email_verified_at === null) {
            setStep(VerifySteps.citySurvey);
        } else {
            handleSurveyComplete();
        }
    };

    const handleNextStep = (data: VendorDataInterface) => {
        // Documentos primeiro (saltável, "enviar mais tarde"); auto-salta se não faltarem documentos.
        if (!docsStepDone) {
            setStep(VerifySteps.documents);
        } else if (!permissionsStepDone) {
            setStep(VerifySteps.permissions);
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
                {step === VerifySteps.atUser && (
                    <AtUserStep
                        onNext={(data: VendorDataInterface) => handleNextStep(data)}
                        onSkip={() => skipStep(VerifySteps.atUser)}
                    />
                )}
                {step === VerifySteps.phoneVerification && (
                    <View className="flex-1 p-5">
                        <SmsVerification onNext={(data: VendorDataInterface) => handleNextStep(data)} />
                    </View>
                )}
                {step === VerifySteps.companyAddress && (
                    <CompanyAddressStep
                        onNext={(data: VendorDataInterface) => handleNextStep(data)}
                        onSkip={() => skipStep(VerifySteps.companyAddress)}
                    />
                )}
                {step === VerifySteps.iban && <IbanStep onNext={(data: VendorDataInterface) => handleNextStep(data)} />}
                {step === VerifySteps.citySurvey && (
                    <CitySurveyStep onNext={() => setStep(VerifySteps.emailVerification)} />
                )}
                {step === VerifySteps.emailVerification && (
                    <View className="flex-1 p-5">
                        <EmailConfirmation onNext={(data: VendorDataInterface) => handleNextStep(data)} />
                    </View>
                )}
                {step === VerifySteps.documents && (
                    <DocumentsProfileStep onNext={() => { setDocsStepDone(true); setStep(VerifySteps.permissions); }} />
                )}
                {step === VerifySteps.permissions && (
                    <PermissionsStep onNext={() => { setPermissionsStepDone(true); goToNextDataStep(vendorData as VendorDataInterface); }} />
                )}
            </View>
        </SafeAreaView>
    );
}

export default CompleteProfile
