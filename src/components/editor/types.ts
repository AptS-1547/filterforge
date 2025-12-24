/**
 * 编辑器内部使用的简化类型
 * 比 AST 更易于表单操作
 */

export type MatchType = 'is' | 'contains' | 'matches' | 'regex'

export interface RuleCondition {
  id: string
  type:
    | 'header'
    | 'address'
    | 'envelope'
    | 'size'
    | 'exists'
    | 'body'
    | 'allof'
    | 'anyof'
    | 'not'
    | 'true'
    | 'false'
  // header/address/envelope
  field?: string
  matchType?: MatchType
  values?: string[]
  // address specific
  addressPart?: 'all' | 'localpart' | 'domain'
  // size
  sizeOver?: boolean
  sizeValue?: number
  sizeUnit?: 'B' | 'K' | 'M'
  // composite
  conditions?: RuleCondition[]
  // not
  condition?: RuleCondition
}

export interface RuleAction {
  id: string
  type:
    | 'keep'
    | 'fileinto'
    | 'redirect'
    | 'discard'
    | 'reject'
    | 'stop'
    | 'setflag'
    | 'addflag'
    | 'removeflag'
    | 'vacation'
    | 'set'
  // fileinto
  mailbox?: string
  copy?: boolean
  // redirect
  address?: string
  // reject
  reason?: string
  // flags
  flags?: string[]
  // vacation
  vacationDays?: number
  vacationSubject?: string
  vacationMessage?: string
  // set (variables)
  variableName?: string
  variableValue?: string
}

export interface Rule {
  id: string
  name: string
  enabled: boolean
  condition: RuleCondition
  actions: RuleAction[]
}

export interface EditorState {
  require: string[]
  rules: Rule[]
}

// 生成唯一 ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

// 创建默认条件
export function createDefaultCondition(): RuleCondition {
  return {
    id: generateId(),
    type: 'header',
    field: 'Subject',
    matchType: 'contains',
    values: [''],
  }
}

// 创建默认动作
export function createDefaultAction(): RuleAction {
  return {
    id: generateId(),
    type: 'keep',
  }
}

// 创建默认规则
export function createDefaultRule(): Rule {
  return {
    id: generateId(),
    name: '新规则',
    enabled: true,
    condition: createDefaultCondition(),
    actions: [createDefaultAction()],
  }
}

// 创建默认编辑器状态
export function createDefaultState(): EditorState {
  return {
    require: [],
    rules: [],
  }
}
