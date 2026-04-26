/**
 * Whether a user doc should appear in member browse (list + swipe deck).
 * Admin-role accounts are hidden by default; they opt in with `showInBrowse`.
 */
export function isVisibleInMemberBrowse(member) {
  if (member?.role !== 'admin') return true;
  return member.showInBrowse === true;
}
