import {
  StyleSheet,
  Switch,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import React, {useEffect, useState} from "react";
import Availability from "@/app/(app)/(modals)/schedules/Availability";
import { WeekdayConfig } from "@/types/schedule";
import { useSchedule } from "@/contexts/ScheduleContext";
import {API_ROUTES} from "@/constants/ApiRoutes";
import {useApi} from "@/contexts/ApiContext";
import { useDebouncedCallback } from "use-debounce";
import {useSession} from "@/contexts/SessionContext";

const AvailabilityElements = () => {
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

  useEffect(() => {
    debouncedSave();
  }, [weekdays, debouncedSave]);

  const toggleWeekday = (weekdayKey: string) => {
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
      <View style={styles.weekdaysContainer}>
        {weekdays.map((d) => (
          <View key={d.key} style={styles.weekRow}>
            <View style={styles.weekLeft}>
              <Switch
                value={d.enabled}
                onValueChange={() => {
                  toggleWeekday(d.key)
                }}
                thumbColor={d.enabled ? "#F8C06D" : "#404040"}
                trackColor={{ true: "#5a4527", false: "#2a2a2a" }}
              />
              <Text style={[styles.weekLabel, !d.enabled && styles.weekLabelDisabled]}>{d.label}</Text>
            </View>
            <TouchableOpacity
              style={[styles.timePill, !d.enabled && styles.timePillDisabled]}
              disabled={!d.enabled}
              onPress={() => {
                setWeekdayEditor(d)
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.timePillText}>{`${d.start} - ${d.end}`}</Text>
            </TouchableOpacity>
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
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  // Weekday rows (switch + label + time pill)
  weekdaysContainer: {
    marginBottom: 16,
    gap: 12,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  weekLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  weekLabel: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  weekLabelDisabled: {
    color: "#8a8a8a",
  },
  timePill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3a3a3a",
    backgroundColor: "#1a1a1a",
  },
  timePillDisabled: {
    opacity: 0.5,
  },
  timePillText: {
    color: "#cfcfcf",
    fontSize: 13,
    fontWeight: "600",
  },
})

export default AvailabilityElements;