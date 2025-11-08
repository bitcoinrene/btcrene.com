import { nip19 } from 'nostr-tools';

export interface NostrReference {
  type: 'nevent' | 'note' | 'npub' | 'nprofile';
  eventId?: string;
  relays?: string[];
  pubkey?: string;
  raw: string;
}

/**
 * Extracts image URLs from text content
 * Supports common image formats: jpg, jpeg, png, gif, webp
 */
export function extractImageUrls(content: string): string[] {
  const imageUrlRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp)(?:\?[^\s]*)?)/gi;
  const matches = content.match(imageUrlRegex);
  return matches || [];
}

/**
 * Removes image URLs from content to avoid displaying them twice
 */
export function removeImageUrls(content: string): string {
  const imageUrlRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp)(?:\?[^\s]*)?)/gi;
  return content.replace(imageUrlRegex, '').trim();
}

/**
 * Extracts nostr references (nevent, note, npub, nprofile) from content
 * Returns decoded reference data including event IDs and relay hints
 */
export function extractNostrReferences(content: string): NostrReference[] {
  const nostrRefRegex = /nostr:(nevent1|note1|npub1|nprofile1)[a-zA-Z0-9]+/g;
  const matches = content.match(nostrRefRegex);
  
  if (!matches) return [];
  
  const references: NostrReference[] = [];
  
  for (const match of matches) {
    try {
      const nostrId = match.replace('nostr:', '');
      const decoded = nip19.decode(nostrId);
      
      if (decoded.type === 'nevent') {
        references.push({
          type: 'nevent',
          eventId: decoded.data.id,
          relays: decoded.data.relays,
          raw: match
        });
      } else if (decoded.type === 'note') {
        references.push({
          type: 'note',
          eventId: decoded.data,
          raw: match
        });
      } else if (decoded.type === 'npub') {
        references.push({
          type: 'npub',
          pubkey: decoded.data,
          raw: match
        });
      } else if (decoded.type === 'nprofile') {
        references.push({
          type: 'nprofile',
          pubkey: decoded.data.pubkey,
          relays: decoded.data.relays,
          raw: match
        });
      }
    } catch (err) {
      console.warn('Failed to decode nostr reference:', match, err);
    }
  }
  
  return references;
}

/**
 * Removes nostr references from content to avoid displaying them in text
 */
export function removeNostrReferences(content: string): string {
  const nostrRefRegex = /nostr:(nevent1|note1|npub1|nprofile1)[a-zA-Z0-9]+/g;
  return content.replace(nostrRefRegex, '').trim();
}

/**
 * Formats a timestamp to a readable date string
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

