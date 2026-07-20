import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import createStyles from "./index.module";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (range: { start: string; end: string }) => void;
  initialStart?: string; // format HH:mm
  initialEnd?: string; // format HH:mm
};

function parseTimeToDate(time?: string) {
  // returns a Date today with given HH:mm in UTC to avoid TZ shifts in display string
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  if (!time) return d;
  const [hh, mm] = time.split(":").map((v) => parseInt(v, 10));
  d.setUTCHours(hh || 0, mm || 0, 0, 0);
  return d;
}

function formatHM(date: Date) {
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

const Availability = ({ visible, onClose, onSave, initialStart = "08:00", initialEnd = "19:00" }: Props) => {
  const [start, setStart] = useState<Date>(() => parseTimeToDate(initialStart));
  const [end, setEnd] = useState<Date>(() => parseTimeToDate(initialEnd));
  const [pickerFor, setPickerFor] = useState<"start" | "end" | null>(null);

  useEffect(() => {
    if (visible) {
      setStart(parseTimeToDate(initialStart));
      setEnd(parseTimeToDate(initialEnd));
    }
  }, [visible, initialStart, initialEnd]);

  const isValid = useMemo(() => start.getTime() < end.getTime(), [start, end]);

  const handleConfirm = (d: Date) => {
    const onlyTime = new Date(Date.UTC(1970, 0, 1, d.getHours(), d.getMinutes(), 0, 0));
    if (pickerFor === "start") setStart(onlyTime);
    if (pickerFor === "end") setEnd(onlyTime);
    setPickerFor(null);
  };

  const styles = createStyles();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.bottomSheet}>
          <View style={styles.indicator} />
          <View style={styles.header}>
            <Text style={styles.title}>Intervalo de Disponibilidade</Text>
            <Text style={styles.subtitle}>
              Defina o intervalo horário que quer disponibilizar para agendamento de serviços.
            </Text>
          </View>
          <View style={styles.rowHeader}>
            <Text style={styles.smallLabel}>A partir das</Text>
            <Text style={styles.smallLabel}>Até às</Text>
          </View>
          <View style={styles.inlineRow}>
            <TouchableOpacity style={styles.timeInput} onPress={() => setPickerFor("start")}>
              <Text style={styles.timeText}>{formatHM(start)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.timeInput} onPress={() => setPickerFor("end")}>
              <Text style={styles.timeText}>{formatHM(end)}</Text>
            </TouchableOpacity>
          </View>

          {!isValid && (
            <Text style={styles.errorText}>Hora inicial deve ser menor que a final</Text>
          )}

          <View style={styles.footer}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={onClose}>
              <Text style={styles.secondaryText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, !isValid && styles.primaryBtnDisabled]}
              onPress={() => isValid && onSave({ start: formatHM(start), end: formatHM(end) })}
              disabled={!isValid}
            >
              <Text style={styles.primaryText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>

        <DateTimePickerModal
          isVisible={pickerFor !== null}
          mode="time"
          is24Hour
          onConfirm={handleConfirm}
          onCancel={() => setPickerFor(null)}
          date={pickerFor === "start" ? start : end}
          // display={Platform.OS === "ios" ? "spinner" : "default"}
          //changed to hide the clock on android devices
          display='spinner'
        />     
      </SafeAreaView>
    </Modal>
  );
};

export default Availability;

