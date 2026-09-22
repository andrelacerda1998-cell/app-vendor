import { StyleSheet } from "react-native";
import { Colors } from '@/constants/Colors';

/**
 * Esta folha era escrita a cores fixas escuras (#111113, #16161a, #2f2f33)
 * com DUAS excepções que liam o tema: `title` e `timeText`, ambas em
 * `Colors.secondary`.
 *
 * Em tema claro o `secondary` é quase preto (#101012) e a caixa continuava
 * escura — as horas ficavam texto preto sobre fundo preto, invisíveis. O que
 * o técnico via era um campo vazio onde devia estar "08:00".
 *
 * Passou tudo a tokens. A função já é chamada a cada render (ver o
 * `createStyles()` no componente), por isso acompanha a troca de tema sozinha.
 */
export default () => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject },
  bottomSheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 24,
    paddingHorizontal: 24,
    paddingTop: 6,
  },
  indicator: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.line,
    alignSelf: "center",
    marginVertical: 12,
  },
  header: { marginBottom: 12 },
  title: { color: Colors.secondary, fontSize: 18, fontWeight: "700" },
  subtitle: { color: Colors.muted, marginTop: 6, fontSize: 14 },
  rowHeader: { flexDirection: "row", justifyContent: "space-around", marginTop: 12 },
  smallLabel: { color: Colors.muted, fontSize: 13, fontWeight: "600", width: "auto", margin: "auto" },
  inlineRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  timeInput: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.bg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  timeText: { color: Colors.secondary, fontSize: 16, fontWeight: "600" },
  errorText: { color: Colors.danger, marginTop: 8, fontSize: 12 },
  footer: { flexDirection: "row", gap: 12, marginTop: 16 },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.line,
    alignItems: "center",
  },
  secondaryText: { color: Colors.secondary, fontWeight: "600", fontSize: 16 },
  // O amarelo da marca é o mesmo nos dois temas (`support_primary`); o que
  // muda é o texto por cima, que tem de ser sempre o escuro do contraste.
  primaryBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, backgroundColor: Colors.support_primary, alignItems: "center" },
  // Desativado era um amarelo queimado fixo (#6a5332) que sobre branco parecia
  // ativo. Uma superfície neutra diz melhor "ainda não dá".
  primaryBtnDisabled: { backgroundColor: Colors.card_high },
  primaryText: { color: Colors.on_brand, fontWeight: "700", fontSize: 16 },
  primaryTextDisabled: { color: Colors.muted },
});
