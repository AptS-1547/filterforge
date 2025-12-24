/**
 * Sieve AST 类型定义
 * 基于 RFC 5228 (核心) 和 RFC 5229 (变量扩展)
 */

// ============ 位置信息 ============

export interface Location {
  start: Position
  end: Position
}

export interface Position {
  offset: number
  line: number
  column: number
}

// ============ 基础节点 ============

export interface BaseNode {
  type: string
  location?: Location
}

// ============ 脚本根节点 ============

export interface SieveScript extends BaseNode {
  type: 'SieveScript'
  commands: Command[]
}

// ============ 命令类型 ============

export type Command = RequireCommand | IfCommand | StopCommand | ActionCommand

// ============ Require 命令 ============

export interface RequireCommand extends BaseNode {
  type: 'RequireCommand'
  capabilities: string[]
}

// ============ 条件命令 ============

export interface IfCommand extends BaseNode {
  type: 'IfCommand'
  test: Test
  consequent: Block
  alternate?: ElsIfCommand | ElseCommand
}

export interface ElsIfCommand extends BaseNode {
  type: 'ElsIfCommand'
  test: Test
  consequent: Block
  alternate?: ElsIfCommand | ElseCommand
}

export interface ElseCommand extends BaseNode {
  type: 'ElseCommand'
  consequent: Block
}

// ============ 控制命令 ============

export interface StopCommand extends BaseNode {
  type: 'StopCommand'
}

// ============ 动作命令 ============

export type ActionCommand =
  | KeepCommand
  | FileintoCommand
  | RedirectCommand
  | DiscardCommand
  | RejectCommand
  | SetCommand
  | VacationCommand
  | FlagCommand
  | NotifyCommand
  | GenericCommand

export interface KeepCommand extends BaseNode {
  type: 'KeepCommand'
  flags?: StringList // imap4flags 扩展
}

export interface FileintoCommand extends BaseNode {
  type: 'FileintoCommand'
  mailbox: SieveString
  copy?: boolean
  create?: boolean // mailbox 扩展
  flags?: StringList // imap4flags 扩展
}

export interface RedirectCommand extends BaseNode {
  type: 'RedirectCommand'
  address: SieveString
  copy?: boolean
}

export interface DiscardCommand extends BaseNode {
  type: 'DiscardCommand'
}

export interface RejectCommand extends BaseNode {
  type: 'RejectCommand'
  reason: SieveString
}

// RFC 5229 变量扩展
export interface SetCommand extends BaseNode {
  type: 'SetCommand'
  modifiers: SetModifier[]
  name: SieveString
  value: SieveString
}

export type SetModifier =
  | 'lower'
  | 'upper'
  | 'lowerfirst'
  | 'upperfirst'
  | 'quotewildcard'
  | 'length'

// RFC 5230 vacation 扩展
export interface VacationCommand extends BaseNode {
  type: 'VacationCommand'
  reason: SieveString
  days?: number
  seconds?: number // vacation-seconds 扩展
  subject?: SieveString
  from?: SieveString
  addresses?: StringList
  mime?: boolean
  handle?: SieveString
}

// RFC 5232 imap4flags 扩展
export interface FlagCommand extends BaseNode {
  type: 'FlagCommand'
  action: 'setflag' | 'addflag' | 'removeflag'
  variablename?: SieveString
  flags: StringList
}

// RFC 5435 notify 扩展
export interface NotifyCommand extends BaseNode {
  type: 'NotifyCommand'
  method: SieveString
  options?: StringList
  importance?: '1' | '2' | '3'
  message?: SieveString
}

// 通用命令 (用于未知或自定义扩展)
export interface GenericCommand extends BaseNode {
  type: 'GenericCommand'
  name: string
  arguments: Argument[]
  block?: Block
}

// ============ 测试类型 ============

export type Test =
  | AddressTest
  | AllOfTest
  | AnyOfTest
  | EnvelopeTest
  | ExistsTest
  | FalseTest
  | HeaderTest
  | NotTest
  | SizeTest
  | TrueTest
  | BodyTest
  | DateTest
  | CurrentDateTest
  | HasFlagTest
  | StringTest
  | IhaveTest
  | DuplicateTest
  | GenericTest

// 匹配类型
export type MatchType = 'is' | 'contains' | 'matches' | 'regex'

// 比较器
export type Comparator =
  | 'i;octet'
  | 'i;ascii-casemap'
  | 'i;ascii-numeric'
  | string

// 地址部分
export type AddressPart = 'localpart' | 'domain' | 'all'

// RFC 5231 关系比较
export type RelationalMatch = 'gt' | 'ge' | 'lt' | 'le' | 'eq' | 'ne'

export interface AddressTest extends BaseNode {
  type: 'AddressTest'
  addressPart?: AddressPart
  matchType?: MatchType
  relationalMatch?: RelationalMatch
  comparator?: Comparator
  headers: StringList
  keys: StringList
}

export interface AllOfTest extends BaseNode {
  type: 'AllOfTest'
  tests: Test[]
}

export interface AnyOfTest extends BaseNode {
  type: 'AnyOfTest'
  tests: Test[]
}

export interface EnvelopeTest extends BaseNode {
  type: 'EnvelopeTest'
  addressPart?: AddressPart
  matchType?: MatchType
  relationalMatch?: RelationalMatch
  comparator?: Comparator
  envelopeParts: StringList
  keys: StringList
}

export interface ExistsTest extends BaseNode {
  type: 'ExistsTest'
  headers: StringList
}

export interface FalseTest extends BaseNode {
  type: 'FalseTest'
}

export interface HeaderTest extends BaseNode {
  type: 'HeaderTest'
  matchType?: MatchType
  relationalMatch?: RelationalMatch
  comparator?: Comparator
  headers: StringList
  keys: StringList
}

export interface NotTest extends BaseNode {
  type: 'NotTest'
  test: Test
}

export interface SizeTest extends BaseNode {
  type: 'SizeTest'
  over: boolean // true = :over, false = :under
  size: SieveNumber
}

export interface TrueTest extends BaseNode {
  type: 'TrueTest'
}

// RFC 5173 body 扩展
export interface BodyTest extends BaseNode {
  type: 'BodyTest'
  bodyTransform?: 'raw' | 'content' | 'text'
  contentTypes?: StringList
  matchType?: MatchType
  comparator?: Comparator
  keys: StringList
}

// RFC 5260 date 扩展
export interface DateTest extends BaseNode {
  type: 'DateTest'
  header: SieveString
  datepart: string
  matchType?: MatchType
  relationalMatch?: RelationalMatch
  comparator?: Comparator
  zone?: SieveString
  originalzone?: boolean
  keys: StringList
}

export interface CurrentDateTest extends BaseNode {
  type: 'CurrentDateTest'
  datepart: string
  matchType?: MatchType
  relationalMatch?: RelationalMatch
  comparator?: Comparator
  zone?: SieveString
  keys: StringList
}

// RFC 5232 imap4flags 扩展
export interface HasFlagTest extends BaseNode {
  type: 'HasFlagTest'
  matchType?: MatchType
  comparator?: Comparator
  variablename?: StringList
  flags: StringList
}

// RFC 5229 variables 扩展
export interface StringTest extends BaseNode {
  type: 'StringTest'
  matchType?: MatchType
  relationalMatch?: RelationalMatch
  comparator?: Comparator
  source: StringList
  keys: StringList
}

// RFC 5463 ihave 扩展
export interface IhaveTest extends BaseNode {
  type: 'IhaveTest'
  capabilities: StringList
}

// RFC 7352 duplicate 扩展
export interface DuplicateTest extends BaseNode {
  type: 'DuplicateTest'
  handle?: SieveString
  header?: SieveString
  uniqueid?: SieveString
  seconds?: number
  last?: boolean
}

// 通用测试 (用于未知扩展)
export interface GenericTest extends BaseNode {
  type: 'GenericTest'
  name: string
  arguments: Argument[]
}

// ============ 参数类型 ============

export type Argument = Tag | SieveNumber | SieveString | StringList | TestList

export interface Tag extends BaseNode {
  type: 'Tag'
  name: string
}

export interface SieveNumber extends BaseNode {
  type: 'Number'
  value: number
  quantifier?: 'K' | 'M' | 'G'
}

export interface SieveString extends BaseNode {
  type: 'String'
  value: string
  multiline?: boolean
}

export interface StringList extends BaseNode {
  type: 'StringList'
  values: SieveString[]
}

export interface TestList extends BaseNode {
  type: 'TestList'
  tests: Test[]
}

// ============ 块 ============

export interface Block extends BaseNode {
  type: 'Block'
  commands: Command[]
}

// ============ 工具类型 ============

export type ASTNode =
  | SieveScript
  | Command
  | Test
  | Argument
  | Block
  | ElsIfCommand
  | ElseCommand
