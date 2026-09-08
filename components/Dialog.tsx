import { useDialog } from "@/contexts/DialogContext";
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { CustomText } from "./CustomText";
import CustomTouchableOpacity from "./CustomTouchableOpacity";
import { useClickOutside } from "react-native-click-outside";
import { StatusBar } from "expo-status-bar";
import Modal from "react-native-modal";
import { Colors } from '@/constants/Colors';


const Dialog: React.FC = () => {
  const { isOpen, closeDialog, content } = useDialog();

  const dropDownRef = useClickOutside<View>(() => {
    if (content?.onCancel) content?.onCancel();
    closeDialog();
  });

  useEffect(() => {
    if (content && content.closeAfterMSeconds) {
      const timer = setTimeout(() => {
        closeDialog();
      }, content.closeAfterMSeconds || 2000);
      return () => clearTimeout(timer);
    }
  }, [content, closeDialog]);

  return (
    <Modal
      isVisible={isOpen}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropColor="rgba(0, 0, 0, 0.7)"
    >
      <View className="items-center justify-center rounded-3xl" style={{ backgroundColor: Colors.primary }}>
        <StatusBar style="light" backgroundColor="rgba(0, 0, 0, 0.5)" animated />

        {content && (
          content.customContent ? content.customContent : (
            <View
              ref={content?.closeOnClickOutside ? dropDownRef : undefined}
              className="w-full space-y-8 p-8"
            >
              {content.icon && (
                <View className="items-center justify-center">
                  <View className="w-10 h-10 p-3 rounded-full" style={{ backgroundColor: Colors.support_primary }}>
                    {content.icon}
                  </View>
                </View>
              )}
              <View className="space-y-3">
                <CustomText size="large" color="secondary" boldness="bolder" className="text-center">{content.title}</CustomText>
                {content.subtitle && (
                  <CustomText size="small" color="muted" boldness="regular" className="text-center" style={{ lineHeight: 20 }}>{content.subtitle}</CustomText>
                )}
              </View>
              {content.successButtonText && content.cancelButtonText && (
                <View className="flex-row justify-between">
                  <CustomTouchableOpacity
                    size="large"
                    type={content.dangerCancel ? "danger_outline" : "secondary_outline"}
                    textColor={content.dangerCancel ? "danger" : "secondary"}
                    textBoldness="bold"
                    text={content.cancelButtonText}
                    onPress={() => {
                      closeDialog();
                      if (content.onCancel) content.onCancel();
                    }}
                    textNumberOfLines={2}
                    textClasses="text-center"
                    classes="w-[48%] py-3"
                  />
                  <CustomTouchableOpacity
                    size="large"
                    type="support_primary"
                    textColor="primary"
                    text={content.successButtonText}
                    onPress={() => {
                      closeDialog();
                      if (content.onSuccess) content.onSuccess();
                    }}
                    textNumberOfLines={2}
                    textBoldness="bolder"
                    textClasses="text-center"
                    classes="w-[48%] py-3"
                  />
                </View>
              )}
            </View>
          )
        )}
      </View>
    </Modal>
  );
};

export default Dialog;