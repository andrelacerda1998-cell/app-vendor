import {useTranslation} from "react-i18next";
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
}

const CompleteProfile = () => {
    const { t } = useTranslation();
    const { vendorData, isLoadingUserData, fetchAndSaveUserData } = useSession();
    const { appStateStatus } = useAppStateStatus();
    const [step, setStep] = useState<VerifySteps>(VerifySteps.instructions);

    const maxStep = Object.keys(VerifySteps).length / 2 - 1;
    const hasInitialized = useRef(false);

    useEffect(() => {
        if (vendorData) handleNextStep(vendorData);
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
        fetchAndSaveUserData();
        if (router.canGoBack()) {
            return router.back();
        }
        router.replace('/(app)/(tabs)/home');
    };

    const handleNextStep = (data: VendorDataInterface) => {
        if (
            !data?.at_user
        ) {
            setStep(VerifySteps.atUser);
        } else if (
            !data?.company_address
        ) {
            setStep(VerifySteps.companyAddress);
        } else if (
            !data?.iban
        ) {
            setStep(VerifySteps.iban);
        } else if (
            data?.user?.phone_number_verified_at === null
        ) {
            setStep(VerifySteps.phoneVerification);
        } else if (
            data?.user?.email_verified_at === null
        ) {
            setStep(VerifySteps.citySurvey);
        } else {
            handleSurveyComplete();
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-primary">
            <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />

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

            <ProgressBar percentage={(step / maxStep) * 100} />

            <View className="flex-1">
                {step === VerifySteps.atUser && <AtUserStep onNext={(data: VendorDataInterface) => handleNextStep(data)} />}
                {step === VerifySteps.phoneVerification && (
                    <View className="flex-1 p-5">
                        <SmsVerification onNext={(data: VendorDataInterface) => handleNextStep(data)} />
                    </View>
                )}
                {step === VerifySteps.companyAddress && <CompanyAddressStep onNext={(data: VendorDataInterface) => handleNextStep(data)} />}
                {step === VerifySteps.iban && <IbanStep onNext={(data: VendorDataInterface) => handleNextStep(data)} />}
                {step === VerifySteps.citySurvey && (
                    <CitySurveyStep onNext={() => setStep(VerifySteps.emailVerification)} />
                )}
                {step === VerifySteps.emailVerification && (
                    <View className="flex-1 p-5">
                        <EmailConfirmation onNext={(data: VendorDataInterface) => handleNextStep(data)} />
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

export default CompleteProfile
