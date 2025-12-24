import { Link, Route, Routes } from 'react-router-dom'
import ThemeToggle from './components/ThemeToggle'
import Editor from './pages/Editor'
import Parser from './pages/Parser'

function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* 头部 */}
      <div className="flex justify-end p-4">
        <ThemeToggle />
      </div>

      {/* 主体 */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            FilterForge
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Sieve (RFC 5228/5229) 可视化解析与编辑器
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/parser"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              解析器
            </Link>
            <Link
              to="/editor"
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              规则编辑器
            </Link>
          </div>
          <p className="mt-8 text-sm text-gray-400 dark:text-gray-500">
            支持 RFC 5228 核心规范及 13 个常用扩展
          </p>
        </div>
      </div>

      {/* 底部 */}
      <div className="p-4 text-center text-sm text-gray-400 dark:text-gray-600">
        <a
          href="https://github.com/AptS-1547/filterforge"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-600 dark:hover:text-gray-400"
        >
          GitHub
        </a>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/parser" element={<Parser />} />
      <Route path="/editor" element={<Editor />} />
    </Routes>
  )
}
