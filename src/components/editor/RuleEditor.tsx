import ActionEditor from './ActionEditor'
import ConditionEditor from './ConditionEditor'
import type { Rule } from './types'
import { createDefaultAction } from './types'

interface RuleEditorProps {
  rule: Rule
  onChange: (rule: Rule) => void
  onRemove: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
}

export default function RuleEditor({
  rule,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: RuleEditorProps) {
  const update = (updates: Partial<Rule>) => {
    onChange({ ...rule, ...updates })
  }

  return (
    <div
      className={`bg-white rounded-lg shadow border-l-4 ${rule.enabled ? 'border-blue-500' : 'border-gray-300'}`}
    >
      {/* 规则头部 */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={rule.enabled}
            onChange={(e) => update({ enabled: e.target.checked })}
            className="w-5 h-5 rounded"
          />
          <input
            type="text"
            value={rule.name}
            onChange={(e) => update({ name: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium"
            placeholder="规则名称"
          />
          <div className="flex gap-1">
            {onMoveUp && (
              <button
                type="button"
                onClick={onMoveUp}
                className="p-2 text-gray-500 hover:text-gray-700"
                title="上移"
              >
                ↑
              </button>
            )}
            {onMoveDown && (
              <button
                type="button"
                onClick={onMoveDown}
                className="p-2 text-gray-500 hover:text-gray-700"
                title="下移"
              >
                ↓
              </button>
            )}
            <button
              type="button"
              onClick={onRemove}
              className="p-2 text-red-500 hover:text-red-700"
              title="删除规则"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      {/* 条件部分 */}
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">条件 (IF)</h3>
        <ConditionEditor
          condition={rule.condition}
          onChange={(condition) => update({ condition })}
        />
      </div>

      {/* 动作部分 */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          动作 (THEN)
        </h3>
        <div className="space-y-2">
          {rule.actions.map((action, index) => (
            <ActionEditor
              key={action.id}
              action={action}
              onChange={(updated) => {
                const newActions = [...rule.actions]
                newActions[index] = updated
                update({ actions: newActions })
              }}
              onRemove={
                rule.actions.length > 1
                  ? () =>
                      update({
                        actions: rule.actions.filter((_, i) => i !== index),
                      })
                  : undefined
              }
            />
          ))}
          <button
            type="button"
            onClick={() =>
              update({ actions: [...rule.actions, createDefaultAction()] })
            }
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 text-sm"
          >
            + 添加动作
          </button>
        </div>
      </div>
    </div>
  )
}
