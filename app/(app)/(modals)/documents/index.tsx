import {Colors} from "@/constants/Colors";
import BackHeader from "@/components/app/BackHeader";
import {CustomText} from "@/components/CustomText";
import { Image, KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import React, { useEffect, useState } from "react";
import {useSession} from "@/contexts/SessionContext";
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity";
import {Entypo, Feather} from "@expo/vector-icons";
import * as DocumentPicker from 'expo-document-picker';
import {DocumentPickerAsset} from "expo-document-picker/src/types";
import DynamicSizingSheet from "@/components/sheets/DynamicSizingSheet";
import {useApi} from "@/contexts/ApiContext";
import {API_ROUTES} from "@/constants/ApiRoutes";
import * as ImagePicker from 'expo-image-picker';
import {ImagePickerAsset} from "expo-image-picker/src/ImagePicker.types";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import Modal from "react-native-modal";
import XIcon from "@/assets/icons/x";
import { useDialog } from "@/contexts/DialogContext";
import CheckMark from "@/assets/icons/check-mark";
import { StatusBar } from "expo-status-bar";

export default function Documents(){
    const { t } = useTranslation();
    const {vendorData, fetchAndSaveUserData} = useSession();
    const [asset, setAsset] = useState<DocumentPickerAsset|ImagePickerAsset|null>(null);
    const [documentType, setDocumentType] = useState<number|null>(null);
    const {api} = useApi();
    const [error, setError] = useState<string|null>(null);
    const [isOpen, setIsOpen] = useState<number | null>(null);
    const { openDialog } = useDialog();
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        if (asset){
            setTimeout(()=> {
                setShowConfirmModal(true);
            }, 500)

        }else{
            setShowConfirmModal(false);
        }
    }, [asset]);

    // const handleSelectFile = async (typeId) => {
    //     Alert.alert(
    //         t('documents.select_file.title'),
    //         t('documents.select_file.subtitle'),
    //         [
    //             { text: t('documents.select_file.choose_from_library'), onPress: () => pickImage(typeId) },
    //             { text: t('documents.select_file.choose_from_files'), onPress: () => pickDocument(typeId) },
    //             { text: t('documents.select_file.cancel'), style: "cancel" }
    //         ]
    //     );
    // };

    const pickImageFromCamera = async (typeId: number) => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                openDialog({
                    title: t('errors.documents_permission.title'),
                    subtitle: t('auth.sign_up.documents.camera_permission_required'),
                    icon: <XIcon color={Colors.primary}/>,
                    closeAfterMSeconds: 2000,
                    closeOnClickOutside: true,
                })
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                quality: 1,
                selectionLimit: 1,
            });

            if (!result.canceled && result.assets?.length) {
                setAsset(result.assets[0]);
                setDocumentType(typeId);
            }
        } catch (error: any) {
            setError(error?.message ?? t('errors.documents_pick.subtitle'))
        }
        setIsOpen(null);
    };

    const pickImage = async (typeId: number) => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                openDialog({
                    title: t('errors.documents_permission.title'),
                    subtitle: t('auth.sign_up.documents.library_permission_required'),
                    icon: <XIcon color={Colors.primary}/>,
                    closeAfterMSeconds: 2000,
                    closeOnClickOutside: true,
                })
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                allowsEditing: true,
                quality: 0.4,
                selectionLimit: 1
            });

            if (!result.canceled && result.assets?.length) {
                setDocumentType(typeId);
                setAsset(result.assets[0]);
            }
        } catch (error: any) {
            setError(error?.message ?? t('errors.documents_pick.subtitle'))
        }
        setIsOpen(null);
    };

    const pickDocument = async (typeId: number) => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/jpeg', 'image/png'],
                copyToCacheDirectory: false,
            });

            if (!result.canceled && result.assets?.length) {
                setAsset(result.assets[0]);
                setDocumentType(typeId);
            }
        } catch (error) {
            console.error("Erro ao selecionar ficheiro:", error);
        }
        setIsOpen(null);
    };

    const handleSubmit = () => {
        setLoadingSubmit(true);
        const form = new FormData();
        form.set('type', documentType)
        form.set('document', {
            uri: asset?.uri,
            name: asset?.fileName ?? 'Image',
            type: asset?.mimeType
        })
        api.post(API_ROUTES.POST_DOCUMENTS, form, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Accept': 'application/json',
            }
        })
            .then(res => {
                openDialog({
                    icon: <CheckMark color={Colors.primary}/>,
                    title: t('auth.sign_up.documents.submit.success.title'),
                    subtitle: t('auth.sign_up.documents.submit.success.subtitle'),
                    closeAfterMSeconds: 2000,
                    closeOnClickOutside: true,
                });
            })
            .catch(error => {
                if (error?.response?.status === 422) {
                    openDialog({
                        title: t('errors.documents_submit.title'),
                        subtitle: t('auth.sign_up.documents.submit.error_file_too_big'),
                        icon: <XIcon color={Colors.primary}/>,
                        closeAfterMSeconds: 2000,
                        closeOnClickOutside: true,
                    })
                } else {
                    openDialog({
                        title: t('errors.documents_submit.title'),
                        subtitle: error?.response?.data?.message || t('auth.sign_up.documents.submit.error'),
                        icon: <XIcon color={Colors.primary}/>,
                        closeAfterMSeconds: 2000,
                        closeOnClickOutside: true,
                    })
                }
                console.error(error, error?.response?.data, 'this error happened inside of the post documents');
            })
            .finally(()=>{
                fetchAndSaveUserData();
                setAsset(null);
                setDocumentType(null);
                setLoadingSubmit(false);
            })
    }

    const handleCancel = () => {
        setIsOpen(null);
        setAsset(null);
        setDocumentType(null);
    }

    return (
        <SafeAreaView style={{flex: 1, backgroundColor: Colors.primary}}>
            <BackHeader
                backButtonColor="secondary"
                middleItem={() => (
                    <CustomText color="secondary" boldness="medium" numberOfLines={1}>
                        {t('documents.header')}
                    </CustomText>
                )}
                otherClasses="p-5"
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1, paddingBottom: 20 }}
            >
                <ScrollView
                    className="space-y-4"
                    contentContainerStyle={{
                        flexGrow: 1,
                        padding: 20,
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    {
                        (vendorData?.pending_documents?.length ?? 0) > 0 && (
                            <View className="flex gap-1">
                                <CustomText color="secondary" size="extraLarge" boldness="bold" numberOfLines={1}>{t('documents.pending_documents')}</CustomText>
                                {
                                    vendorData?.pending_documents.map((item, index) => (
                                        <View key={item.id} >
                                            <View className="flex flex-row justify-between items-center">
                                                <View className="w-[90%]">
                                                    <CustomText color="secondary" numberOfLines={1}>
                                                        {item.name}
                                                    </CustomText>
                                                </View>
                                                <View className="w-[10%] flex items-center">
                                                    <Entypo name="time-slot" size={24} color={Colors.support_primary} />
                                                </View>
                                            </View>
                                            <View className="h-[1px] w-full bg-line rounded-full mt-6"></View>
                                        </View>
                                    ))
                                }
                            </View>
                        )
                    }
                    {
                        (vendorData?.missing_documents?.length ?? 0) > 0 && (
                            <View className="flex gap-1">
                                <CustomText color="secondary" size="extraLarge" boldness="bold" numberOfLines={1}>{t('documents.missing_documents')}</CustomText>
                                {
                                    vendorData?.missing_documents.map((item, index) => (
                                        <CustomTouchableOpacity
                                            key={item.id}
                                            onPress={() => setIsOpen(item?.id)}
                                            disabled={loadingSubmit}
                                        >
                                            <View className="flex flex-row justify-between items-center">
                                                <View className="w-[90%]">
                                                    <CustomText color="secondary" numberOfLines={1}>
                                                        {item.name}
                                                    </CustomText>
                                                    {item.reason && (
                                                        <CustomText size="small" color="gray_light" numberOfLines={3}>
                                                            {t('documents.reason_for_denial')}: {item.reason}
                                                        </CustomText>
                                                    )}
                                                </View>
                                                <View className="w-[10%] flex items-center">
                                                    <Entypo name="chevron-right" size={24} color={Colors.support_primary} />
                                                </View>
                                            </View>
                                            <View className="h-[1px] w-full bg-line rounded-full mt-6"></View>
                                        </CustomTouchableOpacity>
                                    ))
                                }
                            </View>
                        )
                    }
                    {
                        (vendorData?.optional_documents?.length ?? 0) > 0 && (
                            <View className="flex gap-1">
                                <CustomText color="secondary" size="extraLarge" boldness="bold" numberOfLines={1}>{t('documents.optional_documents')}</CustomText>
                                {
                                    vendorData?.optional_documents.map((item, index) => (
                                        <CustomTouchableOpacity
                                            key={item.id}
                                            onPress={() => setIsOpen(item?.id)}
                                        >
                                            <View className="flex flex-row justify-between items-center">
                                                <View className="w-[90%]">
                                                    <CustomText color="secondary" numberOfLines={1}>
                                                        {item.name}
                                                    </CustomText>
                                                    {item.reason && (
                                                        <CustomText size="small" color="gray_light" numberOfLines={3}>
                                                            {t('documents.reason_for_denial')}: {item.reason}
                                                        </CustomText>
                                                    )}
                                                </View>
                                                <View className="w-[10%] flex items-center">
                                                    <Entypo name="chevron-right" size={24} color={Colors.support_primary} />
                                                </View>
                                            </View>
                                            <View className="h-[1px] w-full bg-line rounded-full mt-6"></View>
                                        </CustomTouchableOpacity>
                                    ))
                                }
                            </View>
                        )
                    }
                    {
                        vendorData?.pending_documents?.length === 0 &&
                        vendorData?.missing_documents?.length === 0 &&
                        vendorData?.optional_documents?.length === 0 && (
                            <View className="flex flex-row justify-center items-center">
                                <CustomText color="secondary" size="large" numberOfLines={1}>{t('documents.no_documents_found')}</CustomText>
                            </View>
                        )
                    }
                    {
                        error ? <CustomText color={"error"} >{error}</CustomText> : null
                    }

                </ScrollView>
            </KeyboardAvoidingView>

            {showConfirmModal && (
                <ConfirmAssetPopup
                    handleSubmit={handleSubmit}
                    handleCancel={handleCancel}
                    asset={asset}
                    loadingSubmit={loadingSubmit}
                />
            )}
            {isOpen && (
                <DocumentSelectionPopup
                    pickImageFromCamera={pickImageFromCamera}
                    pickImage={pickImage}
                    pickDocument={pickDocument}
                    setIsOpen={setIsOpen}
                    type={isOpen}
                />
            )}
        </SafeAreaView>
    )
}

const ConfirmAssetPopup = ({
    handleSubmit,
    handleCancel,
    asset,
    loadingSubmit
}: {
    handleSubmit?: () => void;
    handleCancel?: () => void;
    asset?: DocumentPickerAsset | ImagePickerAsset | null;
    loadingSubmit: boolean;
}) => {
    const { t } = useTranslation();


    return (
        <Modal
            isVisible={true}
            //animationIn="slideInUp"
            //animationOut="slideOutDown"
            //backdropColor="rgba(0, 0, 0, 0.7)"
            onBackdropPress={() => handleCancel && handleCancel()}
            className="rounded-3xl p-0"
            onBackButtonPress={() => handleCancel && handleCancel()}
        >
            <StatusBar backgroundColor="rgba(0, 0, 0, 0.7)" />
            <DynamicSizingSheet
                type="scrollView"
                onClose={() => null}
                style={{
                    shadowColor: "#000",
                    shadowOffset: {
                        width: 0,
                        height: 3,
                    },
                    shadowOpacity: 0.27,
                    shadowRadius: 4.65,

                    elevation: 6,
                }}
                handleComponent={() => null}
                backgroundStyle={{
                    backgroundColor: Colors.primary,
                }}
                backdropComponent={() => <View style={{ flex: 1, backgroundColor: 'black', opacity: 0.6 }} />}
            >
                <ScrollView
                    className="flex-1 p-5 h-[80vh]"
                    contentContainerStyle={{
                        flexGrow: 1,
                        justifyContent: 'space-between',
                    }}
                >
                    <View className="flex-1">
                        <CustomText color="secondary" numberOfLines={3} classes="text-center px-5">
                            {asset?.fileName || asset?.file?.name || asset?.name || ""}
                        </CustomText>
                    </View>

                    {
                        asset?.mimeType?.startsWith('image/') && (
                            <View className="flex-1 min-h-[30%]">
                                <Image
                                    className="w-full flex-1 object-contain"
                                    resizeMode="contain"
                                    source={{ uri: asset.uri }}
                                />
                            </View>
                        )
                    }
                    <View className="flex-1 justify-end">
                        <CustomTouchableOpacity
                            onPress={handleSubmit}
                            type="support_primary"
                            size="large"
                            text={t('documents.select_file.confirm')}
                            textSize="large"
                            textColor="primary"
                            textBoldness="bold"
                            disabled={loadingSubmit}
                        />
                        <View className="mt-4">
                            <CustomTouchableOpacity
                                onPress={handleCancel}
                                type="secondary_outline"
                                size="large"
                                text={t('documents.select_file.cancel')}
                                textSize="large"
                                textColor="support_primary"
                                textBoldness="bold"
                                disabled={loadingSubmit}
                            />
                        </View>
                    </View>
                </ScrollView>
            </DynamicSizingSheet>
        </Modal>
    )
}

const DocumentSelectionPopup = ({
    pickImageFromCamera,
    pickImage,
    pickDocument,
    setIsOpen,
    type
}: {
    pickImageFromCamera: (arg: number) => void;
    pickImage: (arg: number) => void;
    pickDocument: (arg: number) => void;
    setIsOpen: (isOpen: number | null) => void;
    type: number;
}) => {
    const { t } = useTranslation();

    return (
        <Modal
            isVisible={true}
            animationIn="slideInUp"
            animationOut="slideOutDown"
            backdropColor="rgba(0, 0, 0, 0.7)"
            // statusBarTranslucent
            onBackdropPress={() => setIsOpen(null)}
            className="rounded-3xl"
            onBackButtonPress={() => setIsOpen(null)}
        >
            <StatusBar backgroundColor="rgba(0, 0, 0, 0.7)" />
            <DynamicSizingSheet
                type="scrollView"
                enablePanDownToClose
                onClose={() => setIsOpen(null)}
                style={{
                    shadowColor: "#000",
                    shadowOffset: {
                    width: 0,
                    height: 3,
                    },
                    shadowOpacity: 0.27,
                    shadowRadius: 4.65,

                    elevation: 6,

                }}
                // handleStyle={{
                //     backgroundColor: Colors.primary,
                //     borderTopLeftRadius: 20,
                //     borderTopRightRadius: 20,
                // }}
                // handleIndicatorStyle={{
                //     backgroundColor: Colors.gray_light,
                // }}
                backgroundStyle={{
                    backgroundColor: Colors.primary,
                }}
                handleComponent={() => null}
                // backdropComponent={() => <View style={{ flex: 1, backgroundColor: 'black', opacity: 0.6 }} />}
            >
                <View
                    className="bg-primary p-5 rounded-3xl"
                >
                    {/* <View className="mb-5">
                        <CustomText size="small" color="secondary" boldness="semiBold" className="text-center">
                            {t('auth.sign_up.documents.select_file.title')}
                        </CustomText>
                    </View> */}
                    <View className="mb-2 border-b-[2px] border-b-gray_strong">
                        <CustomTouchableOpacity
                            size="large"
                            type="transparent"
                            textColor="secondary"
                            textBoldness="semiBold"
                            text={t('auth.sign_up.documents.select_file.camera')}
                            onPress={() => pickImageFromCamera(type)}
                            Icon={() => (
                                <Feather name="camera" size={24} color={Colors.secondary} />
                            )}
                            itemsCenter={false}
                            classes="space-x-3"
                        />
                    </View>
                    <View className="mb-2 border-b-[2px] border-b-gray_strong">
                        <CustomTouchableOpacity
                            size="large"
                            type="transparent"
                            textColor="secondary"
                            textBoldness="semiBold"
                            text={t('auth.sign_up.documents.select_file.library')}
                            onPress={() => pickImage(type)}
                            Icon={() => (
                                <Feather name="image" size={24} color={Colors.secondary} />
                            )}
                            itemsCenter={false}
                            classes="space-x-3"
                        />
                    </View>
                    <CustomTouchableOpacity
                        size="large"
                        type="transparent"
                        textColor="secondary"
                        textBoldness="semiBold"
                        text={t('auth.sign_up.documents.select_file.files')}
                        onPress={() => pickDocument(type)}
                        Icon={() => (
                            <Feather name="folder" size={24} color={Colors.secondary} />
                        )}
                        itemsCenter={false}
                        classes="space-x-3"
                    />
                </View>
            </DynamicSizingSheet>
        </Modal>
    );
}
