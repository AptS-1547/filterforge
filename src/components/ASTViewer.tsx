import { useState } from 'react'
import type { ASTNode } from '../parser'

interface ASTViewerProps {
  node: ASTNode
  depth?: number
}

// 节点类型对应的颜色
const nodeColors: Record<string, string> = {
  SieveScript: 'bg-purple-100 text-purple-800',
  RequireCommand: 'bg-blue-100 text-blue-800',
  IfCommand: 'bg-orange-100 text-orange-800',
  ElsIfCommand: 'bg-orange-100 text-orange-800',
  ElseCommand: 'bg-orange-100 text-orange-800',
  StopCommand: 'bg-red-100 text-red-800',
  KeepCommand: 'bg-green-100 text-green-800',
  FileintoCommand: 'bg-green-100 text-green-800',
  RedirectCommand: 'bg-green-100 text-green-800',
  DiscardCommand: 'bg-red-100 text-red-800',
  RejectCommand: 'bg-red-100 text-red-800',
  SetCommand: 'bg-cyan-100 text-cyan-800',
  VacationCommand: 'bg-green-100 text-green-800',
  FlagCommand: 'bg-yellow-100 text-yellow-800',
  NotifyCommand: 'bg-pink-100 text-pink-800',
  GenericCommand: 'bg-gray-100 text-gray-800',
  Block: 'bg-slate-100 text-slate-800',
  // Tests
  AddressTest: 'bg-indigo-100 text-indigo-800',
  AllOfTest: 'bg-violet-100 text-violet-800',
  AnyOfTest: 'bg-violet-100 text-violet-800',
  EnvelopeTest: 'bg-indigo-100 text-indigo-800',
  ExistsTest: 'bg-indigo-100 text-indigo-800',
  FalseTest: 'bg-red-100 text-red-800',
  HeaderTest: 'bg-indigo-100 text-indigo-800',
  NotTest: 'bg-rose-100 text-rose-800',
  SizeTest: 'bg-indigo-100 text-indigo-800',
  TrueTest: 'bg-green-100 text-green-800',
  BodyTest: 'bg-indigo-100 text-indigo-800',
  DateTest: 'bg-indigo-100 text-indigo-800',
  CurrentDateTest: 'bg-indigo-100 text-indigo-800',
  HasFlagTest: 'bg-indigo-100 text-indigo-800',
  StringTest: 'bg-indigo-100 text-indigo-800',
  IhaveTest: 'bg-indigo-100 text-indigo-800',
  DuplicateTest: 'bg-indigo-100 text-indigo-800',
  GenericTest: 'bg-gray-100 text-gray-800',
  // Values
  String: 'bg-amber-100 text-amber-800',
  Number: 'bg-emerald-100 text-emerald-800',
  StringList: 'bg-amber-100 text-amber-800',
  Tag: 'bg-teal-100 text-teal-800',
}

function getNodeColor(type: string): string {
  return nodeColors[type] || 'bg-gray-100 text-gray-800'
}

// 获取节点的显示值
function getNodeValue(node: ASTNode): string | null {
  if ('value' in node && typeof node.value === 'string') {
    return `"${node.value.length > 30 ? `${node.value.slice(0, 30)}...` : node.value}"`
  }
  if ('value' in node && typeof node.value === 'number') {
    return String(node.value)
  }
  if ('name' in node && typeof node.name === 'string') {
    return node.name
  }
  if ('capabilities' in node && Array.isArray(node.capabilities)) {
    return `[${node.capabilities.join(', ')}]`
  }
  if ('action' in node && typeof node.action === 'string') {
    return node.action
  }
  return null
}

// 获取节点的子节点
function getChildren(
  node: ASTNode,
): Array<{ key: string; value: ASTNode | ASTNode[] }> {
  const children: Array<{ key: string; value: ASTNode | ASTNode[] }> = []
  const skipKeys = [
    'type',
    'location',
    'value',
    'name',
    'capabilities',
    'action',
    'multiline',
    'quantifier',
  ]

  for (const [key, value] of Object.entries(node)) {
    if (skipKeys.includes(key)) continue
    if (value === undefined || value === null) continue
    if (
      typeof value === 'boolean' ||
      typeof value === 'string' ||
      typeof value === 'number'
    )
      continue

    if (Array.isArray(value)) {
      if (value.length > 0 && typeof value[0] === 'object') {
        children.push({ key, value: value as ASTNode[] })
      }
    } else if (typeof value === 'object' && 'type' in value) {
      children.push({ key, value: value as ASTNode })
    }
  }

  return children
}

function TreeNode({ node, depth = 0 }: ASTViewerProps) {
  const [expanded, setExpanded] = useState(depth < 3)
  const children = getChildren(node)
  const hasChildren = children.length > 0
  const nodeValue = getNodeValue(node)

  return (
    <div className="font-mono text-sm">
      <button
        type="button"
        className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer hover:bg-gray-50 w-full text-left ${depth > 0 ? 'ml-4' : ''}`}
        onClick={() => setExpanded(!expanded)}
      >
        {hasChildren && (
          <span className="w-4 text-gray-400">{expanded ? '▼' : '▶'}</span>
        )}
        {!hasChildren && <span className="w-4" />}
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${getNodeColor(node.type)}`}
        >
          {node.type}
        </span>
        {nodeValue && <span className="text-gray-600">{nodeValue}</span>}
      </button>

      {expanded && hasChildren && (
        <div className="border-l border-gray-200 ml-6">
          {children.map(({ key, value }) => (
            <div key={key} className="ml-2">
              <span className="text-gray-400 text-xs">{key}:</span>
              {Array.isArray(value) ? (
                <div>
                  {value.map((item, index) => (
                    <TreeNode
                      key={`${key}-${index}`}
                      node={item}
                      depth={depth + 1}
                    />
                  ))}
                </div>
              ) : (
                <TreeNode node={value} depth={depth + 1} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ASTViewer({ node }: { node: ASTNode }) {
  return (
    <div className="overflow-auto">
      <TreeNode node={node} />
    </div>
  )
}
