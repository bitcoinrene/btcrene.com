import { useRepostedNote } from '../hooks/useRepostedNote';
import { extractImageUrls, removeImageUrls, formatDate } from '../utils/urlParser';

interface RepostedNoteProps {
  eventId: string;
  relayHints?: string[];
}

export function RepostedNote({ eventId, relayHints }: RepostedNoteProps) {
  const { note, isLoading, error } = useRepostedNote(eventId, relayHints);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent card click
    if (note?.id) {
      window.open(`https://njump.me/${note.id}`, '_blank', 'noopener,noreferrer');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50 animate-pulse">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !note) {
    return (
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {error === 'Note loading timed out' ? '⏱️ Note took too long to load' : error || 'Unable to load note'}
        </p>
      </div>
    );
  }

  const imageUrls = extractImageUrls(note.content);
  const textContent = removeImageUrls(note.content);
  
  // Truncate long content for embedded display
  const maxLength = 280;
  const shouldTruncate = textContent.length > maxLength;
  const displayContent = shouldTruncate 
    ? textContent.slice(0, maxLength) + '...' 
    : textContent;

  const displayName = note.author_name || `${note.pubkey.slice(0, 8)}...${note.pubkey.slice(-4)}`;
  const avatarUrl = note.author_picture || `https://api.dicebear.com/7.x/identicon/svg?seed=${note.pubkey}`;

  return (
    <div
      onClick={handleClick}
      className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
    >
      {/* Header with profile info */}
      <div className="flex items-start gap-3 mb-3">
        {/* Profile picture */}
        <img
          src={avatarUrl}
          alt={displayName}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          onError={(e) => {
            e.currentTarget.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${note.pubkey}`;
          }}
        />
        
        {/* Username and timestamp */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
            {displayName}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(note.created_at)}
          </div>
        </div>
      </div>

      {/* Note content */}
      {displayContent && (
        <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap break-words mb-3">
          {displayContent}
        </p>
      )}

      {/* Images - show first image only in embedded view */}
      {imageUrls.length > 0 && (
        <div>
          <img
            src={imageUrls[0]}
            alt="Embedded image"
            className="w-full rounded-lg max-h-64 object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          {imageUrls.length > 1 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              +{imageUrls.length - 1} more image{imageUrls.length > 2 ? 's' : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

