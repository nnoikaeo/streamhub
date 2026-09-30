/**
 * The Thai label for a role, as the user sees it about themselves.
 *
 * The profile page and the user menu used to disagree — "ผู้ใช้ทั่วไป" on one,
 * the raw `user` on the other — for the same account on the same screen.
 */
export function roleLabel(role: string | null | undefined): string {
  if (role === 'admin') return 'ผู้ดูแลระบบ'
  if (role === 'moderator') return 'ผู้ดูแลโฟลเดอร์'
  return 'ผู้ใช้ทั่วไป'
}
