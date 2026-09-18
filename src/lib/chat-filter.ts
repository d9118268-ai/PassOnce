/**
 * Placeholder explicit-content filter for the in-app chat.
 *
 * IMPORTANT: the list below is intentionally just a couple of illustrative
 * placeholder entries so the blocking mechanism can be wired up and tested.
 * It is NOT a real moderation wordlist. Before shipping, replace this with
 * a maintained package, e.g.:
 *
 *   npm install bad-words
 *   import Filter from "bad-words";
 *   const filter = new Filter();
 *   export function containsExplicitContent(text: string) {
 *     return filter.isProfane(text);
 *   }
 *
 * or "obscenity" (https://www.npmjs.com/package/obscenity), which also
 * handles leetspeak / spacing tricks that a plain word list misses.
 */

const PLACEHOLDER_BLOCKLIST = ["badword1", "badword2"];

export function containsExplicitContent(text: string): boolean {
  const normalized = text.toLowerCase();
  return PLACEHOLDER_BLOCKLIST.some((term) => normalized.includes(term));
}