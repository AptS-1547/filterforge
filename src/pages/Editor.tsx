import { useState } from 'react'
import type { EditorState, Rule } from '../components/editor/types'
import {
  createDefaultRule,
  createDefaultState,
} from '../components/editor/types'
import { convertToSieve } from '../components/editor/converter'
import RuleEditor from '../components/editor/RuleEditor'

export default function Editor() {
  const [state, setState] = useState<EditorState>(createDefaultState)
  const [showCode, setShowCode] = useState(false)

  const addRule = () => {
    setState((s) => ({
      ...s,
      rules: [...s.rules, createDefaultRule()],
    }))
  }

  const updateRule = (index: number, rule: Rule) => {
    setState((s) => {
      const rules = [...s.rules]
      rules[index] = rule
      return { ...s, rules }
    })
  }

  const removeRule = (index: number) => {
    setState((s) => ({
      ...s,
      rules: s.rules.filter((_, i) => i !== index),
    }))
  }

  const moveRule = (index: number, direction: 'up' | 'down') => {
    setState((s) => {
      const rules = [...s.rules]
      const newIndex = direction === 'up' ? index - 1 : index + 1
      if (newIndex < 0 || newIndex >= rules.length) return s
      ;[rules[index], rules[newIndex]] = [rules[newIndex], rules[index]]
      return { ...s, rules }
    })
  }

  const generatedCode = convertToSieve(state)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href="/" className="text-blue-600 hover:text-blue-800">
                ← 首页
              </a>
              <h1 className="text-xl font-bold text-gray-900">
                Sieve 规则编辑器
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {state.rules.length} 条规则
              </span>
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className={`px-4 py-2 rounded-md text-sm ${
                  showCode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500 mb-4">
                  还没有规则，点击下方按钮添加
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
              className="w-full py-3 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:border-blue-400 hover:bg-blue-50 font-medium"
            >
              + 添加新规则
            </button>
          </div>

          {/* 代码预览 */}
          {showCode && (
            <div className="lg:sticky lg:top-6 h-fit">
              <div className="bg-white rounded-lg shadow">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-700">
                    生成的 Sieve 代码
                  </h2>
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                  >
                    复制
                  </button>
                </div>
                <pre className="p-4 overflow-auto max-h-[70vh] font-mono text-sm text-gray-800 bg-gray-50">
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
