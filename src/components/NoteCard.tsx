import type { NostrNote } from '../hooks/useNostr';
import { extractImageUrls, removeImageUrls, formatDate, extractNostrReferences, removeNostrReferences } from '../utils/urlParser';
import { RepostedNote } from './RepostedNote';

interface NoteCardProps {
  note: NostrNote;
}

export function NoteCard({ note }: NoteCardProps) {
  const imageUrls = extractImageUrls(note.content);
  const nostrRefs = extractNostrReferences(note.content);
  
  // Filter for only event references (nevent and note)
  const eventRefs = nostrRefs.filter(ref => 
    (ref.type === 'nevent' || ref.type === 'note') && ref.eventId
  );
  
  // Remove both image URLs and nostr references from text
  let textContent = removeImageUrls(note.content);
  textContent = removeNostrReferences(textContent);

  const handleClick = () => {
    window.open(`https://njump.me/${note.id}`, '_blank', 'noopener,noreferrer');
  };

  // Fallback for username: truncate pubkey if no author name
  const displayName = note.author_name || `${note.pubkey.slice(0, 8)}...${note.pubkey.slice(-4)}`;
  
  // Default avatar if no profile picture
  const avatarUrl = note.author_picture || `https://api.dicebear.com/7.x/identicon/svg?seed=${note.pubkey}`;

  return (
    <div
      onClick={handleClick}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-500"
    >
      <div className="p-6">
        {/* Header with profile info */}
        <div className="flex items-start gap-3 mb-4">
          {/* Profile picture */}
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
            onError={(e) => {
              // Fallback to generated avatar if profile picture fails
              e.currentTarget.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${note.pubkey}`;
            }}
          />
          
          {/* Username and timestamp */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {displayName}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(note.created_at)}
            </div>
          </div>
        </div>

        {/* Note content */}
        {textContent && (
          <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words mb-4">
            {textContent}
          </p>
        )}

        {/* Images */}
        {imageUrls.length > 0 && (
          <div className="space-y-3 mb-4">
            {imageUrls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Image ${index + 1}`}
                className="w-full rounded-lg"
                loading="lazy"
                onError={(e) => {
                  // Hide broken images
                  e.currentTarget.style.display = 'none';
                }}
              />
            ))}
          </div>
        )}

        {/* Reposted Notes */}
        {eventRefs.length > 0 && (
          <div className="space-y-3">
            {eventRefs.map((ref, index) => (
              <RepostedNote
                key={`${ref.eventId}-${index}`}
                eventId={ref.eventId!}
                relayHints={ref.relays}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

