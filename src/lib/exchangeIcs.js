function pad(n) {
  return String(n).padStart(2, '0');
}

function formatUtcIcs(d) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
}

function formatUtcIcsFull(d) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function escapeIcsText(s) {
  return String(s ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

/**
 * Build a minimal VEVENT .ics file for an exchange meet time (local wall time → UTC in file).
 */
export function buildExchangeIcs({
  uid,
  title,
  description,
  scheduledDate,
  scheduledTime,
  durationMinutes = 60,
}) {
  const [y, mo, d] = String(scheduledDate).split('-').map(Number);
  const [hh, mm] = String(scheduledTime).split(':').map(Number);
  if (!y || !mo || !d || Number.isNaN(hh) || Number.isNaN(mm)) {
    throw new Error('Invalid date or time for calendar.');
  }
  const startLocal = new Date(y, mo - 1, d, hh, mm, 0, 0);
  const start = formatUtcIcs(startLocal);
  const endLocal = new Date(startLocal.getTime() + durationMinutes * 60 * 1000);
  const end = formatUtcIcs(endLocal);

  const dtStamp = new Date();
  const stamp = formatUtcIcsFull(dtStamp);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Gifted//Exchange//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}-${Date.now()}@gifted.app`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `${lines.join('\r\n')}\r\n`;
}

export function downloadIcs(filename, contents) {
  const blob = new Blob([contents], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
