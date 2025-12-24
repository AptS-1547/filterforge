import { useEffect, useState } from 'react'
import { convertToSieve } from '../components/editor/converter'
import RuleEditor from '../components/editor/RuleEditor'
import type { EditorState, Rule } from '../components/editor/types'
import {
  createDefaultRule,
  createDefaultState,
} from '../components/editor/types'

const STORAGE_KEY = 'filterforge_editor_state'

function loadState(): EditorState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved) as EditorState
    }
  } catch {
    // ignore
  }
  return createDefaultState()
}

function saveState(state: EditorState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

export default function Editor() {
  const [state, setState] = useState<EditorState>(loadState)
  const [showCode, setShowCode] = useState(false)
  const [saved, setSaved] = useState(true)

  // 自动保存
  useEffect(() => {
    const timer = setTimeout(() => {
      saveState(state)
      setSaved(true)
    }, 500)
    return () => clearTimeout(timer)
  }, [state])

  const updateState = (newState: EditorState) => {
    setState(newState)
    setSaved(false)
  }

  const addRule = () => {
    updateState({
      ...state,
      rules: [...state.rules, createDefaultRule()],
    })
  }

  const updateRule = (index: number, rule: Rule) => {
    const rules = [...state.rules]
    rules[index] = rule
    updateState({ ...state, rules })
  }

  const removeRule = (index: number) => {
    updateState({
      ...state,
      rules: state.rules.filter((_, i) => i !== index),
    })
  }

  const moveRule = (index: number, direction: 'up' | 'down') => {
    const rules = [...state.rules]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= rules.length) return
    ;[rules[index], rules[newIndex]] = [rules[newIndex], rules[index]]
    updateState({ ...state, rules })
  }

  const clearAll = () => {
    if (confirm('确定要清空所有规则吗？')) {
      updateState(createDefaultState())
    }
  }

  const generatedCode = convertToSieve(state)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode)
  }

  const exportFile = () => {
    const blob = new Blob([generatedCode], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'filter.sieve'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 头部 */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a
                href="/"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
              >
                ← 首页
              </a>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Sieve 规则编辑器
              </h1>
              <span className="text-xs text-gray-400">
                {saved ? '已保存' : '保存中...'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {state.rules.length} 条规则
              </span>
              <button
                type="button"
                onClick={clearAll}
                className="px-3 py-2 text-sm text-red-600 hover:text-red-800 dark:text-red-400"
              >
                清空
              </button>
              <button
                type="button"
                onClick={exportFile}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
              >
                导出
              </button>
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className={`px-4 py-2 rounded-md text-sm ${
                  showCode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {showCode ? '隐藏代码' : '查看代码'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className={`grid gap-6 ${showCode ? 'lg:grid-cols-2' : ''}`}>
          {/* 规则列表 */}
          <div className="space-y-4">
            {state.rules.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  还没有规则，点击下方按钮添加
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  规则会自动保存到浏览器本地存储
                </p>
              </div>
            ) : (
              state.rules.map((rule, index) => (
                <RuleEditor
                  key={rule.id}
                  rule={rule}
                  onChange={(r) => updateRule(index, r)}
                  onRemove={() => removeRule(index)}
                  onMoveUp={index > 0 ? () => moveRule(index, 'up') : undefined}
                  onMoveDown={
                    index < state.rules.length - 1
                      ? () => moveRule(index, 'down')
                      : undefined
                  }
                />
              ))
            )}

            <button
              type="button"
              onClick={addRule}
              className="w-full py-3 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg text-blue-600 dark:text-blue-400 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium"
            >
              + 添加新规则
            </button>
          </div>

          {/* 代码预览 */}
          {showCode && (
            <div className="lg:sticky lg:top-6 h-fit">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <h2 className="font-semibold text-gray-700 dark:text-gray-200">
                    生成的 Sieve 代码
                  </h2>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={copyToClipboard}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      复制
                    </button>
                    <button
                      type="button"
                      onClick={exportFile}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      导出文件
                    </button>
                  </div>
                </div>
                <pre className="p-4 overflow-auto max-h-[70vh] font-mono text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-900">
                  {generatedCode || '# 添加规则后将在此显示代码'}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
