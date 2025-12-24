import {
  ComputerDesktopIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/react/24/solid'
import { useTheme } from '../hooks/useTheme'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`p-2 rounded-md transition-colors ${
          theme === 'light'
            ? 'bg-white dark:bg-gray-700 shadow text-yellow-500'
            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
        }`}
        title="浅色模式"
      >
        <SunIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`p-2 rounded-md transition-colors ${
          theme === 'dark'
            ? 'bg-white dark:bg-gray-700 shadow text-blue-500'
            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
        }`}
        title="深色模式"
      >
        <MoonIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => setTheme('system')}
        className={`p-2 rounded-md transition-colors ${
          theme === 'system'
            ? 'bg-white dark:bg-gray-700 shadow text-green-500'
            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
        }`}
        title="跟随系统"
      >
        <ComputerDesktopIcon className="w-4 h-4" />
      </button>
    </div>
  )
}
