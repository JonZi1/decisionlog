import type { Decision } from './types';

function formatICSDate(dateStr: string): string {
  // Convert YYYY-MM-DD to YYYYMMDD format for all-day event
  return dateStr.replace(/-/g, '');
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function generateICSEvent(decision: Decision): string {
  const uid = `${decision.id}@decision-log`;
  const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const dtstart = formatICSDate(decision.reviewDate);

  // All-day event ends on the next day
  const endDate = new Date(decision.reviewDate);
  endDate.setDate(endDate.getDate() + 1);
  const dtend = endDate.toISOString().split('T')[0].replace(/-/g, '');

  const summary = escapeICS(`Review: ${decision.title}`);
  const description = escapeICS(
    `Decision made on ${decision.date}\\n\\n` +
    `Chosen: ${decision.chosenOption}\\n\\n` +
    `Expected outcome: ${decision.expectedOutcome || 'Not specified'}\\n\\n` +
    `Confidence: ${decision.confidence}%`
  );

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Decision Log//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${dtstart}`,
    `DTEND;VALUE=DATE:${dtend}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function generateICSForMultiple(decisions: Decision[]): string {
  const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const events = decisions.map(decision => {
    const uid = `${decision.id}@decision-log`;
    const dtstart = formatICSDate(decision.reviewDate);
    const endDate = new Date(decision.reviewDate);
    endDate.setDate(endDate.getDate() + 1);
    const dtend = endDate.toISOString().split('T')[0].replace(/-/g, '');

    const summary = escapeICS(`Review: ${decision.title}`);
    const description = escapeICS(
      `Decision made on ${decision.date}\\n\\n` +
      `Chosen: ${decision.chosenOption}\\n\\n` +
      `Expected outcome: ${decision.expectedOutcome || 'Not specified'}\\n\\n` +
      `Confidence: ${decision.confidence}%`
    );

    return [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${dtstart}`,
      `DTEND;VALUE=DATE:${dtend}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
    ].join('\r\n');
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Decision Log//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadICS(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
