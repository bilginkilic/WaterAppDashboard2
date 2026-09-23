// Kullanıcı kurum etiketleri. Firestore `users/{uid}.organization` alanında tutulur.
export const ORGANIZATIONS = ['MUFG Turkey', 'MUFG London'] as const;

export type Organization = (typeof ORGANIZATIONS)[number];

export function isOrganization(value: unknown): value is Organization {
  return typeof value === 'string' && (ORGANIZATIONS as readonly string[]).includes(value);
}
