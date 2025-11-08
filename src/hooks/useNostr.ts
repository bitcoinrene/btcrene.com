import { useState, useEffect } from 'react';
import NDK, { NDKEvent, NDKSubscription } from '@nostr-dev-kit/ndk';
import type { NDKFilter } from '@nostr-dev-kit/ndk';

export interface NostrNote {
  id: string;
  content: string;
  created_at: number;
  pubkey: string;
  author_name?: string;
  author_picture?: string;
}

export interface UseNostrResult {
  notes: NostrNote[];
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
}

const ndk = new NDK({
  explicitRelayUrls: ['wss://relay.btcrene.com']
});

export function useNostr(): UseNostrResult {
  const [notes, setNotes] = useState<NostrNote[]>([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let notesSubscription: NDKSubscription | null = null;
    let profilesSubscription: NDKSubscription | null = null;

    async function initNostr() {
      try {
        setIsConnecting(true);
        setError(null);

        // Connect to relay
        await ndk.connect();
        setIsConnected(true);
        setIsConnecting(false);

        // Subscribe to the latest 10 text notes (kind 1)
        const notesFilter: NDKFilter = {
          kinds: [1],
          limit: 10
        };

        notesSubscription = ndk.subscribe(notesFilter);

        const receivedNotes: NostrNote[] = [];
        const profilesMap = new Map<string, { name?: string; picture?: string }>();

        notesSubscription.on('event', (event: NDKEvent) => {
          // Skip replies - replies have "e" tags referencing the original note
          const isReply = event.tags.some(tag => tag[0] === 'e');
          if (isReply) {
            return;
          }

          const note: NostrNote = {
            id: event.id,
            content: event.content,
            created_at: event.created_at || 0,
            pubkey: event.pubkey
          };

          receivedNotes.push(note);
        });

        notesSubscription.on('eose', async () => {
          // Sort by creation date (newest first)
          receivedNotes.sort((a, b) => b.created_at - a.created_at);

          // Get unique pubkeys
          const uniquePubkeys = Array.from(new Set(receivedNotes.map(note => note.pubkey)));

          // Subscribe to profile metadata (kind 0) for these pubkeys
          const profilesFilter: NDKFilter = {
            kinds: [0],
            authors: uniquePubkeys
          };

          profilesSubscription = ndk.subscribe(profilesFilter);

          profilesSubscription.on('event', (event: NDKEvent) => {
            try {
              const metadata = JSON.parse(event.content);
              profilesMap.set(event.pubkey, {
                name: metadata.name || metadata.display_name || metadata.displayName,
                picture: metadata.picture || metadata.image
              });
            } catch (err) {
              console.error('Error parsing profile metadata:', err);
            }
          });

          profilesSubscription.on('eose', () => {
            // Merge profile data with notes
            const notesWithProfiles = receivedNotes.map(note => ({
              ...note,
              author_name: profilesMap.get(note.pubkey)?.name,
              author_picture: profilesMap.get(note.pubkey)?.picture
            }));

            setNotes(notesWithProfiles);
          });
        });

      } catch (err) {
        console.error('Error connecting to NOSTR:', err);
        setError(err instanceof Error ? err.message : 'Failed to connect to relay');
        setIsConnecting(false);
      }
    }

    initNostr();

    // Cleanup
    return () => {
      if (notesSubscription) {
        notesSubscription.stop();
      }
      if (profilesSubscription) {
        profilesSubscription.stop();
      }
    };
  }, []);

  return { notes, isConnecting, isConnected, error };
}

