import React, { useEffect, useMemo, useState } from "react";
import { Modal, SafeAreaView, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Pressable } from "react-native";
import createStyles from "./index.module";
import {useTranslation} from "react-i18next";
import {AddressData} from "@/types/schedule";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (address: AddressData) => void;
  initialValue?: Partial<AddressData>;
};

const EMPTY_ADDRESS: AddressData = {
  street: "",
  number: "",
  city: "",
  postalCode: "",
};

const Address = ({ visible, onClose, onSave, initialValue }: Props) => {
  const hydratedInitial = useMemo(() => ({ ...EMPTY_ADDRESS, ...initialValue }), [initialValue]);
  const [form, setForm] = useState<AddressData>(hydratedInitial);

  const { t } = useTranslation();

  const styles = createStyles();

  useEffect(() => {
    if (visible) {
      setForm(hydratedInitial);
    }
  }, [hydratedInitial, visible]);

  const handleChange = (field: keyof AddressData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const trimmedForm = useMemo(
    () => ({
      street: form.street?.trim() ?? "",
      number: form.number?.trim() ?? "",
      city: form.city?.trim() ?? "",
      postalCode: form.postalCode?.trim() ?? "",
    }),
    [form]
  );

  const canSave = Object.values(trimmedForm).every((value) => value.length > 0);

  const handleSave = () => {
    if (!canSave) {
      return;
    }
    onSave(trimmedForm);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.bottomSheet}
        >
          <View style={styles.indicator} />
          <View style={styles.header}>
            <Text style={styles.title}>{t('schedules.address.address')}</Text>
            <Text style={styles.subtitle}>{t('schedules.address.insert_address')}</Text>
          </View>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('schedules.address.street')}</Text>
              <TextInput
                value={form.street}
                onChangeText={(text) => handleChange("street", text)}
                placeholder={t('schedules.address.placeholder_street')}
                placeholderTextColor="#6b6b6f"
                style={styles.input}
              />
            </View>
            <View style={styles.inlineRow}>
              <View style={[styles.inputGroup, styles.inlineItem]}>
                <Text style={styles.label}>{t('schedules.address.number')}</Text>
                <TextInput
                  value={form.number}
                  onChangeText={(text) => handleChange("number", text)}
                  placeholder="123"
                  placeholderTextColor="#6b6b6f"
                  style={styles.input}
                />
              </View>
              <View style={[styles.inputGroup, styles.inlineItem]}>
                <Text style={styles.label}>{t('schedules.address.postal_code')}</Text>
                <TextInput
                  value={form.postalCode}
                  onChangeText={(text) => handleChange("postalCode", text)}
                  placeholder="0000-000"
                  placeholderTextColor="#6b6b6f"
                  style={styles.input}
                  keyboardType="numbers-and-punctuation"
                  autoCapitalize="characters"
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('schedules.address.city')}</Text>
              <TextInput
                value={form.city}
                onChangeText={(text) => handleChange("city", text)}
                placeholder={t('schedules.address.placeholder_city')}
                placeholderTextColor="#6b6b6f"
                style={styles.input}
              />
            </View>
          </ScrollView>
          <View style={styles.footer}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={onClose}>
              <Text style={styles.secondaryText}>{t('schedules.address.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, !canSave && styles.primaryBtnDisabled]}
              onPress={handleSave}
              disabled={!canSave}
            >
              <Text style={styles.primaryText}>{t('schedules.address.save')}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

export default Address;
