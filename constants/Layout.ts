/**
 * Medidas partilhadas de layout.
 *
 * A barra de separadores flutua por cima do conteúdo, por isso cada ecrã de
 * separador tem de reservar espaço para ela no FIM DO CONTEÚDO — nunca com
 * padding no contentor, que encurta a área de scroll e deixa uma faixa morta.
 */

/** Altura da barra, sem contar com a área segura do dispositivo. Ver components/TabBar.tsx. */
export const TAB_BAR_HEIGHT = 72;

/**
 * Espaço a reservar no fim de um ScrollView dentro de um separador.
 * Usar com `useSafeAreaInsets()`: `tabBarContentPadding(insets.bottom)`.
 */
export const tabBarContentPadding = (bottomInset: number, extra = 24) =>
  TAB_BAR_HEIGHT + bottomInset + extra;
