/**
 * Sieve 代码生成器
 * 将 AST 转换为 Sieve 脚本字符串
 */

import type {
  AddressPart,
  AddressTest,
  Block,
  BodyTest,
  Command,
  CurrentDateTest,
  DateTest,
  DuplicateTest,
  ElseCommand,
  ElsIfCommand,
  EnvelopeTest,
  FileintoCommand,
  FlagCommand,
  GenericCommand,
  GenericTest,
  HasFlagTest,
  HeaderTest,
  IfCommand,
  KeepCommand,
  MatchType,
  NotifyCommand,
  RedirectCommand,
  RejectCommand,
  RelationalMatch,
  RequireCommand,
  SetCommand,
  SieveNumber,
  SieveScript,
  SieveString,
  StringList,
  StringTest,
  Test,
  VacationCommand,
} from './ast'

export interface GeneratorOptions {
  indent?: string
  newline?: string
}

const defaultOptions: Required<GeneratorOptions> = {
  indent: '    ',
  newline: '\n',
}

/**
 * 生成 Sieve 脚本
 */
export function generate(ast: SieveScript, options?: GeneratorOptions): string {
  const opts = { ...defaultOptions, ...options }
  return generateCommands(ast.commands, 0, opts)
}

function generateCommands(
  commands: Command[],
  depth: number,
  opts: Required<GeneratorOptions>,
): string {
  return commands
    .map((cmd) => generateCommand(cmd, depth, opts))
    .join(opts.newline)
}

function generateCommand(
  cmd: Command,
  depth: number,
  opts: Required<GeneratorOptions>,
): string {
  const indent = opts.indent.repeat(depth)

  switch (cmd.type) {
    case 'RequireCommand':
      return `${indent}${generateRequire(cmd)}`
    case 'IfCommand':
      return generateIf(cmd, depth, opts)
    case 'StopCommand':
      return `${indent}stop;`
    case 'KeepCommand':
      return `${indent}${generateKeep(cmd)}`
    case 'FileintoCommand':
      return `${indent}${generateFileinto(cmd)}`
    case 'RedirectCommand':
      return `${indent}${generateRedirect(cmd)}`
    case 'DiscardCommand':
      return `${indent}discard;`
    case 'RejectCommand':
      return `${indent}${generateReject(cmd)}`
    case 'SetCommand':
      return `${indent}${generateSet(cmd)}`
    case 'VacationCommand':
      return `${indent}${generateVacation(cmd)}`
    case 'FlagCommand':
      return `${indent}${generateFlag(cmd)}`
    case 'NotifyCommand':
      return `${indent}${generateNotify(cmd)}`
    case 'GenericCommand':
      return `${indent}${generateGenericCommand(cmd)}`
    default:
      return `${indent}# Unknown command`
  }
}

function generateRequire(cmd: RequireCommand): string {
  if (cmd.capabilities.length === 1) {
    return `require ${generateString({ type: 'String', value: cmd.capabilities[0] })};`
  }
  return `require [${cmd.capabilities.map((c) => generateString({ type: 'String', value: c })).join(', ')}];`
}

function generateIf(
  cmd: IfCommand,
  depth: number,
  opts: Required<GeneratorOptions>,
): string {
  const indent = opts.indent.repeat(depth)
  let result = `${indent}if ${generateTest(cmd.test)} ${generateBlock(cmd.consequent, depth, opts)}`

  if (cmd.alternate) {
    result += generateAlternate(cmd.alternate, depth, opts)
  }

  return result
}

function generateAlternate(
  alt: ElsIfCommand | ElseCommand,
  depth: number,
  opts: Required<GeneratorOptions>,
): string {
  if (alt.type === 'ElsIfCommand') {
    let result = ` elsif ${generateTest(alt.test)} ${generateBlock(alt.consequent, depth, opts)}`
    if (alt.alternate) {
      result += generateAlternate(alt.alternate, depth, opts)
    }
    return result
  }
  return ` else ${generateBlock(alt.consequent, depth, opts)}`
}

function generateBlock(
  block: Block,
  depth: number,
  opts: Required<GeneratorOptions>,
): string {
  if (block.commands.length === 0) {
    return '{}'
  }
  const inner = generateCommands(block.commands, depth + 1, opts)
  const indent = opts.indent.repeat(depth)
  return `{${opts.newline}${inner}${opts.newline}${indent}}`
}

function generateKeep(cmd: KeepCommand): string {
  let result = 'keep'
  if (cmd.flags) {
    result += ` :flags ${generateStringList(cmd.flags)}`
  }
  return `${result};`
}

function generateFileinto(cmd: FileintoCommand): string {
  let result = 'fileinto'
  if (cmd.copy) result += ' :copy'
  if (cmd.create) result += ' :create'
  if (cmd.flags) result += ` :flags ${generateStringList(cmd.flags)}`
  result += ` ${generateString(cmd.mailbox)}`
  return `${result};`
}

function generateRedirect(cmd: RedirectCommand): string {
  let result = 'redirect'
  if (cmd.copy) result += ' :copy'
  result += ` ${generateString(cmd.address)}`
  return `${result};`
}

function generateReject(cmd: RejectCommand): string {
  return `reject ${generateString(cmd.reason)};`
}

function generateSet(cmd: SetCommand): string {
  let result = 'set'
  for (const mod of cmd.modifiers) {
    result += ` :${mod}`
  }
  result += ` ${generateString(cmd.name)} ${generateString(cmd.value)}`
  return `${result};`
}

function generateVacation(cmd: VacationCommand): string {
  let result = 'vacation'
  if (cmd.days !== undefined) result += ` :days ${cmd.days}`
  if (cmd.seconds !== undefined) result += ` :seconds ${cmd.seconds}`
  if (cmd.subject) result += ` :subject ${generateString(cmd.subject)}`
  if (cmd.from) result += ` :from ${generateString(cmd.from)}`
  if (cmd.addresses)
    result += ` :addresses ${generateStringList(cmd.addresses)}`
  if (cmd.mime) result += ' :mime'
  if (cmd.handle) result += ` :handle ${generateString(cmd.handle)}`
  result += ` ${generateString(cmd.reason)}`
  return `${result};`
}

function generateFlag(cmd: FlagCommand): string {
  let result = cmd.action
  if (cmd.variablename) result += ` ${generateString(cmd.variablename)}`
  result += ` ${generateStringList(cmd.flags)}`
  return `${result};`
}

function generateNotify(cmd: NotifyCommand): string {
  let result = 'notify'
  if (cmd.options) result += ` :options ${generateStringList(cmd.options)}`
  if (cmd.importance) result += ` :importance "${cmd.importance}"`
  if (cmd.message) result += ` :message ${generateString(cmd.message)}`
  result += ` ${generateString(cmd.method)}`
  return `${result};`
}

function generateGenericCommand(cmd: GenericCommand): string {
  let result = cmd.name
  for (const arg of cmd.arguments) {
    if (arg.type === 'Tag') {
      result += ` :${arg.name}`
    } else if (arg.type === 'Number') {
      result += ` ${generateNumber(arg)}`
    } else if (arg.type === 'String') {
      result += ` ${generateString(arg)}`
    } else if (arg.type === 'StringList') {
      result += ` ${generateStringList(arg)}`
    }
  }
  return `${result};`
}

// ============ 测试生成 ============

function generateTest(test: Test): string {
  switch (test.type) {
    case 'AddressTest':
      return generateAddressTest(test)
    case 'AllOfTest':
      return `allof (${test.tests.map(generateTest).join(', ')})`
    case 'AnyOfTest':
      return `anyof (${test.tests.map(generateTest).join(', ')})`
    case 'EnvelopeTest':
      return generateEnvelopeTest(test)
    case 'ExistsTest':
      return `exists ${generateStringList(test.headers)}`
    case 'FalseTest':
      return 'false'
    case 'HeaderTest':
      return generateHeaderTest(test)
    case 'NotTest':
      return `not ${generateTest(test.test)}`
    case 'SizeTest':
      return `size ${test.over ? ':over' : ':under'} ${generateNumber(test.size)}`
    case 'TrueTest':
      return 'true'
    case 'BodyTest':
      return generateBodyTest(test)
    case 'DateTest':
      return generateDateTest(test)
    case 'CurrentDateTest':
      return generateCurrentDateTest(test)
    case 'HasFlagTest':
      return generateHasFlagTest(test)
    case 'StringTest':
      return generateStringTestExpr(test)
    case 'IhaveTest':
      return `ihave ${generateStringList(test.capabilities)}`
    case 'DuplicateTest':
      return generateDuplicateTest(test)
    case 'GenericTest':
      return generateGenericTest(test)
    default:
      return 'true'
  }
}

function generateAddressTest(test: AddressTest): string {
  let result = 'address'
  result += generateTestOptions(
    test.addressPart,
    test.matchType,
    test.relationalMatch,
    test.comparator,
  )
  result += ` ${generateStringList(test.headers)} ${generateStringList(test.keys)}`
  return result
}

function generateEnvelopeTest(test: EnvelopeTest): string {
  let result = 'envelope'
  result += generateTestOptions(
    test.addressPart,
    test.matchType,
    test.relationalMatch,
    test.comparator,
  )
  result += ` ${generateStringList(test.envelopeParts)} ${generateStringList(test.keys)}`
  return result
}

function generateHeaderTest(test: HeaderTest): string {
  let result = 'header'
  result += generateTestOptions(
    undefined,
    test.matchType,
    test.relationalMatch,
    test.comparator,
  )
  result += ` ${generateStringList(test.headers)} ${generateStringList(test.keys)}`
  return result
}

function generateBodyTest(test: BodyTest): string {
  let result = 'body'
  if (test.bodyTransform === 'raw') result += ' :raw'
  else if (test.bodyTransform === 'text') result += ' :text'
  else if (test.bodyTransform === 'content' && test.contentTypes) {
    result += ` :content ${generateStringList(test.contentTypes)}`
  }
  result += generateTestOptions(
    undefined,
    test.matchType,
    undefined,
    test.comparator,
  )
  result += ` ${generateStringList(test.keys)}`
  return result
}

function generateDateTest(test: DateTest): string {
  let result = 'date'
  if (test.zone) result += ` :zone ${generateString(test.zone)}`
  if (test.originalzone) result += ' :originalzone'
  result += generateTestOptions(
    undefined,
    test.matchType,
    test.relationalMatch,
    test.comparator,
  )
  result += ` ${generateString(test.header)} "${test.datepart}" ${generateStringList(test.keys)}`
  return result
}

function generateCurrentDateTest(test: CurrentDateTest): string {
  let result = 'currentdate'
  if (test.zone) result += ` :zone ${generateString(test.zone)}`
  result += generateTestOptions(
    undefined,
    test.matchType,
    test.relationalMatch,
    test.comparator,
  )
  result += ` "${test.datepart}" ${generateStringList(test.keys)}`
  return result
}

function generateHasFlagTest(test: HasFlagTest): string {
  let result = 'hasflag'
  result += generateTestOptions(
    undefined,
    test.matchType,
    undefined,
    test.comparator,
  )
  if (test.variablename) result += ` ${generateStringList(test.variablename)}`
  result += ` ${generateStringList(test.flags)}`
  return result
}

function generateStringTestExpr(test: StringTest): string {
  let result = 'string'
  result += generateTestOptions(
    undefined,
    test.matchType,
    test.relationalMatch,
    test.comparator,
  )
  result += ` ${generateStringList(test.source)} ${generateStringList(test.keys)}`
  return result
}

function generateDuplicateTest(test: DuplicateTest): string {
  let result = 'duplicate'
  if (test.handle) result += ` :handle ${generateString(test.handle)}`
  if (test.header) result += ` :header ${generateString(test.header)}`
  if (test.uniqueid) result += ` :uniqueid ${generateString(test.uniqueid)}`
  if (test.seconds !== undefined) result += ` :seconds ${test.seconds}`
  if (test.last) result += ' :last'
  return result
}

function generateGenericTest(test: GenericTest): string {
  let result = test.name
  for (const arg of test.arguments) {
    if (arg.type === 'Tag') {
      result += ` :${arg.name}`
    } else if (arg.type === 'Number') {
      result += ` ${generateNumber(arg)}`
    } else if (arg.type === 'String') {
      result += ` ${generateString(arg)}`
    } else if (arg.type === 'StringList') {
      result += ` ${generateStringList(arg)}`
    }
  }
  return result
}

function generateTestOptions(
  addressPart?: AddressPart,
  matchType?: MatchType,
  relationalMatch?: RelationalMatch,
  comparator?: string,
): string {
  let result = ''
  if (addressPart) result += ` :${addressPart}`
  if (matchType) result += ` :${matchType}`
  if (relationalMatch) result += ` :value "${relationalMatch}"`
  if (comparator) result += ` :comparator "${comparator}"`
  return result
}

// ============ 基础类型生成 ============

function generateString(str: SieveString): string {
  if (str.multiline) {
    return `text:\n${str.value}\n.`
  }
  const escaped = str.value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return `"${escaped}"`
}

function generateNumber(num: SieveNumber): string {
  if (num.quantifier) {
    const divisor =
      num.quantifier === 'K'
        ? 1024
        : num.quantifier === 'M'
          ? 1024 * 1024
          : 1024 * 1024 * 1024
    return `${num.value / divisor}${num.quantifier}`
  }
  return String(num.value)
}

function generateStringList(list: StringList): string {
  if (list.values.length === 1) {
    return generateString(list.values[0])
  }
  return `[${list.values.map(generateString).join(', ')}]`
}
