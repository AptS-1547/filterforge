/**
 * 将编辑器状态转换为 Sieve 脚本
 */

import type { EditorState, Rule, RuleAction, RuleCondition } from './types'

// 收集所需的扩展
function collectRequires(state: EditorState): string[] {
  const requires = new Set<string>()

  for (const rule of state.rules) {
    collectConditionRequires(rule.condition, requires)
    for (const action of rule.actions) {
      collectActionRequires(action, requires)
    }
  }

  return Array.from(requires).sort()
}

function collectConditionRequires(
  condition: RuleCondition,
  requires: Set<string>,
) {
  switch (condition.type) {
    case 'body':
      requires.add('body')
      break
    case 'envelope':
      requires.add('envelope')
      break
    case 'allof':
    case 'anyof':
      for (const sub of condition.conditions || []) {
        collectConditionRequires(sub, requires)
      }
      break
    case 'not':
      if (condition.condition) {
        collectConditionRequires(condition.condition, requires)
      }
      break
  }
  if (condition.matchType === 'regex') {
    requires.add('regex')
  }
}

function collectActionRequires(action: RuleAction, requires: Set<string>) {
  switch (action.type) {
    case 'fileinto':
      requires.add('fileinto')
      if (action.copy) requires.add('copy')
      break
    case 'redirect':
      if (action.copy) requires.add('copy')
      break
    case 'reject':
      requires.add('reject')
      break
    case 'setflag':
    case 'addflag':
    case 'removeflag':
      requires.add('imap4flags')
      break
    case 'vacation':
      requires.add('vacation')
      break
    case 'set':
      requires.add('variables')
      break
  }
}

// 生成条件字符串
function generateCondition(
  condition: RuleCondition,
  indent: string = '',
): string {
  switch (condition.type) {
    case 'header':
      return `header ${condition.matchType ? `:${condition.matchType}` : ':contains'} "${condition.field || 'Subject'}" ${formatStringList(condition.values || [''])}`

    case 'address':
      return `address ${condition.addressPart ? `:${condition.addressPart}` : ''} ${condition.matchType ? `:${condition.matchType}` : ':contains'} "${condition.field || 'From'}" ${formatStringList(condition.values || [''])}`.replace(
        /\s+/g,
        ' ',
      )

    case 'envelope':
      return `envelope ${condition.addressPart ? `:${condition.addressPart}` : ''} ${condition.matchType ? `:${condition.matchType}` : ':contains'} "${condition.field || 'from'}" ${formatStringList(condition.values || [''])}`.replace(
        /\s+/g,
        ' ',
      )

    case 'size': {
      const size = condition.sizeValue || 0
      const unit = condition.sizeUnit || 'K'
      return `size ${condition.sizeOver ? ':over' : ':under'} ${size}${unit}`
    }

    case 'exists':
      return `exists "${condition.field || ''}"`

    case 'body':
      return `body :text ${condition.matchType ? `:${condition.matchType}` : ':contains'} ${formatStringList(condition.values || [''])}`

    case 'allof': {
      const subs = (condition.conditions || []).map((c) =>
        generateCondition(c, indent + '    '),
      )
      return `allof (\n${indent}    ${subs.join(`,\n${indent}    `)}\n${indent})`
    }

    case 'anyof': {
      const subs = (condition.conditions || []).map((c) =>
        generateCondition(c, indent + '    '),
      )
      return `anyof (\n${indent}    ${subs.join(`,\n${indent}    `)}\n${indent})`
    }

    case 'not':
      return `not ${generateCondition(condition.condition || { id: '', type: 'true' }, indent)}`

    case 'true':
      return 'true'

    case 'false':
      return 'false'

    default:
      return 'true'
  }
}

// 生成动作字符串
function generateAction(action: RuleAction): string {
  switch (action.type) {
    case 'keep':
      return 'keep;'

    case 'fileinto':
      return `fileinto${action.copy ? ' :copy' : ''} "${action.mailbox || 'INBOX'}";`

    case 'redirect':
      return `redirect${action.copy ? ' :copy' : ''} "${action.address || ''}";`

    case 'discard':
      return 'discard;'

    case 'reject':
      return `reject "${escapeString(action.reason || '')}";`

    case 'stop':
      return 'stop;'

    case 'setflag':
    case 'addflag':
    case 'removeflag':
      return `${action.type} ${formatStringList(action.flags || [])};`

    case 'vacation': {
      let cmd = 'vacation'
      if (action.vacationDays) cmd += ` :days ${action.vacationDays}`
      if (action.vacationSubject)
        cmd += ` :subject "${escapeString(action.vacationSubject)}"`
      cmd += ` "${escapeString(action.vacationMessage || '')}"`
      return cmd + ';'
    }

    case 'set':
      return `set "${action.variableName || ''}" "${escapeString(action.variableValue || '')}";`

    default:
      return ''
  }
}

// 格式化字符串列表
function formatStringList(values: string[]): string {
  if (values.length === 0) return '""'
  if (values.length === 1) return `"${escapeString(values[0])}"`
  return `[${values.map((v) => `"${escapeString(v)}"`).join(', ')}]`
}

// 转义字符串
function escapeString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

// 生成单条规则
function generateRule(rule: Rule, indent: string = ''): string {
  if (!rule.enabled) {
    return `${indent}# [已禁用] ${rule.name}`
  }

  const condition = generateCondition(rule.condition, indent)
  const actions = rule.actions
    .map((a) => `${indent}    ${generateAction(a)}`)
    .join('\n')

  return `${indent}# ${rule.name}\n${indent}if ${condition} {\n${actions}\n${indent}}`
}

// 主转换函数
export function convertToSieve(state: EditorState): string {
  const lines: string[] = []

  // 收集并生成 require
  const requires = collectRequires(state)
  if (requires.length > 0) {
    lines.push(`require ${formatStringList(requires)};`)
    lines.push('')
  }

  // 生成规则
  for (const rule of state.rules) {
    lines.push(generateRule(rule))
    lines.push('')
  }

  return lines.join('\n').trim() + '\n'
}
