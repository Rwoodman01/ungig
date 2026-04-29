import { useCallback, useEffect, useRef, useState } from 'react';
import {
  blockMember,
  muteMember,
  unblockMember,
  unmuteMember,
} from '../../lib/blockMute.js';
import { submitMemberReport } from '../../lib/reports.js';
import { REPORT_REASONS, REPORT_REASON_LABELS } from '../../lib/constants.js';

export default function MemberProfileMenu({
  myUid,
  memberId,
  memberName,
  blockedByMeIds,
  mutedIds,
  onBlocked,
}) {
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState(REPORT_REASONS.HARASSMENT);
  const [reportDetails, setReportDetails] = useState('');
  const [reportBusy, setReportBusy] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportDone, setReportDone] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const iBlockedThem = blockedByMeIds.has(memberId);
  const iMutedThem = mutedIds.has(memberId);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const closeAll = useCallback(() => {
    setOpen(false);
    setBlockOpen(false);
    setReportOpen(false);
    setReportDone(false);
    setReportError('');
    setReportDetails('');
  }, []);

  const handleMute = async () => {
    setActionBusy(true);
    setActionError('');
    try {
      await muteMember({ uid: myUid, mutedUid: memberId });
      setOpen(false);
    } catch (e) {
      setActionError(e?.message ?? 'Could not mute.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleUnmute = async () => {
    setActionBusy(true);
    setActionError('');
    try {
      await unmuteMember({ uid: myUid, mutedUid: memberId });
      setOpen(false);
    } catch (e) {
      setActionError(e?.message ?? 'Could not unmute.');
    } finally {
      setActionBusy(false);
    }
  };

  const confirmBlock = async () => {
    setActionBusy(true);
    setActionError('');
    try {
      await blockMember({ blockerUid: myUid, blockedUid: memberId });
      setBlockOpen(false);
      closeAll();
      onBlocked?.();
    } catch (e) {
      setActionError(e?.message ?? 'Could not block this member.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleUnblock = async () => {
    setActionBusy(true);
    setActionError('');
    try {
      await unblockMember({ blockerUid: myUid, blockedUid: memberId });
      setOpen(false);
    } catch (e) {
      setActionError(e?.message ?? 'Could not unblock.');
    } finally {
      setActionBusy(false);
    }
  };

  const submitReport = async (e) => {
    e.preventDefault();
    setReportBusy(true);
    setReportError('');
    try {
      await submitMemberReport({
        reporterId: myUid,
        reportedUserId: memberId,
        reason: reportReason,
        details: reportDetails,
      });
      setReportDone(true);
      setReportOpen(false);
      setReportDetails('');
    } catch (err) {
      setReportError(err?.message ?? 'Could not send report.');
    } finally {
      setReportBusy(false);
    }
  };

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        type="button"
        className="btn-ghost p-2 rounded-full text-ink-muted hover:text-ink-primary"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Member actions"
        onClick={() => setOpen((v) => !v)}
      >
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      {open ? (
        <div
          className="absolute right-0 top-full mt-1 z-30 min-w-[11rem] rounded-xl border border-border bg-surface py-1 shadow-lg"
          role="menu"
        >
          {iMutedThem ? (
            <button
              type="button"
              role="menuitem"
              className="w-full text-left px-4 py-2 text-sm hover:bg-cream disabled:opacity-50"
              disabled={actionBusy}
              onClick={handleUnmute}
            >
              Unmute
            </button>
          ) : (
            <button
              type="button"
              role="menuitem"
              className="w-full text-left px-4 py-2 text-sm hover:bg-cream disabled:opacity-50"
              disabled={actionBusy}
              onClick={handleMute}
            >
              Mute
            </button>
          )}
          {iBlockedThem ? (
            <button
              type="button"
              role="menuitem"
              className="w-full text-left px-4 py-2 text-sm hover:bg-cream disabled:opacity-50"
              disabled={actionBusy}
              onClick={handleUnblock}
            >
              Unblock
            </button>
          ) : (
            <button
              type="button"
              role="menuitem"
              className="w-full text-left px-4 py-2 text-sm text-coral hover:bg-cream disabled:opacity-50"
              disabled={actionBusy}
              onClick={() => {
                setOpen(false);
                setBlockOpen(true);
              }}
            >
              Block
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            className="w-full text-left px-4 py-2 text-sm hover:bg-cream disabled:opacity-50"
            disabled={actionBusy}
            onClick={() => {
              setOpen(false);
              setReportOpen(true);
              setReportDone(false);
            }}
          >
            Report
          </button>
        </div>
      ) : null}

      {actionError && !blockOpen && !reportOpen ? (
        <p className="text-xs text-coral absolute right-0 top-full mt-28 w-48 text-right">{actionError}</p>
      ) : null}

      {blockOpen ? (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
          <div className="bg-surface rounded-[20px] w-full max-w-sm p-5 shadow-2xl border border-border">
            <h2 className="font-display font-bold text-ink-primary">Block {memberName}?</h2>
            <p className="text-sm text-ink-muted mt-2 leading-relaxed">
              {"You won't see each other in browse, matches, or messages, and you can't start new exchanges. "}
              You can unblock later from Me → Blocked members.
            </p>
            {actionError ? <p className="text-sm text-coral mt-2">{actionError}</p> : null}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" className="btn-secondary" disabled={actionBusy} onClick={() => { setBlockOpen(false); setActionError(''); }}>
                Cancel
              </button>
              <button type="button" className="btn-primary bg-coral border-coral hover:bg-coral/90" disabled={actionBusy} onClick={confirmBlock}>
                {actionBusy ? 'Blocking…' : 'Block'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {reportOpen ? (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
          <form onSubmit={submitReport} className="bg-surface rounded-[20px] w-full max-w-sm p-5 shadow-2xl border border-border space-y-3">
            <h2 className="font-display font-bold text-ink-primary">Report {memberName}</h2>
            <div>
              <label className="text-xs font-medium text-ink-secondary block mb-1">Reason</label>
              <select
                className="input w-full"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              >
                {Object.values(REPORT_REASONS).map((key) => (
                  <option key={key} value={key}>{REPORT_REASON_LABELS[key]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-secondary block mb-1">Details (optional)</label>
              <textarea
                className="input min-h-[5rem] w-full"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value.slice(0, 2000))}
                placeholder="Anything else we should know…"
              />
            </div>
            {reportError ? <p className="text-sm text-coral">{reportError}</p> : null}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button type="button" className="btn-secondary" onClick={() => setReportOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={reportBusy}>
                {reportBusy ? 'Sending…' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {reportDone ? (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
          <div className="bg-surface rounded-[20px] w-full max-w-sm p-5 shadow-2xl border border-border">
            <p className="text-sm text-ink-secondary leading-relaxed">
              {"Thanks — we've received your report. Our team will review it. You'll also find a confirmation in your notifications."}
            </p>
            <button type="button" className="btn-primary w-full mt-4" onClick={() => setReportDone(false)}>
              OK
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
