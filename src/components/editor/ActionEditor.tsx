import type { RuleAction } from './types'

interface ActionEditorProps {
  action: RuleAction
  onChange: (action: RuleAction) => void
  onRemove?: () => void
}

const ACTION_TYPES = [
  { value: 'keep', label: '保留' },
  { value: 'fileinto', label: '移动到文件夹' },
  { value: 'redirect', label: '转发' },
  { value: 'discard', label: '丢弃' },
  { value: 'reject', label: '拒绝' },
  { value: 'stop', label: '停止处理' },
  { value: 'setflag', label: '设置标记' },
  { value: 'addflag', label: '添加标记' },
  { value: 'removeflag', label: '移除标记' },
  { value: 'vacation', label: '自动回复' },
  { value: 'set', label: '设置变量' },
] as const

const COMMON_FLAGS = [
  '\\Seen',
  '\\Answered',
  '\\Flagged',
  '\\Deleted',
  '\\Draft',
]

const COMMON_FOLDERS = ['INBOX', 'Junk', 'Trash', 'Drafts', 'Sent', 'Archive']

export default function ActionEditor({
  action,
  onChange,
  onRemove,
}: ActionEditorProps) {
  const update = (updates: Partial<RuleAction>) => {
    onChange({ ...action, ...updates })
  }

  const renderActionFields = () => {
    switch (action.type) {
      case 'keep':
      case 'discard':
      case 'stop':
        return <span className="text-gray-500 text-sm">（无需配置）</span>

      case 'fileinto':
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              <select
                value={action.mailbox || ''}
                onChange={(e) => update({ mailbox: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">选择文件夹</option>
                {COMMON_FOLDERS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={action.mailbox || ''}
                onChange={(e) => update({ mailbox: e.target.value })}
                placeholder="或输入文件夹名"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={action.copy || false}
                onChange={(e) => update({ copy: e.target.checked })}
                className="rounded"
              />
              保留副本在原位置
            </label>
          </div>
        )

      case 'redirect':
        return (
          <div className="space-y-2">
            <input
              type="email"
              value={action.address || ''}
              onChange={(e) => update({ address: e.target.value })}
              placeholder="转发到邮箱地址"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={action.copy || false}
                onChange={(e) => update({ copy: e.target.checked })}
                className="rounded"
              />
              保留副本
            </label>
          </div>
        )

      case 'reject':
        return (
          <textarea
            value={action.reason || ''}
            onChange={(e) => update({ reason: e.target.value })}
            placeholder="拒绝原因"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        )

      case 'setflag':
      case 'addflag':
      case 'removeflag':
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {COMMON_FLAGS.map((flag) => (
                <label key={flag} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={(action.flags || []).includes(flag)}
                    onChange={(e) => {
                      const flags = action.flags || []
                      if (e.target.checked) {
                        update({ flags: [...flags, flag] })
                      } else {
                        update({ flags: flags.filter((f) => f !== flag) })
                      }
                    }}
                    className="rounded"
                  />
                  {flag.replace('\\', '')}
                </label>
              ))}
            </div>
            <input
              type="text"
              value={(action.flags || [])
                .filter((f) => !COMMON_FLAGS.includes(f))
                .join(', ')}
              onChange={(e) => {
                const commonSelected = (action.flags || []).filter((f) =>
                  COMMON_FLAGS.includes(f),
                )
                const custom = e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
                update({ flags: [...commonSelected, ...custom] })
              }}
              placeholder="自定义标记（逗号分隔）"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        )

      case 'vacation':
        return (
          <div className="space-y-2">
            <label className="flex gap-2 items-center text-sm text-gray-600">
              间隔天数:
              <input
                type="number"
                value={action.vacationDays || 7}
                onChange={(e) =>
                  update({
                    vacationDays: Number.parseInt(e.target.value, 10) || 7,
                  })
                }
                min={1}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md"
              />
            </label>
            <input
              type="text"
              value={action.vacationSubject || ''}
              onChange={(e) => update({ vacationSubject: e.target.value })}
              placeholder="回复主题"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <textarea
              value={action.vacationMessage || ''}
              onChange={(e) => update({ vacationMessage: e.target.value })}
              placeholder="自动回复内容"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        )

      case 'set':
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={action.variableName || ''}
              onChange={(e) => update({ variableName: e.target.value })}
              placeholder="变量名"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <input
              type="text"
              value={action.variableValue || ''}
              onChange={(e) => update({ variableValue: e.target.value })}
              placeholder="变量值 (可用 ${1} 等引用匹配)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="p-3 bg-green-50 rounded-lg space-y-2">
      <div className="flex items-center gap-2">
        <select
          value={action.type}
          onChange={(e) =>
            onChange({
              id: action.id,
              type: e.target.value as RuleAction['type'],
            })
          }
          className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium"
        >
          {ACTION_TYPES.map((t) => (
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
            删除动作
          </button>
        )}
      </div>
      {renderActionFields()}
    </div>
  )
}
