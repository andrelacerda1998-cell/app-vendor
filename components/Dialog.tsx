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
      backdropColor="rgba(0, 0, 0, 0.85)"
    >
      {/* O dialogo tem de se DESCOLAR do ecra.
          Estava em Colors.primary (#1B1B1B) — praticamente a mesma cor do
          fundo da app (#0C0C0E) e dos cartoes (#1A1A1D) —, sem borda nem
          sombra. Num ecra quase preto lia-se como uma mancha, nao como uma
          coisa por cima. Passa ao tom mais claro da escala (card_high), com
          borda e sombra, e o escurecimento por tras sobe de 0.7 para 0.85. */}
      <View
        className="items-center justify-center rounded-3xl border"
        style={{
          backgroundColor: Colors.card_high,
          borderColor: 'rgba(255,255,255,0.12)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.55,
          shadowRadius: 28,
          elevation: 16,
        }}
      >
        <StatusBar style="light" backgroundColor="rgba(0, 0, 0, 0.5)" animated />

        {content && (
          content.customContent ? content.customContent : (
            <View
              ref={content?.closeOnClickOutside ? dropDownRef : undefined}
              className="w-full gap-y-8 p-8"
            >
              {content.icon && (
                <View className="items-center justify-center">
                  <View className="w-12 h-12 p-3.5 rounded-full items-center justify-center" style={{ backgroundColor: Colors.brand }}>
                    {content.icon}
                  </View>
                </View>
              )}
              <View className="gap-y-3">
                <CustomText size="large" color="secondary" boldness="bolder" className="text-center">{content.title}</CustomText>
                {/* Era `muted` a small: passava no contraste mas lia-se mal —
                    e este texto costuma trazer a informacao que interessa (a
                    hora a que ficou de aparecer). Sobe para o branco a 85% e
                    um tamanho acima. */}
                {content.subtitle && (
                  <CustomText
                    size="medium"
                    color="secondary"
                    boldness="regular"
                    className="text-center"
                    style={{ lineHeight: 22, opacity: 0.85 }}
                  >
                    {content.subtitle}
                  </CustomText>
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