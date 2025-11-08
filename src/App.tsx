import { AboutMe } from './components/AboutMe';
import { NotesFeed } from './components/NotesFeed';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AboutMe />
      <NotesFeed />
      <footer className="py-8 text-center text-gray-600 dark:text-gray-400 text-sm">
        <p>Vibed with 🧡</p>
      </footer>
    </div>
  );
}

export default App;
