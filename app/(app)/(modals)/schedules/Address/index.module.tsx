import {StyleSheet} from "react-native";

export default () => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSheet: {
    backgroundColor: "#111113",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  indicator: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2b2b2b",
    alignSelf: "center",
    marginVertical: 12,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    color: "#9b9b9b",
    marginTop: 4,
    fontSize: 14,
  },
  content: {
    paddingBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: "#d6d6d9",
    marginBottom: 6,
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2f2f33",
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#fff",
    backgroundColor: "#16161a",
    fontSize: 16,
  },
  inlineRow: {
    flexDirection: "row",
    gap: 12,
  },
  inlineItem: {
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2f2f33",
    alignItems: "center",
  },
  secondaryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#f7b85a",
    alignItems: "center",
  },
  primaryBtnDisabled: {
    backgroundColor: "#6a5332",
  },
  primaryText: {
    color: "#111",
    fontWeight: "700",
    fontSize: 16,
  },
});