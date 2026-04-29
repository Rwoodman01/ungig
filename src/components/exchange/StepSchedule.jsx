import { useEffect, useState } from 'react';
import { buildExchangeIcs, downloadIcs } from '../../lib/exchangeIcs.js';

export default function StepSchedule({
  deal,
  user,
  myName,
  otherName,
  canEngage,
  busy,
  onSave,
}) {
  const [date, setDate] = useState(deal.scheduledDate ?? '');
  const [time, setTime] = useState(deal.scheduledTime ?? '');

  useEffect(() => {
    setDate(deal.scheduledDate ?? '');
    setTime(deal.scheduledTime ?? '');
  }, [deal.scheduledDate, deal.scheduledTime]);

  const addToCalendar = () => {
    const title = `Gifted exchange — ${myName ?? 'You'} & ${otherName}`;
    const desc = `Exchange details:\nInitiator: ${(deal.initiatorService ?? '').slice(0, 200)}\nReceiver: ${(deal.receiverService ?? '').slice(0, 200)}`;
    const ics = buildExchangeIcs({
      uid: user.uid,
      title,
      description: desc,
      scheduledDate: date,
      scheduledTime: time,
    });
    downloadIcs(`gifted-exchange-${deal.id}.ics`, ics);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      <p className="text-sm text-ink-secondary text-center">
        Pick a time that works for both of you. You can add it to your calendar before saving.
      </p>
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Date</label>
          <input
            type="date"
            className="input mt-1 w-full"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={!canEngage || busy}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Time</label>
          <input
            type="time"
            className="input mt-1 w-full"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            disabled={!canEngage || busy}
          />
        </div>
      </div>
      <button
        type="button"
        className="btn-secondary w-full"
        disabled={!date || !time}
        onClick={addToCalendar}
      >
        Add to Calendar (.ics)
      </button>
      <button
        type="button"
        className="btn-primary w-full mt-auto"
        disabled={!canEngage || busy || !date || !time}
        onClick={() => onSave({ scheduledDate: date, scheduledTime: time })}
      >
        {busy ? 'Saving…' : 'Save schedule'}
      </button>
    </div>
  );
}
