export function AboutMe() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          About Me
        </h1>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Hi, I'm Rene, a passionate Bitcoiner and Nostr maxi based in Switzerland. I'm dedicated to promoting freedom, sovereignty, and decentralized communication through Bitcoin and Nostr.
        </p>
        <a
          href="https://njump.me/npub1qfe57xw2u7zsu772ds9zhd49xnc494dvhkrwansa90aat4jsyqpssngt8g"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-6 py-2 bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white font-semibold rounded-lg shadow transition-colors duration-200"
        >
          View Full Nostr Profile
        </a>
      </div>
    </div>
  );
}

