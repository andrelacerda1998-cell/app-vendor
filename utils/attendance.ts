/**
 * Confirmacao de presenca: a regra, num sitio so.
 *
 * Aceitar o agendamento foi ha dias ou semanas; a confirmacao e o tecnico a
 * dizer que continua a contar com ele. E o que evita o cliente em casa a
 * espera de alguem que se esqueceu — e, quando nao chega, da tempo a operacao
 * de arranjar outro tecnico.
 *
 * A janela sao as mesmas 72h do lembrete que o servidor envia: antes disso e
 * cedo demais para valer alguma coisa, e depois da hora ja nao ha nada a
 * confirmar. Vive aqui, e nao em cada ecra, porque a Agenda mostra o botao e a
 * Home conta quantos faltam — duas leituras da mesma regra podiam divergir e
 * dar um aviso que o outro ecra nao confirmava.
 */
export const ATTENDANCE_WINDOW_HOURS = 72;

const parseDay = (value?: string) => {
  if (!value) return null;
  const iso = String(value).split('T')[0];
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const hhmm = (t?: string) => (t ? String(t).slice(0, 5) : '');

/** Instante de inicio do agendamento, em hora local. `null` se a data nao presta. */
export const scheduleStartsAt = (item: any): number | null => {
  const day = parseDay(item?.schedule?.scheduled_day);
  const start = hhmm(item?.schedule?.scheduled_time?.start);
  if (!day || !/^\d{2}:\d{2}$/.test(start)) return null;

  const [hh, mm] = start.split(':').map(Number);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hh, mm).getTime();
};

/** Ja confirmou que vai? */
export const isAttendanceConfirmed = (item: any): boolean =>
  !!item?.schedule?.vendor_confirmed_at;

/**
 * Esta dentro da janela e por confirmar — ou seja, ha aqui uma decisao por
 * tomar. Serve tanto para mostrar o botao como para contar os que faltam.
 */
export const needsAttendanceConfirmation = (item: any): boolean => {
  if (isAttendanceConfirmed(item)) return false;

  const startsAt = scheduleStartsAt(item);
  if (startsAt === null) return false;

  const hoursToStart = (startsAt - Date.now()) / 3_600_000;
  return hoursToStart > 0 && hoursToStart <= ATTENDANCE_WINDOW_HOURS;
};
