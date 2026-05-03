import { useEffect, useState } from 'react';
import { Palette, ChevronDown } from 'lucide-react';

const THEMES = [
  "light", "dark", "cupcake", "synthwave", 
  "retro", "cyberpunk", "dracula", "night"
];

export default function ThemeDropdown() {
const [theme, setTheme] = useState(
  localStorage.getItem('chat_theme') || 'dark'
);

useEffect(() => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('chat_theme', theme);
}, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nexus-theme', theme);
  }, [theme]);

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost m-1">
        <Palette size={20} />
        <span className="hidden sm:inline capitalize">{theme}</span>
        <ChevronDown size={16} />
      </div>
      
      <ul tabIndex={0} className="dropdown-content z-[1] p-2 shadow-2xl bg-base-200 rounded-box w-52 max-h-96 overflow-y-auto">
        {THEMES.map((t) => (
          <li key={t}>
            <button
              onClick={() => {
                setTheme(t);
                document.activeElement.blur(); 
              }}
              className={`btn btn-sm btn-ghost w-full justify-start capitalize ${theme === t ? 'btn-active' : ''}`}
            >
              {t}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}