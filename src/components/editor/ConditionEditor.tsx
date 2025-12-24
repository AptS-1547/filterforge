import type { MatchType, RuleCondition } from './types'
import { createDefaultCondition } from './types'

interface ConditionEditorProps {
  condition: RuleCondition
  onChange: (condition: RuleCondition) => void
  onRemove?: () => void
  depth?: number
}

const CONDITION_TYPES = [
  { value: 'header', label: '邮件头' },
  { value: 'address', label: '地址' },
  { value: 'envelope', label: '信封' },
  { value: 'size', label: '大小' },
  { value: 'exists', label: '存在' },
  { value: 'body', label: '正文' },
  { value: 'allof', label: '全部满足 (AND)' },
  { value: 'anyof', label: '任一满足 (OR)' },
  { value: 'not', label: '取反 (NOT)' },
  { value: 'true', label: '始终真' },
  { value: 'false', label: '始终假' },
] as const

const MATCH_TYPES: Array<{ value: MatchType; label: string }> = [
  { value: 'is', label: '等于' },
  { value: 'contains', label: '包含' },
  { value: 'matches', label: '匹配通配符' },
  { value: 'regex', label: '正则表达式' },
]

const COMMON_HEADERS = [
  'Subject',
  'From',
  'To',
  'Cc',
  'Reply-To',
  'List-Id',
  'X-Spam-Flag',
]

const ADDRESS_PARTS = [
  { value: 'all', label: '完整地址' },
  { value: 'localpart', label: '本地部分' },
  { value: 'domain', label: '域名' },
]

export default function ConditionEditor({
  condition,
  onChange,
  onRemove,
  depth = 0,
}: ConditionEditorProps) {
  const update = (updates: Partial<RuleCondition>) => {
    onChange({ ...condition, ...updates })
  }

  const renderFieldEditor = () => {
    switch (condition.type) {
      case 'header':
      case 'address':
      case 'envelope':
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              <select
                value={condition.field || ''}
                onChange={(e) => update({ field: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">选择字段</option>
                {COMMON_HEADERS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={condition.field || ''}
                onChange={(e) => update({ field: e.target.value })}
                placeholder="或输入自定义字段"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            {condition.type === 'address' && (
              <select
                value={condition.addressPart || 'all'}
                onChange={(e) =>
                  update({
                    addressPart: e.target.value as
                      | 'all'
                      | 'localpart'
                      | 'domain',
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                {ADDRESS_PARTS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            )}

            <select
              value={condition.matchType || 'contains'}
              onChange={(e) =>
                update({ matchType: e.target.value as MatchType })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              {MATCH_TYPES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            <div className="space-y-1">
              {(condition.values || ['']).map((value, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => {
                      const newValues = [...(condition.values || [''])]
                      newValues[index] = e.target.value
                      update({ values: newValues })
                    }}
                    placeholder="匹配值"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newValues = (condition.values || ['']).filter(
                        (_, i) => i !== index,
                      )
                      update({ values: newValues.length ? newValues : [''] })
                    }}
                    className="px-2 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  update({ values: [...(condition.values || ['']), ''] })
                }
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + 添加匹配值
              </button>
            </div>
          </div>
        )

      case 'size':
        return (
          <div className="flex gap-2 items-center">
            <select
              value={condition.sizeOver ? 'over' : 'under'}
              onChange={(e) => update({ sizeOver: e.target.value === 'over' })}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="over">大于</option>
              <option value="under">小于</option>
            </select>
            <input
              type="number"
              value={condition.sizeValue || 0}
              onChange={(e) =>
                update({ sizeValue: Number.parseInt(e.target.value, 10) || 0 })
              }
              className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <select
              value={condition.sizeUnit || 'K'}
              onChange={(e) =>
                update({ sizeUnit: e.target.value as 'B' | 'K' | 'M' })
              }
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="B">字节</option>
              <option value="K">KB</option>
              <option value="M">MB</option>
            </select>
          </div>
        )

      case 'exists':
        return (
          <input
            type="text"
            value={condition.field || ''}
            onChange={(e) => update({ field: e.target.value })}
            placeholder="邮件头字段名"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        )

      case 'body':
        return (
          <div className="space-y-2">
            <select
              value={condition.matchType || 'contains'}
              onChange={(e) =>
                update({ matchType: e.target.value as MatchType })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              {MATCH_TYPES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={(condition.values || [''])[0] || ''}
              onChange={(e) => update({ values: [e.target.value] })}
              placeholder="搜索内容"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        )

      case 'allof':
      case 'anyof':
        return (
          <div className="space-y-2 pl-4 border-l-2 border-gray-200">
            {(condition.conditions || []).map((sub, index) => (
              <ConditionEditor
                key={sub.id}
                condition={sub}
                onChange={(updated) => {
                  const newConditions = [...(condition.conditions || [])]
                  newConditions[index] = updated
                  update({ conditions: newConditions })
                }}
                onRemove={() => {
                  const newConditions = (condition.conditions || []).filter(
                    (_, i) => i !== index,
                  )
                  update({ conditions: newConditions })
                }}
                depth={depth + 1}
              />
            ))}
            <button
              type="button"
              onClick={() =>
                update({
                  conditions: [
                    ...(condition.conditions || []),
                    createDefaultCondition(),
                  ],
                })
              }
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + 添加条件
            </button>
          </div>
        )

      case 'not':
        return (
          <div className="pl-4 border-l-2 border-gray-200">
            <ConditionEditor
              condition={condition.condition || createDefaultCondition()}
              onChange={(updated) => update({ condition: updated })}
              depth={depth + 1}
            />
          </div>
        )

      case 'true':
      case 'false':
        return <span className="text-gray-500 text-sm">（无需配置）</span>

      default:
        return null
    }
  }

  return (
    <div
      className={`p-3 bg-gray-50 rounded-lg space-y-2 ${depth > 0 ? 'mt-2' : ''}`}
    >
      <div className="flex items-center gap-2">
        <select
          value={condition.type}
          onChange={(e) => {
            const newType = e.target.value as RuleCondition['type']
            const newCondition: RuleCondition = {
              id: condition.id,
              type: newType,
            }
            // 初始化复合条件
            if (newType === 'allof' || newType === 'anyof') {
              newCondition.conditions = [createDefaultCondition()]
            } else if (newType === 'not') {
              newCondition.condition = createDefaultCondition()
            }
            onChange(newCondition)
          }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium"
        >
          {CONDITION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-auto px-2 py-1 text-red-500 hover:text-red-700 text-sm"
          >
            删除条件
          </button>
        )}
      </div>
      {renderFieldEditor()}
    </div>
  )
}
