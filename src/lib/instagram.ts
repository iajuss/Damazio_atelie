import { INSTAGRAM_PROFILE_URL } from './site';

/** Returns the one configured, public Instagram destination for all Direct handoffs. */
export function buildInstagramProfileUrl(): string {
  return INSTAGRAM_PROFILE_URL;
}
