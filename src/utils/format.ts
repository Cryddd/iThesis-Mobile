/** Format an ISO date string as e.g. "Jun 27, 2026". */
export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Relative "time ago" string for recent activity. */
export function timeAgo(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value).getTime();
  if (Number.isNaN(d)) return '';
  const diff = Date.now() - d;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(value);
}

export function initials(name?: string): string {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

/** Institutional student email domain (matches the web upload modal). */
export const SCHOOL_EMAIL_DOMAIN = 'g.batstate-u.edu.ph';

/**
 * Strips disallowed characters and title-cases each word.
 * Mirrors `formatPersonName` in the web AccessModal / UploadAccessModal.
 */
export function formatPersonName(value: string): string {
  const sanitized = value.replace(/[^A-Za-z.\s]/g, '');
  return sanitized.replace(
    /\b([A-Za-z])([A-Za-z]*)\b/g,
    (_, first: string, rest: string) => `${first.toUpperCase()}${rest.toLowerCase()}`,
  );
}

/** Auto-formats an SR code to `YY-XXXXX` as the user types. */
export function formatSrCode(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 7);
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}-${digits.slice(2)}`;
}

/** True when an SR code matches `YY-XXXXX` (e.g. 22-37726). */
export function isValidSrCode(code: string): boolean {
  return /^(\d{2})-(\d{5})$/.test(code.trim());
}

/**
 * Coerces an email to the institutional domain once `@` is typed, mirroring the
 * web's snap-to-domain behaviour. Returns the (possibly) rewritten address.
 */
export function normalizeInstitutionalEmail(value: string): string {
  const atIndex = value.indexOf('@');
  return atIndex >= 0 ? `${value.slice(0, atIndex).trim()}@${SCHOOL_EMAIL_DOMAIN}` : value;
}

/** True when an email is a valid institutional address (@g.batstate-u.edu.ph). */
export function isValidInstitutionalEmail(email: string): boolean {
  return /^[^@\s]+@g\.batstate-u\.edu\.ph$/i.test(email.trim());
}
