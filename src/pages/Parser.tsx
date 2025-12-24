import { useRef, useState } from 'react'
import ASTViewer from '../components/ASTViewer'
import { generate, parse, type SieveScript } from '../parser'

const EXAMPLE_SCRIPT = `require ["fileinto", "variables"];

# 垃圾邮件过滤
if header :contains "Subject" ["spam", "广告"] {
    fileinto "Junk";
    stop;
}

# 保存发件人到变量
if address :matches "From" "*@example.com" {
    set "sender" "\${1}";
    fileinto "Work";
}

# 默认保留
keep;
`

type ViewMode = 'tree' | 'json' | 'regenerate'

export default function Parser() {
  const [input, setInput] = useState(EXAMPLE_SCRIPT)
  const [ast, setAst] = useState<SieveScript | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('tree')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleParse = () => {
    const result = parse(input)
    if (result.success) {
      setError(null)
      setAst(result.ast)
    } else {
      setError(result.error.message)
      setAst(null)
    }
  }

  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setInput(content)
      setAst(null)
      setError(null)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleExport = () => {
    const blob = new Blob([input], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'filter.sieve'
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderOutput = () => {
    if (error) {
      return (
        <div className="h-96 p-3 bg-red-50 border border-red-200 rounded-md overflow-auto">
          <p className="text-red-600 font-mono text-sm whitespace-pre-wrap">
            {error}
          </p>
        </div>
      )
    }

    if (!ast) {
      return (
        <div className="h-96 p-3 bg-gray-50 border border-gray-200 rounded-md flex items-center justify-center text-gray-400">
          点击"解析"按钮查看结果
        </div>
      )
    }

    switch (viewMode) {
      case 'tree':
        return (
          <div className="h-96 p-3 bg-white border border-gray-200 rounded-md overflow-auto">
            <ASTViewer node={ast} />
          </div>
        )
      case 'json':
        return (
          <pre className="h-96 p-3 bg-gray-50 border border-gray-200 rounded-md overflow-auto font-mono text-sm">
            {JSON.stringify(ast, null, 2)}
          </pre>
        )
      case 'regenerate':
        return (
          <pre className="h-96 p-3 bg-gray-50 border border-gray-200 rounded-md overflow-auto font-mono text-sm">
            {generate(ast)}
          </pre>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".sieve,.txt"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Sieve 解析器
          </h1>
          <a
            href="/"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
          >
            ← 返回首页
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 输入区域 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                Sieve 脚本
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleImport}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
                >
                  导入
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
                >
                  导出
                </button>
                <button
                  type="button"
                  onClick={handleParse}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  解析
                </button>
              </div>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-96 font-mono text-sm p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              spellCheck={false}
            />
          </div>

          {/* 输出区域 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center gap-4 mb-3">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                输出
              </h2>
              <div className="flex gap-1">
                {(['tree', 'json', 'regenerate'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      viewMode === mode
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {mode === 'tree'
                      ? '树形'
                      : mode === 'json'
                        ? 'JSON'
                        : '重新生成'}
                  </button>
                ))}
              </div>
            </div>
            {renderOutput()}
          </div>
        </div>

        {/* 功能说明 */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">
            支持的扩展
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            {[
              'variables (RFC 5229)',
              'body (RFC 5173)',
              'vacation (RFC 5230)',
              'relational (RFC 5231)',
              'imap4flags (RFC 5232)',
              'subaddress (RFC 5233)',
              'date (RFC 5260)',
              'editheader (RFC 5293)',
              'reject (RFC 5429)',
              'notify (RFC 5435)',
              'ihave (RFC 5463)',
              'duplicate (RFC 7352)',
              'regex (draft)',
              'copy',
              'fileinto',
              'envelope',
            ].map((ext) => (
              <span
                key={ext}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300"
              >
                {ext}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
