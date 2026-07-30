import {Colors} from '@/constants/Colors';
import {Ionicons} from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import { FlatList, ScrollView, TextInput, View } from 'react-native';
import BackHeader from '@/components/app/BackHeader';
import {useSession} from '@/contexts/SessionContext';
import {CustomText} from "@/components/CustomText";
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity";
import {useApi} from "@/contexts/ApiContext";
import {API_ROUTES} from "@/constants/ApiRoutes";
import useEcho from "@/hooks/echo";
import {RSA} from "react-native-rsa-native";
import {useService} from "@/contexts/ServiceContext";
import {useDialog} from "@/contexts/DialogContext";
import XIcon from "@/assets/icons/x";
import { useTranslation } from "react-i18next";
import { useAppStateStatus } from "@/contexts/AppStateStatusContext";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";


interface Message {
    isVendor: boolean;
    isCustomer: boolean;
    message: string;
    time: string;
}

const VendorMessage = ({message, time}: { message: string, time: string }) => {
    return (
        <View className="space-y-2 self-end mb-5">
            <View className="bg-gray_light p-6 w-full rounded-3xl rounded-br-none">
                <CustomText size="small" color="primary" boldness="regular">
                    {message}
                </CustomText>
            </View>
            <CustomText
                size="extraSmall"
                color="gray_light"
                boldness="regular"
                classes="text-right"
            >
                {time}
            </CustomText>
        </View>
    )
}

const CustomerMessage = ({message, time}: { message: string, time: string }) => {
    return (
        <View className="space-y-2 self-start mb-5">
            <View className="bg-gray_strong p-6 w-full rounded-3xl rounded-bl-none">
                <CustomText size="small" color="secondary" boldness="regular">
                    {message}
                </CustomText>
            </View>
            <View className="self-start">
                <CustomText
                    size="extraSmall"
                    color="gray_light"
                    boldness="regular"
                    classes="text-right"
                >
                    {time}
                </CustomText>
            </View>
        </View>
    )
}
const Service = () => {
    const {t} = useTranslation();
    const {api} = useApi();
    const echo = useEcho();
    const {vendorData} = useSession();
    const {openService, clearUnreadMessages} = useService();
    const serviceId = openService?.id;
    const [message, setMessage] = useState('');
    const [publicKey, setPublicKey] = useState<string>();
    // Sem chave pública as mensagens não podem ser cifradas. Antes o campo e o
    // botão de enviar ficavam ativos e não acontecia nada ao carregar — o técnico
    // pensava que tinha avisado o cliente.
    const [keyError, setKeyError] = useState(false);
    const {openDialog} = useDialog();
    const [messages, setMessages] = useState<Message[]>([]);
    const [groupedMessages, setGroupedMessages] = useState<{ date: string, messages: Message[] }[]>([]);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(true);
    const { appStateStatus } = useAppStateStatus();

    function formatDateToISO(date: Date): string {
        const pad = (num: number) => String(num).padStart(2, '0');
        const year = date.getUTCFullYear();
        const month = pad(date.getUTCMonth() + 1);
        const day = pad(date.getUTCDate());
        const hours = pad(date.getUTCHours());
        const minutes = pad(date.getUTCMinutes());
        const seconds = pad(date.getUTCSeconds());
        const milliseconds = String(date.getUTCMilliseconds()).padStart(3, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}000Z`;
    }

    // [preset] permite enviar uma resposta rápida (sem passar pelo campo de
    // texto); sem preset, envia o que está escrito.
    const handleSendMessage = async (preset?: string) => {
        if (!publicKey) return;
        const messageToSend = (preset ?? message).trim();
        if (!messageToSend || sendingMessage) return;
        setSendingMessage(true);
        if (preset === undefined) setMessage('');

        const now = new Date(Date.now());
        const formattedDate = formatDateToISO(now);

        buildMessages({
            isVendor: true,
            isCustomer: false,
            time: formattedDate,
            message: messageToSend,
        });

        const signedData = await RSA.encrypt(messageToSend, publicKey);

        api.post(API_ROUTES.POST_MESSAGE(`${serviceId}`), {
            "message": signedData,
        })
            .then(() => { if (preset === undefined) setMessage(''); })
            .catch((error) => {
                console.error(error)
                if (preset === undefined) setMessage(messageToSend);
            })
            .finally(() => setSendingMessage(false));
    };

    const buildMessages = (messageToBuild: Message) => {
        if (!vendorData) return;

        setMessages((prevMessages) => ([...prevMessages, messageToBuild]));
    };

    const subscribeToMessagesChannel = () => {
        if (!echo) return;

        const channel = echo.private(`common.services.${serviceId}`);
        if (!channel) return;

        channel.subscribed(() => {
            channel.error(console.error);
            channel.listen(".NewMessageEvent", handleNewMessage);
        });
    };

    const handleNewMessage = (messageToHandle: {
        message: string;
        messageDecrypted: string;
    }) => {
        const {user_id, updated_at, created_at, id} = JSON.parse(messageToHandle.message);
        if (!vendorData?.user || user_id === vendorData?.user?.id) return;

        const newMessage: Message = {
            isVendor: user_id === vendorData?.user?.id,
            isCustomer: user_id !== vendorData?.user?.id,
            message: messageToHandle.messageDecrypted,
            time: created_at,
        };

        buildMessages(newMessage);
    };

    const fetchMessages = () => {
        if (!loadingMessages) setLoadingMessages(true);
        api.get(API_ROUTES.GET_CHATS(`${serviceId}`))
            .then(res => {
                const data = res.data.data.messages;
                if (!vendorData) return;

                const messagesToSave = data.map((message: { from: number; date: string; message: string }) => ({
                    ...message,
                    isVendor: message.from === vendorData?.user?.id,
                    isCustomer: message.from !== vendorData?.user?.id,
                    message: message.message,
                    time: message.date,
                }));

                setMessages(messagesToSave);
            })
            .catch((error) => {
                openDialog({
                    icon: <XIcon color={Colors.primary}/>,
                    title: t('errors.chat_load.title'),
                    subtitle: error?.response?.data?.metadata?.message || error?.response?.data?.message || t('errors.chat_load.subtitle'),
                    closeAfterMSeconds: 2000,
                    closeOnClickOutside: true,
                })
            })
            .finally(() => setLoadingMessages(false));
    };

    function formatIsoToTime(isoString: string): string {
        const date = new Date(isoString);
        const pad = (num: number) => String(num).padStart(2, '0');
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        return `${hours}:${minutes}`;
    }

    // Clear unread messages when chat is opened
    useEffect(() => {
        clearUnreadMessages();
    }, []);

    const fetchPublicKey = useCallback(() => {
        return api.get(API_ROUTES.GET_SERVICE_PUBLIC_KEY(`${serviceId}`))
            .then((res) => {
                setPublicKey(res.data.data.public_key);
                setKeyError(false);
            })
            .catch(() => {
                setKeyError(true);
            });
    }, [api, serviceId]);

    useEffect(() => {
        fetchPublicKey();
        subscribeToMessagesChannel();
    }, [echo]);

    useEffect(() => {
        if (appStateStatus === "active") {
            fetchMessages();
        }
    }, [appStateStatus]);

    useEffect(() => {
        formatMessages(messages);
    }, [messages]);

    const formatMessages = (messagesToFormat: Message[]) => {
        const newGroupedMessages = messagesToFormat
            .reduce((acc: { date: string, messages: Message[] }[], message: Message) => {
                const date = message.time.split('T')[0];
                const existingGroup = acc.find(group => group.date === date);

                if (existingGroup) {
                    existingGroup.messages.push(message);
                } else {
                    acc.push({date: date, messages: [message]});
                }
                return acc;
            }, [])
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setGroupedMessages(newGroupedMessages);
    }

    const formatDateSeparator = (date: string) => {
        const dateArray = date.split('-');
        const today = new Date();
        const dateToCheck = new Date(
            parseInt(dateArray[0]),
            parseInt(dateArray[1]) - 1,
            parseInt(dateArray[2])
        );

        const isToday =
            dateToCheck.getDate() === today.getDate() &&
            dateToCheck.getMonth() === today.getMonth() &&
            dateToCheck.getFullYear() === today.getFullYear();

        if (isToday) {
            return t('chat.dates.today');
        }

        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        const isYesterday =
            dateToCheck.getDate() === yesterday.getDate() &&
            dateToCheck.getMonth() === yesterday.getMonth() &&
            dateToCheck.getFullYear() === yesterday.getFullYear();

        if (isYesterday) {
            return t('chat.dates.yesterday');
        }

        const dayNames = [t('chat.dates.sunday'), t('chat.dates.monday'), t('chat.dates.tuesday'), t('chat.dates.wednesday'), t('chat.dates.thursday'), t('chat.dates.friday'), t('chat.dates.saturday')];
        const dayOfWeek = dateToCheck.getDay();
        const dayName = dayNames[dayOfWeek];

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);

        if (dateToCheck >= sevenDaysAgo && dateToCheck <= today) {
            return dayName;
        }

        return `${dateArray[2]}/${dateArray[1]}/${dateArray[0]}`;
    };

    return (
        <SafeAreaView className="flex-1 bg-strongest">
            <View className="flex-1 bg-primary">
                {/* <StatusBar backgroundColor="black" barStyle="light-content"/> */}
                <View className="bg-strongest py-8 px-5 space-y-8 z-10 rounded-b-3xl">
                    <BackHeader
                        backButtonColor="secondary"
                        middleItem={() => (
                            <View className="flex flex-row items-center">
                                <CustomText color="secondary" boldness="medium" numberOfLines={1}>
                                    {openService?.customer?.name}
                                </CustomText>
                            </View>
                        )}
                    />
                    {/* O chat é só conversa. "Estado do serviço" e "Cheguei ao
                        destino" viviam aqui como atalhos, mas duplicavam o que o
                        ecrã de Estado já faz (lá o CTA principal marca a chegada)
                        e enchiam o topo da conversa. */}
                </View>
                <View className="flex-1 px-5 overflow-hidden">
                    {loadingMessages ? (
                        <View className="flex-1 justify-end">
                            <View className="space-y-5">
                                <View className="rounded-3xl rounded-bl-none overflow-hidden w-[50%]">
                                    <View className="w-full h-16 bg-[#111215]"></View>
                                </View>
                                <View className="rounded-3xl rounded-bl-none overflow-hidden w-[70%]">
                                    <View className="w-full h-16 bg-[#111215]"></View>
                                </View>
                                <View className="rounded-3xl rounded-br-none overflow-hidden w-[70%] self-end">
                                    <View className="w-full h-16 bg-[#111215]"></View>
                                </View>
                                <View className="rounded-3xl rounded-bl-none overflow-hidden w-[70%]">
                                    <View className="w-full h-16 bg-[#111215]"></View>
                                </View>
                                <View className="rounded-3xl rounded-br-none overflow-hidden w-[40%] self-end">
                                    <View className="w-full h-16 bg-[#111215]"></View>
                                </View>
                                <View className="rounded-3xl rounded-br-none overflow-hidden w-[52%] self-end">
                                    <View className="w-full h-16 bg-[#111215]"></View>
                                </View>
                                <View className="rounded-3xl rounded-bl-none overflow-hidden w-[35%]">
                                    <View className="w-full h-16 bg-[#111215]"></View>
                                </View>
                                <View className="rounded-3xl rounded-br-none overflow-hidden w-[70%] self-end">
                                    <View className="w-full h-16 bg-[#111215]"></View>
                                </View>
                                <View className="rounded-3xl rounded-bl-none overflow-hidden w-[57%]">
                                    <View className="w-full h-16 bg-[#111215]"></View>
                                </View>
                                <View className="rounded-3xl rounded-bl-none overflow-hidden w-[70%]">
                                    <View className="w-full h-16 bg-[#111215]"></View>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <FlatList
                            data={groupedMessages}
                            keyExtractor={(_, index) => `group-message-${index}`}
                            style={{
                                flex: 1,
                            }}
                            contentContainerStyle={{
                                justifyContent: 'flex-start',
                            }}
                            inverted={groupedMessages.length > 0}
                            renderItem={({item}) => {
                                return (
                                    <View className="space-y-2">
                                        <View className="items-center p-5">
                                            <CustomText
                                                size="extraSmall"
                                                color="strongest"
                                                boldness="semiBold"
                                                numberOfLines={1}
                                                classes="px-3 py-1 bg-support_primary rounded-full flex"
                                            >
                                                {formatDateSeparator(item.date)}
                                            </CustomText>
                                        </View>
                                        {item.messages.map((message, index) => {
                                            if (message.isVendor) {
                                                return (
                                                    <VendorMessage
                                                        key={`vendor-${index}`}
                                                        message={message.message}
                                                        time={formatIsoToTime(message.time)}
                                                    />
                                                );
                                            }
                                            if (message.isCustomer) {
                                                return (
                                                    <CustomerMessage
                                                        key={`customer-${index}`}
                                                        message={message.message}
                                                        time={formatIsoToTime(message.time)}
                                                    />
                                                );
                                            }
                                            return null;
                                        })}
                                    </View>
                                )
                            }}
                        />
                    )}
                    {!loadingMessages && groupedMessages.length === 0 && (
                        <CustomText size="medium" color="secondary" boldness="semiBold" classes="text-center">
                            {t('chat.no_messages')}
                        </CustomText>
                    )}
                    {/* Chave em falta: dizer porque não dá para enviar, em vez de
                        deixar o técnico a carregar num botão que não faz nada. */}
                    {keyError && (
                        <View
                            className="flex-row items-center rounded-2xl border p-3 mb-3"
                            style={{ borderColor: Colors.danger, backgroundColor: 'rgba(255,90,95,0.10)' }}
                        >
                            <Ionicons name="warning-outline" size={20} color={Colors.danger} />
                            <CustomText color="secondary" size="small" classes="flex-1 ml-2" numberOfLines={3}>
                                {t('chat.key_error')}
                            </CustomText>
                            <CustomTouchableOpacity
                                size="small"
                                type="transparent"
                                classes="pl-2"
                                textColor="danger"
                                textBoldness="bold"
                                textSize="small"
                                text={t('general.try_again')}
                                onPress={() => { setKeyError(false); fetchPublicKey(); }}
                            />
                        </View>
                    )}

                    {/* Respostas rápidas — na rua/a conduzir, um toque resolve. */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="flex-grow-0 mt-4"
                        contentContainerStyle={{ paddingHorizontal: 2 }}
                    >
                        {[
                            t('chat.quick_replies.on_the_way'),
                            t('chat.quick_replies.arrived'),
                            t('chat.quick_replies.delay'),
                        ].map((reply) => (
                            <CustomTouchableOpacity
                                key={reply}
                                size="small"
                                type="transparent"
                                classes="mr-2 px-4 py-2 rounded-full bg-strongest"
                                textColor="secondary"
                                textBoldness="medium"
                                text={reply}
                                disabled={sendingMessage || !publicKey}
                                onPress={() => handleSendMessage(reply)}
                            />
                        ))}
                    </ScrollView>
                    <View className="my-6 flex-row items-center">
                        <KeyboardAwareScrollView bottomOffset={40}>
                            <View className="flex-1">
                                <TextInput
                                    className="pl-5 pr-16 py-5 rounded-full bg-strongest text-white"
                                    placeholder={t('chat.input_placeholder')}
                                    placeholderTextColor={Colors.gray_medium}
                                    value={message}
                                    onChangeText={setMessage}
                                />
                                <View className="w-14 absolute right-0 h-full flex-1 items-center justify-center">
                                    {/* `p-0` anulava o padding do componente e deixava a área
                                        de toque nos 24×24 do ícone — o hitSlop repõe-na. */}
                                    <CustomTouchableOpacity
                                        size="small"
                                        type="transparent"
                                        classes="p-0 z-10"
                                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                                        accessibilityRole="button"
                                        accessibilityLabel={t('chat.send')}
                                        onPress={() => {
                                            if (message.trim() !== '') {
                                                handleSendMessage();
                                            }
                                        }}
                                        disabled={sendingMessage || !publicKey}
                                    >
                                        {message !== '' && (
                                            <Ionicons name="send" size={24} color={Colors.secondary}/>
                                        )}
                                    </CustomTouchableOpacity>
                                </View>
                            </View>
                        </KeyboardAwareScrollView>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    )
}

export default Service;
