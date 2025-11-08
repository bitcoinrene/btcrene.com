import { useState, useEffect, useMemo } from 'react';
import NDK, { NDKEvent } from '@nostr-dev-kit/ndk';
import type { NDKFilter } from '@nostr-dev-kit/ndk';
import type { NostrNote } from './useNostr';
import { getCacheItem, setCacheItem, getCacheKey } from '../utils/persistentCache';

interface UseRepostedNoteResult {
  note: NostrNote | null;
  isLoading: boolean;
  error: string | null;
}

const FALLBACK_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band'
];

const FETCH_TIMEOUT = 8000; // 8 seconds timeout

// Shared NDK instance to avoid creating multiple connections
let sharedNDK: NDK | null = null;
let ndkConnectionPromise: Promise<void> | null = null;

async function getSharedNDK(): Promise<NDK> {
  if (sharedNDK) {
    return sharedNDK;
  }

  if (ndkConnectionPromise) {
    await ndkConnectionPromise;
    return sharedNDK!;
  }

  sharedNDK = new NDK({
    explicitRelayUrls: FALLBACK_RELAYS
  });

  ndkConnectionPromise = sharedNDK.connect().then(() => {
    ndkConnectionPromise = null;
  });

  await ndkConnectionPromise;
  return sharedNDK;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
  ]);
}

export function useRepostedNote(eventId: string, relayHints?: string[]): UseRepostedNoteResult {
  const [note, setNote] = useState<NostrNote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize relay hints to avoid unnecessary re-renders
  const relayHintsKey = useMemo(() => relayHints?.join(',') || '', [relayHints]);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    async function fetchNote() {
      if (!eventId) {
        setIsLoading(false);
        return;
      }

      // Check persistent cache first
      const cachedNote = getCacheItem<NostrNote>(getCacheKey.note(eventId));
      if (cachedNote) {
        if (isMounted) {
          setNote(cachedNote);
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Get shared NDK instance
        const ndk = await withTimeout(getSharedNDK(), 3000);
        
        if (!isMounted || abortController.signal.aborted) return;

        // Try to fetch with relay hints first if available
        let event: NDKEvent | null = null;

        if (relayHints && relayHints.length > 0) {
          try {
            const hintNDK = new NDK({
              explicitRelayUrls: relayHints
            });
            await withTimeout(hintNDK.connect(), 2000);
            
            const filter: NDKFilter = {
              kinds: [1],
              ids: [eventId]
            };

            const events = await withTimeout(hintNDK.fetchEvents(filter), 3000);
            if (events.size > 0) {
              event = Array.from(events)[0] as NDKEvent;
            }
          } catch {
            console.log('Failed to fetch from relay hints, trying fallback relays');
          }
        }

        // If not found with hints, try shared NDK with fallback relays
        if (!event) {
          const filter: NDKFilter = {
            kinds: [1],
            ids: [eventId]
          };

          const events = await withTimeout(
            ndk.fetchEvents(filter),
            FETCH_TIMEOUT
          );
          
          if (!isMounted || abortController.signal.aborted) return;

          if (events.size === 0) {
            setError('Note not found');
            setIsLoading(false);
            return;
          }

          event = Array.from(events)[0] as NDKEvent;
        }

        // Check persistent cache for profile
        let authorName: string | undefined;
        let authorPicture: string | undefined;

        const cachedProfile = getCacheItem<{ name?: string; picture?: string }>(
          getCacheKey.profile(event.pubkey)
        );
        if (cachedProfile) {
          authorName = cachedProfile.name;
          authorPicture = cachedProfile.picture;
        } else {
          // Fetch author profile with timeout
          try {
            const profileFilter: NDKFilter = {
              kinds: [0],
              authors: [event.pubkey]
            };

            const profiles = await withTimeout(
              ndk.fetchEvents(profileFilter),
              3000
            );
            
            if (!isMounted || abortController.signal.aborted) return;

            if (profiles.size > 0) {
              try {
                const profile = Array.from(profiles)[0] as NDKEvent;
                const metadata = JSON.parse(profile.content);
                authorName = metadata.name || metadata.display_name || metadata.displayName;
                authorPicture = metadata.picture || metadata.image;
                
                // Cache the profile persistently
                setCacheItem(getCacheKey.profile(event.pubkey), {
                  name: authorName,
                  picture: authorPicture
                });
              } catch (err) {
                console.warn('Failed to parse profile metadata:', err);
              }
            }
          } catch {
            // Profile fetch failed, but we can still show the note
            console.warn('Profile fetch timeout, showing note without profile');
          }
        }

        const fetchedNote: NostrNote = {
          id: event.id,
          content: event.content,
          created_at: event.created_at || 0,
          pubkey: event.pubkey,
          author_name: authorName,
          author_picture: authorPicture
        };

        // Cache the note persistently
        setCacheItem(getCacheKey.note(eventId), fetchedNote);

        if (isMounted && !abortController.signal.aborted) {
          setNote(fetchedNote);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error fetching reposted note:', err);
        if (isMounted && !abortController.signal.aborted) {
          const errorMessage = err instanceof Error && err.message === 'Request timeout'
            ? 'Note loading timed out'
            : 'Failed to load note';
          setError(errorMessage);
          setIsLoading(false);
        }
      }
    }

    fetchNote();

    return () => {
      isMounted = false;
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, relayHintsKey]);

  return { note, isLoading, error };
}

