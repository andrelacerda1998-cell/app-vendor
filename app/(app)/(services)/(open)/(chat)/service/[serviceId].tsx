import {Colors} from '@/constants/Colors';
import {Ionicons} from '@expo/vector-icons';
import {router} from 'expo-router';
import React, {useEffect, useRef, useState} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {FlatList, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Text, TextInput, View} from 'react-native';
import BackHeader from '@/components/app/BackHeader';
import {useSession} from '@/contexts/SessionContext';
import {CustomText} from "@/components/CustomText";
import ClipIcon from "@/assets/icons/clip";
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity";
import {useApi} from "@/contexts/ApiContext";
import {API_ROUTES} from "@/constants/ApiRoutes";
import useEcho from "@/hooks/echo";
import {RSA} from "react-native-rsa-native";
import {useService} from "@/contexts/ServiceContext";
import CheckMark from "@/assets/icons/check-mark";
import {useDialog} from "@/contexts/DialogContext";
import XIcon from "@/assets/icons/x";
import {ServiceStatus} from "@/types/services";
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

// const HeaderRightItem = () => {
//   const [showPopUp, setShowPopUp] = useState(false);

//   // const goToMakePayment = () => {
//   //   router.push('/(app)/(pages)/(services)/(open)/(payment)/start/1');
//   // };

//   return (
//     <View className="relative">
//       <CustomTouchableOpacity
//         size="small"
//         type="transparent"
//         classes="p-0"
//         onPress={() => setShowPopUp(prev=>!prev)}
//       >
//         <Entypo name="dots-three-vertical" size={24} color={Colors.secondary} />
//       </CustomTouchableOpacity>
//       {showPopUp && (
//         <View className="w-44 bg-support_secondary rounded-md absolute top-10 right-0 p-2">
//           <CustomTouchableOpacity
//             size="small"
//             type="transparent"
//             onPress={() => {
//               setShowPopUp(prev=>!prev);
//               // goToMakePayment();
//             }}
//             classes="p-0 mb-2"
//           >
//             <View className="w-full h-full rounded-md border border-secondary">
//               <CustomText size="small" color="secondary" boldness="regular" classes="p-3">
//                 Make payment
//               </CustomText>
//             </View>
//           </CustomTouchableOpacity>
//           <CustomTouchableOpacity
//             size="small"
//             type="transparent"
//             onPress={() => setShowPopUp(prev=>!prev)}
//             classes="p-0"
//           >
//             <View className="w-full h-full rounded-md border border-secondary">
//               <CustomText size="small" color="secondary" boldness="regular" classes="p-3">
//                 Help
//               </CustomText>
//             </View>
//           </CustomTouchableOpacity>
//         </View>
//       )}
//     </View>
//   )
// }

const Service = () => {
    const {t} = useTranslation();
    const {api} = useApi();
    const echo = useEcho();
    const {vendorData} = useSession();
    const {openService, setOpenService, clearUnreadMessages} = useService();
    const serviceId = openService?.id;
    const [message, setMessage] = useState('');
    const [publicKey, setPublicKey] = useState<string>();
    const {openDialog} = useDialog();
    const [messages, setMessages] = useState<Message[]>([]);
    const [groupedMessages, setGroupedMessages] = useState<{ date: string, messages: Message[] }[]>([]);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [loadingArrivedAtDestination, setLoadingArrivedAtDestination] = useState(false);
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

    const handleSendMessage = async () => {
        if (!publicKey) return;
        setSendingMessage(true);
        const messageToSend = message;
        setMessage('');

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
            .then(() => setMessage(''))
            .catch((error) => {
                console.error(error)
                setMessage(messageToSend);
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
                    title: t('errors.title'),
                    subtitle: error?.response?.data?.metadata?.message || error?.response?.data?.message || t('errors.occurred_an_error'),
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

    const handleArrivedAtDestination = () => {
        setLoadingArrivedAtDestination(true);
        api.post(API_ROUTES.POST_ARRIVED_AT_DESTINATION_SERVICE(`${serviceId}`))
            .then(({data}) => {
                setOpenService(data.data.service);
                openDialog({
                    icon: <CheckMark color={Colors.primary}/>,
                    title: t('chat.arrived_at_destination.title'),
                    subtitle: t('chat.arrived_at_destination.subtitle'),
                    closeAfterMSeconds: 2000,
                    closeOnClickOutside: true,
                })
            })
            .catch(() => {
                openDialog({
                    icon: <XIcon color={Colors.primary}/>,
                    title: t('errors.title'),
                    subtitle: t('errors.occurred_an_error'),
                    closeAfterMSeconds: 2000,
                    closeOnClickOutside: true,
                })
            })
            .finally(() => setLoadingArrivedAtDestination(false));
    }

    // Clear unread messages when chat is opened
    useEffect(() => {
        clearUnreadMessages();
    }, []);

    useEffect(() => {
        api.get(API_ROUTES.GET_SERVICE_PUBLIC_KEY(`${serviceId}`))
            .then((res) => {
                // console.log({res})
                setPublicKey(res.data.data.public_key);
            })
            .catch((error) => {
                openDialog({
                    icon: <XIcon color={Colors.primary}/>,
                    title: t('errors.title'),
                    subtitle: t('errors.occurred_an_error'),
                    closeAfterMSeconds: 2000,
                    closeOnClickOutside: true,
                })
            })
            // .catch((error) => console.log(error.data.message, 'error data message'));
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
                // console.log({message}, 'message is over here')
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
                    {openService?.status === ServiceStatus.ACCEPTED && (
                        <View className="flex-row justify-between items-center">
                            <CustomTouchableOpacity
                                size="medium"
                                text={t('chat.actions.service_status')}
                                type="secondary_outline"
                                textColor="secondary"
                                textBoldness="medium"
                                classes="w-[48%] h-full"
                                onPress={() => router.navigate(`/(app)/(services)/(open)/status/${openService?.id}`)}
                                disabled={loadingArrivedAtDestination}
                            />
                            <CustomTouchableOpacity
                                size="medium"
                                text={t('chat.actions.arrived_at_destination')}
                                type="support_primary"
                                textColor="strongest"
                                textBoldness="medium"
                                classes="w-[48%]"
                                textClasses="text-center"
                                textNumberOfLines={2}
                                onPress={handleArrivedAtDestination}
                                disabled={loadingArrivedAtDestination}
                            />
                        </View>
                    )}
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
                                    <CustomTouchableOpacity
                                        size="small"
                                        type="transparent"
                                        classes="p-0 z-10"
                                        onPress={() => {
                                            if (message.trim() !== '') {
                                                handleSendMessage();
                                            }
                                        }}
                                        disabled={sendingMessage || loadingArrivedAtDestination}
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
