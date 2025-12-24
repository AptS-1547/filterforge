import { Link, Route, Routes } from 'react-router-dom'
import Editor from './pages/Editor'
import Parser from './pages/Parser'

function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">FilterForge</h1>
        <p className="text-lg text-gray-600 mb-8">
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
