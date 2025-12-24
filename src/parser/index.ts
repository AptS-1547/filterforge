import * as peggy from 'peggy'
import type { SieveScript } from './ast'
import grammar from './sieve.pegjs?raw'

export * from './ast'
export { generate, type GeneratorOptions } from './generator'

// 解析器实例 (懒加载)
let parserInstance: peggy.Parser | null = null

function getParser(): peggy.Parser {
  if (!parserInstance) {
    parserInstance = peggy.generate(grammar)
  }
  return parserInstance
}

// 解析错误类型
export interface ParseError {
  message: string
  location?: {
    start: { offset: number; line: number; column: number }
    end: { offset: number; line: number; column: number }
  }
  found?: string
  expected?: Array<{ type: string; description: string }>
}

// 解析结果
export type ParseResult =
  | { success: true; ast: SieveScript }
  | { success: false; error: ParseError }

/**
 * 解析 Sieve 脚本
 */
export function parse(input: string): ParseResult {
  try {
    const ast = getParser().parse(input) as SieveScript
    return { success: true, ast }
  } catch (e) {
    if (e instanceof Error && 'location' in e) {
      const pegError = e as peggy.GrammarError
      return {
        success: false,
        error: {
          message: pegError.message,
          location: pegError.location as ParseError['location'],
          found: (pegError as unknown as { found?: string }).found,
          expected: (
            pegError as unknown as { expected?: ParseError['expected'] }
          ).expected,
        },
      }
    }
    return {
      success: false,
      error: { message: e instanceof Error ? e.message : String(e) },
    }
  }
}

/**
 * 验证 Sieve 脚本是否有效
 */
export function validate(input: string): boolean {
  return parse(input).success
}

/**
 * 获取解析错误信息 (如果有)
 */
export function getError(input: string): ParseError | null {
  const result = parse(input)
  return result.success ? null : result.error
}
