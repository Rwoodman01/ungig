import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { useDealDmUnread } from '../hooks/useDealDmUnread.js';
import { useBlockMuteLists } from '../hooks/useBlockMuteLists.js';

const MessagesPanelContext = createContext(null);

/** Active deal thread for /deals/:dealId (not /review). */
function useDealThreadIdFromRoute() {
  const { pathname } = useLocation();
  return useMemo(() => {
    const m = pathname.match(/^\/deals\/([^/]+)$/);
    return m ? m[1] : null;
  }, [pathname]);
}

export function MessagesPanelProvider({ children }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const dealThreadId = useDealThreadIdFromRoute();
  const { hiddenMemberIds } = useBlockMuteLists(uid);
  const {
    hasUnreadDm,
    hasUnreadForDeal,
    markDealRead,
    deals,
    dealsLoading,
    dealsError,
  } = useDealDmUnread(uid, hiddenMemberIds);
  const [open, setOpen] = useState(false);

  const openPanel = useCallback(() => setOpen(true), []);
  const closePanel = useCallback(() => setOpen(false), []);

  const notepadUnread = dealThreadId ? hasUnreadForDeal(dealThreadId) : hasUnreadDm;

  const value = useMemo(
    () => ({
      open,
      openPanel,
      closePanel,
      hasUnreadDm,
      hasUnreadForDeal,
      notepadUnread,
      dealThreadId,
      markDealRead,
      deals,
      dealsLoading,
      dealsError,
      hiddenMemberIds,
    }),
    [
      open,
      openPanel,
      closePanel,
      hasUnreadDm,
      hasUnreadForDeal,
      notepadUnread,
      dealThreadId,
      markDealRead,
      deals,
      dealsLoading,
      dealsError,
      hiddenMemberIds,
    ],
  );

  return (
    <MessagesPanelContext.Provider value={value}>
      {children}
    </MessagesPanelContext.Provider>
  );
}

export function useMessagesPanel() {
  const ctx = useContext(MessagesPanelContext);
  if (!ctx) {
    throw new Error('useMessagesPanel must be used within MessagesPanelProvider');
  }
  return ctx;
}
