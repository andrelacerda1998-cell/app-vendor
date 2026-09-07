import {
  StyleSheet,
  Switch,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import React, {useEffect, useRef, useState} from "react";
import Availability from "@/app/(app)/(modals)/schedules/Availability";
import { WeekdayConfig } from "@/types/schedule";
import { useSchedule } from "@/contexts/ScheduleContext";
import {API_ROUTES} from "@/constants/ApiRoutes";
import {useApi} from "@/contexts/ApiContext";
import { useDebouncedCallback } from "use-debounce";
import {useSession} from "@/contexts/SessionContext";
import { Colors } from "@/constants/Colors";
import { useTranslation } from "react-i18next";

const AvailabilityElements = () => {
  const { t } = useTranslation();
  const styles = createStyles();
  const { weekdays, setWeekdays, getScheduleSettings } = useSchedule();
  const { vendorData } = useSession();
  const { api } = useApi();

  const [weekdayEditor, setWeekdayEditor] = useState<WeekdayConfig | null>(null);

  const debouncedSave = useDebouncedCallback(() => {
    saveAvailability();
  }, 500);

  useEffect(() => {
    getScheduleSettings();
  }, [vendorData]);

  // Só gravar quando o TÉCNICO mexe. Antes este efeito também corria quando o
  // getScheduleSettings preenchia os dias, ou seja: abrir o ecrã escrevia sempre
  // no servidor. Com recargas seguidas isso chegava a apanhar 429 (Too Many
  // Requests) e a deixar a disponibilidade por gravar.
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (!dirtyRef.current) return;
    debouncedSave();
  }, [weekdays, debouncedSave]);

  const toggleWeekday = (weekdayKey: string) => {
    dirtyRef.current = true;
    setWeekdays((prev: WeekdayConfig[]) => prev.map((day) => (day.key === weekdayKey ? { ...day, enabled: !day.enabled } : day)));
  };

  const saveAvailability = () => {
    const payload = weekdays.reduce<Record<string, any>>((acc, day) => {
      acc[day.key] = {
        time_start: day.start,
        time_end: day.end,
        is_enabled: day.enabled
      };

      return acc;
    }, {});

    api.post(API_ROUTES.VENDOR_UPDATE_SCHEDULE_AVAILABILITY, {available_days: payload}).catch((error) => {
      console.error("Failed to save availability:", error.response?.data || error.message);
    });
  }

  return (
    <View>
      <View>
        {weekdays.map((d, i) => (
          <View key={d.key}>
            {i > 0 && <View style={styles.separator} />}
            <View style={styles.weekRow}>
              {/* Nome do dia primeiro: é por ele que se procura na lista. */}
              <Text style={[styles.weekLabel, !d.enabled && styles.weekLabelDisabled]} numberOfLines={1}>
                {d.label}
              </Text>

              {d.enabled ? (
                <TouchableOpacity
                  style={styles.timePill}
                  onPress={() => setWeekdayEditor(d)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.timePillText}>{`${d.start} – ${d.end}`}</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.closedText}>{t('schedules.day_off')}</Text>
              )}

              <Switch
                value={d.enabled}
                onValueChange={() => toggleWeekday(d.key)}
                thumbColor={Colors.secondary}
                trackColor={{ false: Colors.card_high, true: Colors.brand }}
                style={styles.switch}
              />
            </View>
          </View>
        ))}
      </View>
      <Availability
        visible={!!weekdayEditor}
        onClose={() => {
          setWeekdayEditor(null)
        }}
        onSave={(data) => {
          if (!weekdayEditor) return;
          dirtyRef.current = true;
          setWeekdays((prev) => prev.map((x) => (x.key === weekdayEditor.key ? { ...x, start: data.start, end: data.end } : x)));
          setWeekdayEditor(null);
        }}
        initialStart={weekdayEditor?.start}
        initialEnd={weekdayEditor?.end}
      />
    </View>
  );
}

const createStyles = () => StyleSheet.create({
  availabilityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  availabilityTitle: {
    color: Colors.secondary,
    fontSize: 16,
    fontWeight: "700",
  },
  // Linhas dos dias: nome · horário · interruptor
  weekRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 54,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.line,
  },
  weekLabel: {
    flex: 1,
    color: Colors.secondary,
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
  },
  weekLabelDisabled: {
    color: Colors.muted,
  },
  timePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(250,187,91,0.35)",
    backgroundColor: "rgba(250,187,91,0.12)",
  },
  timePillText: {
    color: Colors.brand,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12.5,
  },
  closedText: {
    color: Colors.muted,
    fontFamily: "Poppins_500Medium",
    fontSize: 12.5,
  },
  switch: {
    marginLeft: 12,
  },
})

export default AvailabilityElements;