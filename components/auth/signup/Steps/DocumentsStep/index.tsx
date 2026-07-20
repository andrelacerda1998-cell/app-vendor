import { CustomText } from '@/components/CustomText';
import CustomTextInput from '@/components/CustomTextInput';
import CustomTouchableOpacity from '@/components/CustomTouchableOpacity';
import DatePicker from '@/components/DatePicker';
import { Colors } from '@/constants/Colors';
import { Entypo, Feather, FontAwesome } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {Alert, ScrollView, View} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import CheckMark from '@/assets/icons/check-mark';
import XIcon from '@/assets/icons/x';
import { useApi } from '@/contexts/ApiContext';
import { API_ROUTES } from '@/constants/ApiRoutes';
import { useTranslation } from "react-i18next";
import { useDialog } from "@/contexts/DialogContext";
import i18n from "@/translation";
import DynamicSizingSheet from "@/components/sheets/DynamicSizingSheet";
import Modal from "react-native-modal";
import { StatusBar } from "expo-status-bar";

const DocumentWithFile = ({
    document,
    documentTypes,
    setDocument
}: any) => {
    const fileName = document.file.fileName || document.file.name;

    const onPress = () => {
        const newDocuments = documentTypes.map((area: any) =>
            area.id === document.id ? { ...area, file: null } : area
        );

        setDocument(newDocuments);
    };

    return (
        <View className="space-y-4 pb-4 border-b border-b-gray_strong">
            <View className="flex-row items-center justify-between">
                <View className="w-[10%]">
                    <View className="h-6 w-6 p-1 rounded-full bg-[#50D88A]">
                        <CheckMark color={Colors.primary} />
                    </View>
                </View>
                <View className="w-[60%] space-y-1">
                    <CustomText size="small" color="gray_strong" boldness="semiBold" numberOfLines={1}>
                        {document.name}
                    </CustomText>
                    <CustomText color="secondary" boldness="semiBold" numberOfLines={1}>
                        {fileName}
                    </CustomText>
                </View>
                <View className="w-[30%] items-end">
                    <CustomTouchableOpacity onPress={onPress}>
                        <View className="w-3 h-3">
                            <XIcon color={Colors.gray_medium} />
                        </View>
                    </CustomTouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const DocumentWithoutFile = ({
    document,
    setIsOpen,
    setOpenedDocument
}: any) => {
    const { t } = useTranslation();

    return (
        <View className="space-y-4 pb-4 border-b border-b-gray_strong">
            <View className="flex-row items-center">
                <View className="w-[10%]">
                    <Entypo name="text-document-inverted" size={24} color={Colors.support_primary} />
                </View>
                <View className="mt-2 w-[60%] space-y-1">
                    <CustomText size="small" color="gray_strong" boldness="semiBold" numberOfLines={1}>
                        {t('auth.sign_up.documents.document.label')}
                    </CustomText>
                    <CustomText color="secondary" boldness="semiBold" numberOfLines={1}>
                        {document.name}
                    </CustomText>
                </View>
                <View className="w-[30%]">
                    <CustomTouchableOpacity
                        type="secondary"
                        textColor="primary"
                        size="small"            
                        text={t('auth.sign_up.documents.document.upload')}
                        onPress={() => {
                            setOpenedDocument(document);
                            setIsOpen(true)
                        }}
                    />
                </View>
            </View>
        </View>
    );
};

const DocumentSelectionPopup = ({
    pickImageFromCamera,
    pickImage,
    pickDocument,
    setIsOpen
}: {
    pickImageFromCamera: () => void;
    pickImage: () => void;
    pickDocument: () => void;
    setIsOpen: (isOpen: boolean) => void;
}) => {
    const { t } = useTranslation();

    return (
        <Modal
            isVisible={true}
            animationIn="slideInUp"
            animationOut="slideOutDown"
            backdropColor="rgba(0, 0, 0, 0.7)"
            // statusBarTranslucent
            onBackdropPress={() => setIsOpen(false)}
            className="rounded-3xl"
            onBackButtonPress={() => setIsOpen(false)}
        >
            <StatusBar backgroundColor="rgba(0, 0, 0, 0.7)" />
            <DynamicSizingSheet
                type="scrollView"
                enablePanDownToClose
                onClose={() => setIsOpen(false)}
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
                            onPress={pickImageFromCamera}
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
                            onPress={pickImage}
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
                        onPress={pickDocument}
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

const DocumentsStep = ({
    control,
    errors,
    availableOperationAreas,
    selectedOperationAreas,
    setDocuments
}: any) => {
    const { t } = useTranslation();
    const [documentsTypes, setDocumentsTypes] = useState<any>([]);
    const { api } = useApi();
    const { openDialog } = useDialog();
    const [isOpen, setIsOpen] = useState(false);
    const [openedDocument, setOpenedDocument] = useState<any>(null);

    const pickImageFromCamera = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                openDialog({
                    title: t('errors.title'),
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
                updateDocument(result.assets[0]);
            }
        } catch (error) {
            console.error("Erro ao selecionar imagem:", error);
        }
    };

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                openDialog({
                    title: t('errors.title'),
                    subtitle: t('auth.sign_up.documents.library_permission_required'),
                    icon: <XIcon color={Colors.primary}/>,
                    closeAfterMSeconds: 2000,
                    closeOnClickOutside: true,
                })
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                allowsEditing: true,
                quality: 1,
                selectionLimit: 1,
            });

            if (!result.canceled && result.assets?.length) {
                updateDocument(result.assets[0]);
            }
        } catch (error) {
            console.error("Erro ao selecionar imagem:", error);
        }
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/jpeg', 'image/png'],
                copyToCacheDirectory: false,
            });

            if (!result.canceled && result.assets?.length) {
                updateDocument(result.assets[0]);
            }
        } catch (error) {
            console.error("Erro ao selecionar ficheiro:", error);
        }
    };

    const updateDocument = (file: any) => {
        setIsOpen(false);
        const updatedDocument = { ...openedDocument, file };
        const newDocumentsTypes = documentsTypes.map((doc: any) =>
            doc.id === updatedDocument.id ? updatedDocument : doc
        );
        setDocumentsTypes(newDocumentsTypes);
        setOpenedDocument(null);
    };

    const getNecessaryDocuments = async () => {
        try {
            const res = await api.get(API_ROUTES.GET_DOCUMENTS_TYPES, {
                headers: {
                    'Accept-Language': i18n.language === 'pt_PT' ? 'pt-pt' : 'en',
                }
            });
            setDocumentsTypes(res.data.data.types || []);
        } catch (error) {
            console.error('Error fetching documents:', error);
        }
        // setOperationAreas(availableOperationAreas.filter((area) => selectedOperationAreas.includes(area.id)));
    };

    useEffect(() => {
        getNecessaryDocuments();
    }, [selectedOperationAreas.length]);

    useEffect(() => {
        setDocuments(documentsTypes)
    }, [documentsTypes]);

    return (
        <View className="flex-1 p-5">
            <CustomText size="title" color="secondary" boldness="bold" numberOfLines={3}>
                {t('auth.sign_up.documents.title')}
            </CustomText>
            <CustomText color="gray_medium" numberOfLines={3} classes="mt-2">
                {t('auth.sign_up.documents.subtitle')}
            </CustomText>

            <ScrollView contentContainerStyle={{ flexGrow: 1, width: '100%' }}>
                <View className="mt-8 space-y-4">
                    {documentsTypes.length > 0
                        ? documentsTypes.map((document: any) => (
                            <View key={document.id} className="space-y-4">
                                {document.file ? (
                                    <DocumentWithFile
                                        document={document}
                                        documentTypes={documentsTypes}
                                        setDocument={setDocumentsTypes}
                                    />
                                ) : (
                                    <DocumentWithoutFile
                                        document={document}
                                        setIsOpen={setIsOpen}
                                        setOpenedDocument={setOpenedDocument}
                                    />
                                )}
                            </View>
                        )) : (
                            <View className="flex-row items-center justify-center">
                                <CustomText size="large" color="gray_strong" boldness="semiBold" numberOfLines={1}>
                                    {t('auth.sign_up.documents.no_documents_found')}
                                </CustomText>
                            </View>
                        )
                    }
                </View>
            </ScrollView>
            <CustomText size="small" color="gray_medium" numberOfLines={3} classes="text-center">
                {t('auth.sign_up.documents.information')}
            </CustomText>
            {isOpen && (
                <DocumentSelectionPopup
                    // document={document}
                    // setDocument={setDocumentsTypes}
                    pickImageFromCamera={pickImageFromCamera}
                    pickImage={pickImage}
                    pickDocument={pickDocument}
                    setIsOpen={setIsOpen}
                />
            )}
        </View>
    );
};

export default DocumentsStep;
