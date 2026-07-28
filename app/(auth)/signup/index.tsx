import { useEffect, useState } from 'react';
import { track, AnalyticsEvent } from '@/utils/analytics';
import { router } from 'expo-router';
import { Linking, View } from 'react-native';
import ProgressBar from "@/components/auth/signup/ProgressBar";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm } from 'react-hook-form';
import { API_ROUTES } from '@/constants/ApiRoutes';
import axios, { AxiosError } from 'axios';
import PersonalInformationStep from '@/components/auth/signup/Steps/PersonalInformationStep';
import SkillsSelectionStep from '@/components/auth/signup/Steps/SkillsSelectionStep';
import PasswordStep from '@/components/auth/signup/Steps/PasswordStep';
import { useSession } from '@/contexts/SessionContext';
import PriceRateStep from '@/components/auth/signup/Steps/PriceRateStep';
import BackHeader from '@/components/app/BackHeader';
import { CustomText } from '@/components/CustomText';
import CustomTouchableOpacity from '@/components/CustomTouchableOpacity';
import InstructionsStep from '@/components/auth/signup/Steps/IntructionsStep';
import { useApi } from "@/contexts/ApiContext";
import { useTranslation } from "react-i18next";
import i18n from "@/translation";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Colors } from "@/constants/Colors";
import { StatusBar } from "react-native";
import { useDialog } from "@/contexts/DialogContext";
import { ServiceTypeInterface } from "@/types/services";
import XIcon from "@/assets/icons/x";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Rascunho do registo. Guardamos SÓ campos não sensíveis — NUNCA a palavra-passe
 * nem a sua confirmação — para o técnico não perder tudo se fechar a app.
 */
const SIGNUP_DRAFT_KEY = '@piquet_vendor_signup_draft_v1';

type GenderOption = { id: number; name: string };

type SignUpDocument = {
    id: number | string;
    file?: { uri: string; name?: string; mimeType?: string };
};

type SignUpDraft = {
    name?: string;
    username?: string;
    nif?: string;
    email?: string;
    phone_number?: string;
    date_birthday?: string;
    gender_id?: number;
    price_rate?: number;
    services_types?: number[];
    step?: number;
};

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

enum SignUpSteps {
    'instructions' = 0,
    'personalInformation' = 1,
    'skillsInformation' = 2,
    'pricePerHour' = 3,
    'password' = 4,
}

const SignUp = () => {
    const { t } = useTranslation();
    const { setSession } = useSession();
    const { openDialog } = useDialog();
    const [step, setStep] = useState<SignUpSteps>(SignUpSteps.personalInformation);
    const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [signUpError, setSignUpError] = useState<string | null>(null);
    const [availableOperationAreas, setAvailableOperationAreas] = useState([]);
    const [selectedServicesTypes, setSelectedServicesTypes] = useState<ServiceTypeInterface['id'][]>([]);
    const [documents, setDocuments] = useState<SignUpDocument[]>([]);
    const [availableGenders, setAvailableGenders] = useState<GenderOption[]>([]);
    const maxStep = Object.keys(SignUpSteps).length / 2 - 1;
    const { api } = useApi();

    useEffect(() => {
        getAvailableOperationAreas();
    }, []);

    const [draftRestored, setDraftRestored] = useState(false);

    const { control, handleSubmit, setValue, getValues, watch, formState: { errors, isLoading, isValid }, setError } = useForm<SignUpData>({
        mode: 'onChange',
        defaultValues: {
            username: '',
            name: '',
            nif: '',
            email: '',
            password: '',
            password_confirmation: '',
            date_birthday: new Date(new Date().setFullYear(new Date().getFullYear() - 18)),
            phone_number: '+351',
            gender_id: undefined,
            language: 'en',
            price_rate: 11,
        }
    });

    // Restaurar rascunho ao abrir.
    useEffect(() => {
        let cancelled = false;
        AsyncStorage.getItem(SIGNUP_DRAFT_KEY)
            .then((raw) => {
                if (cancelled || !raw) return;
                const draft: SignUpDraft = JSON.parse(raw);
                if (draft.name) setValue('name', draft.name);
                if (draft.username) setValue('username', draft.username);
                if (draft.nif) setValue('nif', draft.nif);
                if (draft.email) setValue('email', draft.email);
                if (draft.phone_number) setValue('phone_number', draft.phone_number);
                if (draft.date_birthday) setValue('date_birthday', new Date(draft.date_birthday));
                if (typeof draft.gender_id === 'number') setValue('gender_id', draft.gender_id);
                if (typeof draft.price_rate === 'number') setValue('price_rate', draft.price_rate);
                if (Array.isArray(draft.services_types)) setSelectedServicesTypes(draft.services_types);
                if (typeof draft.step === 'number') {
                    // Nunca retomar no passo da palavra-passe: esses campos não são guardados.
                    setStep(Math.min(Math.max(draft.step, SignUpSteps.personalInformation), SignUpSteps.pricePerHour));
                }
            })
            .catch(() => {})
            .finally(() => { if (!cancelled) setDraftRestored(true); });
        return () => { cancelled = true; };
    }, []);

    // Guardar rascunho a cada alteração (nunca password/password_confirmation).
    useEffect(() => {
        if (!draftRestored) return;
        const subscription = watch((values) => {
            const draft: SignUpDraft = {
                name: values.name,
                username: values.username,
                nif: values.nif,
                email: values.email,
                phone_number: values.phone_number,
                date_birthday: values.date_birthday instanceof Date
                    ? values.date_birthday.toISOString()
                    : undefined,
                gender_id: values.gender_id,
                price_rate: values.price_rate,
                services_types: selectedServicesTypes,
                step,
            };
            AsyncStorage.setItem(SIGNUP_DRAFT_KEY, JSON.stringify(draft)).catch(() => {});
        });
        return () => subscription.unsubscribe();
    }, [draftRestored, watch, selectedServicesTypes, step]);

    // Guardar também quando muda o passo ou as competências (sem esperar por um input).
    useEffect(() => {
        if (!draftRestored) return;
        const values = getValues();
        const draft: SignUpDraft = {
            name: values.name,
            username: values.username,
            nif: values.nif,
            email: values.email,
            phone_number: values.phone_number,
            date_birthday: values.date_birthday instanceof Date
                ? values.date_birthday.toISOString()
                : undefined,
            gender_id: values.gender_id,
            price_rate: values.price_rate,
            services_types: selectedServicesTypes,
            step,
        };
        AsyncStorage.setItem(SIGNUP_DRAFT_KEY, JSON.stringify(draft)).catch(() => {});
    }, [draftRestored, step, selectedServicesTypes]);

    const clearDraft = () => AsyncStorage.removeItem(SIGNUP_DRAFT_KEY).catch(() => {});

    const getAvailableOperationAreas = () => {
        axios.get(API_ROUTES.VENDOR_GET_OPERATION_AREAS, {
            headers: {
                'Accept-Language': i18n.language === 'pt_PT' ? 'pt-pt' : 'en',
            }
        })
            .then(response => {
                if (response.status === 200) {
                    setAvailableOperationAreas(response.data.data.operation_areas);
                }
            })
            .catch(err => {
                console.error('Failed to fetch skills:', err);
            });
    }

    const handleFinalErrorAndGoToStep = (error: AxiosError<any, any>) => {
        if (error.response?.status === 422) {
            Object.keys(error?.response?.data?.errors ?? {}).forEach((key: any) => {
                setError(key, {
                    type: 'manual',
                    message: error?.response?.data?.errors?.[key]?.[0]
                });
                switch (key) {
                    case 'name':
                    case 'email':
                    case 'phone_number':
                        setStep(SignUpSteps.personalInformation);
                        break
                    /*case 'nif':
                    case 'email':
                    case 'phone_number':
                        setStep(SignUpSteps.contactInformation);
                        break*/
                    case 'price_rate':
                        setStep(SignUpSteps.pricePerHour);
                        break
                    case 'password':
                    case 'password_confirmation':
                    case 'username':
                        setStep(SignUpSteps.password);
                        break
                    default:
                        break;
                }
            });
        } else if (error.response?.status === 500) {
            setSignUpError(t('errors.server_error'));
        } else {
            setSignUpError(t('errors.occurred_an_error'));
        }
    }

    const signUpVendor = async (data: SignUpData) => {
        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, value as any);
        })
        documents.forEach((document, index) => {
            if (document.file){
                formData.append(`documents[${index}][file]`, {
                    uri: document.file.uri,
                    name: document.file.name??'Image',
                    type: document.file.mimeType,
                } as any);
                formData.append(`documents[${index}][document_id]`, String(document.id));
            }
        })

        selectedServicesTypes.map(type => formData.append(`services_types[]`, type.toString()));

        formData.set('date_birthday', data.date_birthday.toISOString().split('T')[0]);
        formData.set('phone_number', data.phone_number.replace('+351', '+351-'));
        formData.set('language', i18n.language === 'pt_PT' ? 'pt-pt' : 'en');
        formData.set('gender_id', data.gender_id !== undefined && data.gender_id !== null ? String(data.gender_id) : '');

        setIsSigningUp(true);
        if (signUpError) setSignUpError(null);
        try {
            const response = await api.post(API_ROUTES.AUTH_REGISTER, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json',
                    'Accept-Language': i18n.language === 'pt_PT' ? 'pt-pt' : 'en',
                }
            });

            const responseStatus = response?.status;

            if (responseStatus === 200) {
                const { access_token } = response?.data.data;

                if (access_token) {
                    // Registo concluído: o rascunho já não serve para nada.
                    await clearDraft();
                    setSession(access_token);
                    // Ao criar conta, leva já a completar o perfil começando pelos documentos.
                    setTimeout(() => {
                        track(AnalyticsEvent.ONBOARDING_STEP_COMPLETED, { step: 'account_created', flow: 'signup' });
                        router.replace('/(app)/(complete-profile)/CompleteProfile');
                    }, 0);
                }
            }
        } catch(error) {
            if (axios.isAxiosError(error)) {
                handleFinalErrorAndGoToStep(error);
            }
        }
        setIsSigningUp(false);
    };

    const verifyUserData = async (email: string, nif: string, phone_number: string) => {
        try {
            const response = await axios.post(API_ROUTES.AUTH_VERIFY_USER_DATA, {
                email,
                // nif,
                phone_number: phone_number.replace('+351', '+351-'),
            }, {
                headers: {
                    'Accept-Language': i18n.language === 'pt_PT' ? 'pt-pt' : 'en',
                }
            });

            const { can_use } = response?.data.data;

            // Feedback quando o email/telefone já está em uso (HTTP 200 com can_use=false),
            // em vez de um return silencioso que deixa o utilizador preso no passo.
            if (!can_use) {
                setError('email', {
                    type: 'manual',
                    message: t('errors.email_or_phone_in_use')
                });
            }

            return can_use;
        } catch (err) {
            if (axios.isAxiosError(err)) {
                if (err.response?.status === 500) {
                    setError('email', {
                        type: 'manual',
                        message: t('errors.server_error')
                    });
                } else if (err.response?.status === 422) {
                    handleFinalErrorAndGoToStep(err);
                } else if (!err.response) {
                    // Erro de rede (sem resposta HTTP) — dar feedback em vez de return silencioso.
                    setError('email', {
                        type: 'manual',
                        message: t('errors.network_error')
                    });
                }
            }
            return false;
        }
    }

    const handleNextStep = async (data: SignUpData) => {
        Object.keys(data).forEach(key => setValue(key as keyof SignUpData, data[key as keyof SignUpData]));

        const nextStep = step + 1;
        if (step === SignUpSteps.personalInformation && data.email) {
            setIsVerifyingEmail(true);
            const validEmail = await verifyUserData(data.email, data.nif, data.phone_number);
            setIsVerifyingEmail(false);
            if (!validEmail) return;
        }

        if (step === SignUpSteps.skillsInformation && selectedServicesTypes.length === 0) {
            return openDialog({
                icon: <XIcon color={Colors.primary} />,
                title: t('auth.sign_up.skills_selection.error_must_select.title'),
                subtitle: t('auth.sign_up.skills_selection.error_must_select.subtitle'),
                closeAfterMSeconds: 2000,
                closeOnClickOutside: true,
            });
        }

        if (step === maxStep) {
            signUpVendor(data);
        } else {
            // Passo concluído: só o número do passo, nunca o que o técnico escreveu.
            track(AnalyticsEvent.ONBOARDING_STEP_COMPLETED, { step, flow: 'signup' });
            setStep(nextStep);
        }
    };

    const toggleServiceType = (serviceTypeId: number) => {
        setSelectedServicesTypes((prev: number[]) => {
            if (prev.includes(serviceTypeId)) {
                return prev.filter((id: number) => id !== serviceTypeId);
            }
            return [...prev, serviceTypeId];
        });
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
                        {t('auth.sign_up.header')}
                    </CustomText>
                )}
                otherClasses="p-5"
                onBack={() => {
                    if (step === 0 || step === 1) {
                        router.canGoBack() && router.back();
                    } else {
                        setStep(step - 1);
                    }
                }}
            />

            {step !== SignUpSteps.instructions && (
                <View className="px-5">
                    <CustomText color="muted" size="small" boldness="semiBold" classes="mb-2">
                        {t('auth.sign_up.step_counter', { current: step, total: maxStep })}
                    </CustomText>
                    <ProgressBar percentage={(step / maxStep) * 100} />
                </View>
            )}

            <View className="flex-1">
                {step === SignUpSteps.instructions && <InstructionsStep />}
                {step === SignUpSteps.skillsInformation && (
                    <SkillsSelectionStep
                        control={control}
                        errors={errors}
                        availableOperationAreas={availableOperationAreas}
                        selectedServicesTypes={selectedServicesTypes}
                        toggleServiceType={toggleServiceType}
                    />
                )}
                {/* {step === SignUpSteps.servicesTypes && (
                    <ServicesTypesSelectionStep
                        control={control}
                        errors={errors}
                        availableOperationAreas={availableOperationAreas}
                        selectedOperationAreas={selectedOperationAreas}
                        selectedServicesTypes={selectedServicesTypes}
                        setSelectedServicesTypes={setSelectedServicesTypes}
                        // setSelectedOperationAreas={setSelectedOperationAreas}
                    />
                )} */}
                {step === SignUpSteps.pricePerHour && (
                    <PriceRateStep
                        control={control}
                        errors={errors}
                    />
                )}
                {
                    step !== SignUpSteps.skillsInformation &&
                    // step !== SignUpSteps.servicesTypes &&
                    step !== SignUpSteps.pricePerHour &&
                    step !== SignUpSteps.instructions && (
                        <KeyboardAwareScrollView bottomOffset={20}>
                            <View className="flex-1 p-5">
                                {step === SignUpSteps.personalInformation && <PersonalInformationStep control={control} errors={errors} availableGenders={availableGenders} />}
                                {/* {step === SignUpSteps.contactInformation && <ContactInformationStep control={control} errors={errors} />} */}
                                {step === SignUpSteps.password && (
                                    <PasswordStep
                                        control={control}
                                        errors={errors}
                                    />
                                )}
                            </View>
                        </KeyboardAwareScrollView>
                    )
                }
                <View className="p-5">
                    {signUpError && (
                        <CustomText
                            size="small"
                            color="danger"
                            boldness="medium"
                            className="text-center mb-2"
                        >
                            {signUpError}
                        </CustomText>
                    )}
                    {step === maxStep && (
                        <View className="flex-row flex-wrap justify-center items-center mb-4 px-2">
                            <CustomText
                                size="small"
                                color="secondary"
                                boldness="medium"
                                className="text-center"
                            >
                                {t('auth.sign_up.advise.agree') + ' '}
                            </CustomText>
                            <CustomTouchableOpacity
                                type="transparent"
                                size="small"
                                text={t('auth.sign_up.advise.terms_of_use')}
                                textColor="secondary"
                                textBoldness="bold"
                                textSize="small"
                                onPress={() => Linking.openURL('https://piquetapp.com/termos-condicoes-de-utilizacao-da-aplicacao/')}
                                className="p-0 m-0 items-start justify-start"
                                accessibilityRole="link"
                                textNumberOfLines={3}
                            />
                            <CustomText
                                size="small"
                                color="secondary"
                                boldness="medium"
                                className="text-center"
                            >
                                {' ' + t('auth.sign_up.advise.and') + ' '}
                            </CustomText>
                            <CustomTouchableOpacity
                                type="transparent"
                                size="small"
                                text={t('auth.sign_up.advise.privacy_policy')}
                                textColor="secondary"
                                textBoldness="bold"
                                textSize="small"
                                onPress={() => Linking.openURL('https://piquetapp.com/politica-de-privacidade-para-utilizadores/')}
                                className="p-0 m-0 items-start justify-start"
                                accessibilityRole="link"
                                textNumberOfLines={3}
                            />
                        </View>
                    )}
                    <CustomTouchableOpacity
                        type="support_primary"
                        size="large"
                        text={
                            isVerifyingEmail ? t('auth.sign_up.verifying_email') :
                            isSigningUp ? t('auth.sign_up.signing_up') :
                            step === maxStep ? t('auth.sign_up.last_step') : t('auth.sign_up.continue_sign_up')
                        }
                        textColor="on_brand"
                        textBoldness="bold"
                        disabled={isLoading || isVerifyingEmail || isSigningUp}
                        onPress={handleSubmit((data) => handleNextStep(data))}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};



export default SignUp;
