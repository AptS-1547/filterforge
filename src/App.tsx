import { Routes, Route } from 'react-router-dom'

function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">FilterForge</h1>
        <p className="text-lg text-gray-600">
          Sieve (RFC 5228/5229) 可视化解析与编辑器
        </p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  )
}
