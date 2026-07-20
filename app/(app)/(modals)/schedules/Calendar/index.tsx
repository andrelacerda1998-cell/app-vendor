import React, { useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from "react-native";
import ArrowIcon from "@/assets/icons/arrow";
import createStyle from './index.module';
import {useTranslation} from "react-i18next";

export type TimeBlock = {
  id: string;
  time: string;
  setBlocks: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (blocks: TimeBlock[], selectedDate: Date) => void;
  initialDate?: Date;
  initialBlocks?: TimeBlock[];
  initialBlocksByDate?: Record<string, TimeBlock[]>;
};

const { width } = Dimensions.get("window");

const TIME_OPTIONS = [
  "00:00",
  "01:00",
  "02:00",
  "03:00",
  "04:00",
  "05:00",
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
];
const DEFAULT_BLOCK_TIME = "10:00";

function formatDateRange(base: Date) {
  const monday = startOfWeek(base);
  const sunday = endOfWeek(base);
  return `${formatDate(monday)} - ${formatDate(sunday)}`;
}

function startOfWeek(d: Date) {
  const copy = new Date(d);
  // start Monday
  const day = copy.getDay() || 7;
  copy.setDate(copy.getDate() - (day - 1));
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfWeek(d: Date) {
  const s = startOfWeek(d);
  const copy = new Date(s);
  copy.setDate(copy.getDate() + 6);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function formatDate(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function weekdaysOfWeek(base: Date) {
  const start = startOfWeek(base);
  return Array.from({ length: 7 }).map((_, i) => {
    const dt = new Date(start);
    dt.setDate(start.getDate() + i);
    return dt;
  });
}

function cloneBlocks(blocks?: TimeBlock[]) {
  return blocks ? blocks.map((block) => ({ ...block })) : [];
}

function getDateKey(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const Calendar = ({
  visible,
  onClose,
  onSave,
  initialDate,
  initialBlocks,
  initialBlocksByDate,
}: Props) => {
  const fallbackDate = useMemo(() => initialDate ?? new Date(), [initialDate]);
  const initialBlocksMap = useMemo(() => {
    if (initialBlocksByDate && Object.keys(initialBlocksByDate).length) {
      return Object.entries(initialBlocksByDate).reduce(
        (acc, [key, list]) => ({ ...acc, [key]: cloneBlocks(list) }),
        {} as Record<string, TimeBlock[]>
      );
    }
    if (initialBlocks?.length) {
      return { [getDateKey(fallbackDate)]: cloneBlocks(initialBlocks) };
    }
    return {} as Record<string, TimeBlock[]>;
  }, [initialBlocksByDate, initialBlocks, fallbackDate]);
  const [weekBase, setWeekBase] = useState<Date>(fallbackDate);
  const [selectedDate, setSelectedDate] = useState<Date>(fallbackDate);
  const [dateBlocks, setDateBlocks] = useState<Record<string, TimeBlock[]>>(initialBlocksMap);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const currentDateKey = getDateKey(selectedDate);
  const blocks = dateBlocks[currentDateKey] ?? [];
  const weekDays = useMemo(() => weekdaysOfWeek(weekBase), [weekBase]);

  const { t } = useTranslation();

  const styles = createStyle(width);

  function updateBlocksForDate(targetDate: Date, updater: (prev: TimeBlock[]) => TimeBlock[]) {
    const key = getDateKey(targetDate);
    setDateBlocks((prev) => {
      const prevForDate = prev[key] ?? [];
      const updated = updater(prevForDate);
      if (!updated.length) {
        if (!(key in prev)) {
          return prev;
        }
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: updated };
    });
  }

  function changeWeek(offsetWeeks: number) {
    const next = new Date(weekBase);
    next.setDate(next.getDate() + offsetWeeks * 7);
    setWeekBase(next);

    const s = startOfWeek(next);
    const e = endOfWeek(next);
    if (selectedDate < s || selectedDate > e) {
      setSelectedDate(new Date(s));
    }
  }

  function addBlock() {
    const id1 = `b1${Date.now()}`;
    const id2 = `b2${Date.now()}`;
    const setBlocks = `sb${Date.now()}`;
    updateBlocksForDate(selectedDate, (prev) => [...prev, { id: id1, time: DEFAULT_BLOCK_TIME, setBlocks }]);
    updateBlocksForDate(selectedDate, (prev) => [...prev, { id: id2, time: DEFAULT_BLOCK_TIME, setBlocks}]);
  }

  function removeBlock(id: string) {
    updateBlocksForDate(selectedDate, (prev) => prev.filter((b) => b.id !== id));
    setOpenDropdownId((prev) => (prev === id ? null : prev));
  }

  function setBlockTime(id: string, time: string) {
    updateBlocksForDate(selectedDate, (prev) => prev.map((b) => (b.id === id ? { ...b, time } : b)));
    setOpenDropdownId(null);
  }

  const renderDropdown = (blockId: string, currentTime: string) => (
    <View style={styles.dropdownWrapper}>
      <ScrollView
        nestedScrollEnabled
        style={styles.dropdown}
        contentContainerStyle={styles.dropdownContent}
      >
        {TIME_OPTIONS.map((t) => (
          <Pressable
            key={t}
            onPress={() => setBlockTime(blockId, t)}
            style={[
              styles.dropdownItem,
              t === currentTime && styles.dropdownItemActive,
            ]}
          >
            <Text
              style={[
                styles.dropdownItemText,
                t === currentTime && styles.dropdownItemTextActive,
              ]}
            >
              {t}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <SafeAreaView style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.container}>
          <View style={styles.indicator} />

          <ScrollView
            bounces={false}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.weekNavRow}>
              <TouchableOpacity onPress={() => changeWeek(-1)}>
                <Text style={styles.navArrow}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.weekRange}>{formatDateRange(weekBase)}</Text>
              <TouchableOpacity onPress={() => changeWeek(1)}>
                <Text style={styles.navArrow}>›</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.headerLine} />

            <View style={styles.weekRow}>
              <View style={styles.weekdayLabels}>
                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((label) => (
                  <Text key={label} style={styles.weekdayLabel}>
                    {label}
                  </Text>
                ))}
              </View>

              <View style={styles.dayNumbers}>
                {weekDays.map((d) => {
                  const isSelected = d.toDateString() === selectedDate.toDateString();
                  return (
                    <TouchableOpacity
                      key={d.toISOString()}
                      onPress={() => setSelectedDate(new Date(d))}
                      style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
                    >
                      <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>
                        {d.getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <Text style={styles.sectionTitle}>{t('schedules.calendar.blocks_hourly')}</Text>

            <View style={styles.blocksList}>
              {blocks.map((b) => (
                <View key={b.id} style={styles.blockRow}>
                  <TouchableOpacity
                    onPress={() =>
                      setOpenDropdownId(openDropdownId === b.id ? null : b.id)
                    }
                    style={[styles.blockSelect, openDropdownId === b.id && styles.blockSelectActive]}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.blockTime}>{b.time}</Text>
                    <ArrowIcon color={"#f7b85a"} position={openDropdownId === b.id ? "up" : "down"} size={12} />
                  </TouchableOpacity>

                  {openDropdownId === b.id && renderDropdown(b.id, b.time)}
                </View>
              ))}
            </View>

            <TouchableOpacity onPress={addBlock} style={styles.addBtn}>
              <Text style={styles.addPlus}>＋</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => onSave(dateBlocks[currentDateKey] ?? [], selectedDate)}
            >
              <Text style={styles.saveText}>{t('schedules.calendar.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export default Calendar;

