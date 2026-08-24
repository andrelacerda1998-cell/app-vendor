export function parseValidDate(value?: string | Date | null): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

// Default seguro para data de nascimento: hoje − 18 anos
export function defaultBirthDate(): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d;
}

/**
 * Formatadores de data partilhados (pt-PT).
 * Antes cada ecrã reimplementava o seu (`shortDate`, `longDate`, `fmtDate`…)
 * com pequenas variações — a mesma data aparecia escrita de maneiras diferentes.
 * Devolvem '' para valores inválidos: nas listas, uma data em falta não deve
 * rebentar nem mostrar "Invalid Date".
 */
export function formatShortDate(iso?: string | null): string {
  const d = parseValidDate(iso ?? null);
  return d ? d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' }) : '';
}

export function formatMediumDate(iso?: string | null): string {
  const d = parseValidDate(iso ?? null);
  return d ? d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
}

export function formatLongDate(iso?: string | null): string {
  const d = parseValidDate(iso ?? null);
  return d ? d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', weekday: 'long' }) : '';
}

export function formatFullDate(iso?: string | null): string {
  const d = parseValidDate(iso ?? null);
  return d ? d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }) : '';
}
