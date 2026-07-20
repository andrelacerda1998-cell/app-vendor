import React from "react";
import { Modal, Pressable, SafeAreaView, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Colors } from "@/constants/Colors";

export type MessageConfirmation = {
  title: string;
  subtitle: string;
}

type Props = {
  visible: boolean;
  message: MessageConfirmation;
  onConfirm: () => void;
  onCancel: () => void;
};

const Confirmation = ({ visible, message, onConfirm, onCancel }: Props) => {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <SafeAreaView style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onCancel} />
        <View style={styles.modal}>
          <Text style={styles.title}>{message.title}</Text>
          <Text style={styles.subtitle}>{message.subtitle}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={onCancel}>
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>{t("general.no")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={onConfirm}>
              <Text style={styles.primaryButtonText}>{t("general.yes")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
  },
  modal: {
    backgroundColor: Colors.strongest,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.secondary,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.gray_medium,
  },
  addressBox: {
    backgroundColor: Colors.gray_strong,
    borderRadius: 12,
    padding: 16,
  },
  addressText: {
    color: Colors.secondary,
    fontSize: 16,
    lineHeight: 22,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButton: {
    backgroundColor: Colors.gray_strong,
  },
  primaryButton: {
    backgroundColor: Colors.support_primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: Colors.secondary,
  },
  primaryButtonText: {
    color: Colors.strongest,
  },
});

export default Confirmation;
