# btcrene.com - Nostr Web App

A modern web app that displays the latest notes from the Nostr protocol, featuring automatic light/dark mode based on system preferences.

## Features

- 🌓 **Automatic Light/Dark Mode** - Adapts to your system preferences
- 📡 **Real-time Notes** - Fetches the latest 10 notes from `wss://relay.btcrene.com`
- 🖼️ **Image Support** - Automatically renders images embedded in notes
- 🔗 **External Links** - Click any note to view it on njump.me
- 📱 **Responsive Design** - Works beautifully on all devices
- ⚡ **Fast & Modern** - Built with React, Vite, and Tailwind CSS

## Technologies

- **React 19** with TypeScript
- **Vite** for blazing fast development and optimized builds
- **Tailwind CSS v4** for styling
- **NDK** (Nostr Development Kit) for Nostr protocol integration

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

The app builds to static files in the `dist/` directory, ready to be deployed to any static hosting service.

## Project Structure

```
src/
├── components/
│   ├── AboutMe.tsx        # About section with profile link
│   ├── NoteCard.tsx       # Individual note display
│   └── NotesFeed.tsx      # Notes list container
├── hooks/
│   └── useNostr.ts        # NDK connection and subscription
├── utils/
│   └── urlParser.ts       # Image URL extraction utilities
├── App.tsx                # Main app component
├── main.tsx               # Entry point
└── index.css              # Tailwind imports
```

## License

MIT
