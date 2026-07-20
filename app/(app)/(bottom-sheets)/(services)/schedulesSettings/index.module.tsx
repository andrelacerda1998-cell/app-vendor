import { StyleSheet, Dimensions } from "react-native";

const PADDING = 20;
const CARD_RADIUS = 10;

export default (w: number) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0f0f10",
  },
  header: {
    height: 95,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: PADDING,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  headerRightPlaceholder: {
    width: 36,
  },
  content: {
    flex: 1,
    paddingHorizontal: PADDING,
    paddingTop: 8,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 6,
  },
  addressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addressText: {
    color: "#BDBDBD",
    fontSize: 13,
  },
  editText: {
    color: "#BDBDBD",
    fontSize: 13,
  },
  settingsSchedule: {
    marginTop: 20,
    marginBottom: 65,
  },
  settingsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  settingsTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  settingsOptions: {
    display: 'flex',
    flexDirection: 'row',
    gap: 45
  },
  daysList: {
    paddingBottom: 24,
  },
  dayBlock: {
    marginBottom: 12,
  },
  dayHeader: {
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: "#333",
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "transparent",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayHeaderActive: {
    borderColor: "#F8C06D",
  },
  dayHeaderText: {
    color: "#F8C06D",
    fontSize: 15,
    fontWeight: "700",
  },
  rangesContainer: {
    marginTop: 8,
  },
  rangesRow: {
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: "#333",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#0b0b0b",
  },
  rangesText: {
    color: "#BDBDBD",
    fontSize: 13,
  },
  continueButton: {
    margin: 20,
    backgroundColor: "#F8C06D",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  continueText: {
    color: "#0b0b0b",
    fontWeight: "700",
    fontSize: 16,
  },
});

