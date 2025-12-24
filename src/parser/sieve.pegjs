/**
 * Sieve 语法解析器
 * 基于 RFC 5228 (核心) + RFC 5229 (变量) + 常见扩展
 */

{{
  // 辅助函数
  function makeLocation(loc) {
    return {
      start: { offset: loc.start.offset, line: loc.start.line, column: loc.start.column },
      end: { offset: loc.end.offset, line: loc.end.line, column: loc.end.column }
    };
  }

  function buildStringList(first, rest, loc) {
    const values = [first];
    if (rest) {
      for (const item of rest) {
        values.push(item[3]); // 跳过逗号和空白
      }
    }
    return { type: 'StringList', values, location: makeLocation(loc) };
  }

  function buildTestList(first, rest) {
    const tests = [first];
    if (rest) {
      for (const item of rest) {
        tests.push(item[3]);
      }
    }
    return tests;
  }
}}

// ============ 入口 ============

start
  = _ commands:command_list _ {
      return { type: 'SieveScript', commands, location: makeLocation(location()) };
    }

// ============ 命令列表 ============

command_list
  = commands:(command _)* {
      return commands.map(c => c[0]);
    }

// ============ 命令 ============

command
  = require_command
  / if_command
  / stop_command
  / action_command

// ============ Require ============

require_command
  = "require"i _ capabilities:string_or_list _ ";" {
      const caps = capabilities.type === 'StringList'
        ? capabilities.values.map(s => s.value)
        : [capabilities.value];
      return { type: 'RequireCommand', capabilities: caps, location: makeLocation(location()) };
    }

// ============ If/Elsif/Else ============

if_command
  = "if"i _ test:test _ consequent:block alternate:(_ elsif_or_else)? {
      return {
        type: 'IfCommand',
        test,
        consequent,
        alternate: alternate ? alternate[1] : undefined,
        location: makeLocation(location())
      };
    }

elsif_or_else
  = elsif_command
  / else_command

elsif_command
  = "elsif"i _ test:test _ consequent:block alternate:(_ elsif_or_else)? {
      return {
        type: 'ElsIfCommand',
        test,
        consequent,
        alternate: alternate ? alternate[1] : undefined,
        location: makeLocation(location())
      };
    }

else_command
  = "else"i _ consequent:block {
      return { type: 'ElseCommand', consequent, location: makeLocation(location()) };
    }

// ============ Stop ============

stop_command
  = "stop"i _ ";" {
      return { type: 'StopCommand', location: makeLocation(location()) };
    }

// ============ 动作命令 ============

action_command
  = keep_command
  / fileinto_command
  / redirect_command
  / discard_command
  / reject_command
  / set_command
  / vacation_command
  / flag_command
  / notify_command
  / generic_command

keep_command
  = "keep"i flags:(_ ":flags"i _ string_or_list)? _ ";" {
      return {
        type: 'KeepCommand',
        flags: flags ? flags[3] : undefined,
        location: makeLocation(location())
      };
    }

fileinto_command
  = "fileinto"i
    copy:(_ ":copy"i)?
    create:(_ ":create"i)?
    flags:(_ ":flags"i _ string_or_list)?
    _ mailbox:string _ ";" {
      return {
        type: 'FileintoCommand',
        mailbox,
        copy: !!copy,
        create: !!create,
        flags: flags ? flags[3] : undefined,
        location: makeLocation(location())
      };
    }

redirect_command
  = "redirect"i copy:(_ ":copy"i)? _ address:string _ ";" {
      return {
        type: 'RedirectCommand',
        address,
        copy: !!copy,
        location: makeLocation(location())
      };
    }

discard_command
  = "discard"i _ ";" {
      return { type: 'DiscardCommand', location: makeLocation(location()) };
    }

reject_command
  = "reject"i _ reason:string _ ";" {
      return { type: 'RejectCommand', reason, location: makeLocation(location()) };
    }
  / "ereject"i _ reason:string _ ";" {
      return { type: 'RejectCommand', reason, location: makeLocation(location()) };
    }

// RFC 5229 变量扩展
set_command
  = "set"i modifiers:set_modifier* _ name:string _ value:string _ ";" {
      return {
        type: 'SetCommand',
        modifiers,
        name,
        value,
        location: makeLocation(location())
      };
    }

set_modifier
  = _ ":" mod:("lower"i / "upper"i / "lowerfirst"i / "upperfirst"i / "quotewildcard"i / "length"i) {
      return mod.toLowerCase();
    }

// RFC 5230 vacation 扩展
vacation_command
  = "vacation"i
    opts:vacation_option*
    _ reason:string _ ";" {
      const result = {
        type: 'VacationCommand',
        reason,
        location: makeLocation(location())
      };
      for (const opt of opts) {
        Object.assign(result, opt);
      }
      return result;
    }

vacation_option
  = _ ":days"i _ n:number { return { days: n.value }; }
  / _ ":seconds"i _ n:number { return { seconds: n.value }; }
  / _ ":subject"i _ s:string { return { subject: s }; }
  / _ ":from"i _ s:string { return { from: s }; }
  / _ ":addresses"i _ l:string_list { return { addresses: l }; }
  / _ ":mime"i { return { mime: true }; }
  / _ ":handle"i _ s:string { return { handle: s }; }

// RFC 5232 imap4flags 扩展
flag_command
  = action:("setflag"i / "addflag"i / "removeflag"i)
    varname:(_ string)?
    _ flags:string_or_list _ ";" {
      return {
        type: 'FlagCommand',
        action: action.toLowerCase(),
        variablename: varname ? varname[1] : undefined,
        flags: flags.type === 'StringList' ? flags : { type: 'StringList', values: [flags], location: flags.location },
        location: makeLocation(location())
      };
    }

// RFC 5435 notify 扩展
notify_command
  = "notify"i
    opts:notify_option*
    _ method:string _ ";" {
      const result = {
        type: 'NotifyCommand',
        method,
        location: makeLocation(location())
      };
      for (const opt of opts) {
        Object.assign(result, opt);
      }
      return result;
    }

notify_option
  = _ ":options"i _ l:string_list { return { options: l }; }
  / _ ":importance"i _ n:$[123] { return { importance: n }; }
  / _ ":message"i _ s:string { return { message: s }; }

// 通用命令 (支持扩展)
generic_command
  = name:identifier args:(_ argument)* blk:(_ block)? _ ";" {
      return {
        type: 'GenericCommand',
        name,
        arguments: args.map(a => a[1]),
        block: blk ? blk[1] : undefined,
        location: makeLocation(location())
      };
    }

// ============ 测试 ============

test
  = address_test
  / allof_test
  / anyof_test
  / envelope_test
  / exists_test
  / false_test
  / header_test
  / not_test
  / size_test
  / true_test
  / body_test
  / date_test
  / currentdate_test
  / hasflag_test
  / string_test
  / ihave_test
  / duplicate_test
  / generic_test

address_test
  = "address"i
    addrPart:(_ address_part)?
    matchType:(_ match_type)?
    relMatch:(_ relational_match)?
    comp:(_ comparator)?
    _ headers:string_or_list
    _ keys:string_or_list {
      return {
        type: 'AddressTest',
        addressPart: addrPart ? addrPart[1] : undefined,
        matchType: matchType ? matchType[1] : undefined,
        relationalMatch: relMatch ? relMatch[1] : undefined,
        comparator: comp ? comp[1] : undefined,
        headers: headers.type === 'StringList' ? headers : { type: 'StringList', values: [headers], location: headers.location },
        keys: keys.type === 'StringList' ? keys : { type: 'StringList', values: [keys], location: keys.location },
        location: makeLocation(location())
      };
    }

allof_test
  = "allof"i _ "(" _ first:test rest:(_ "," _ test)* _ ")" {
      return { type: 'AllOfTest', tests: buildTestList(first, rest), location: makeLocation(location()) };
    }

anyof_test
  = "anyof"i _ "(" _ first:test rest:(_ "," _ test)* _ ")" {
      return { type: 'AnyOfTest', tests: buildTestList(first, rest), location: makeLocation(location()) };
    }

envelope_test
  = "envelope"i
    addrPart:(_ address_part)?
    matchType:(_ match_type)?
    relMatch:(_ relational_match)?
    comp:(_ comparator)?
    _ parts:string_or_list
    _ keys:string_or_list {
      return {
        type: 'EnvelopeTest',
        addressPart: addrPart ? addrPart[1] : undefined,
        matchType: matchType ? matchType[1] : undefined,
        relationalMatch: relMatch ? relMatch[1] : undefined,
        comparator: comp ? comp[1] : undefined,
        envelopeParts: parts.type === 'StringList' ? parts : { type: 'StringList', values: [parts], location: parts.location },
        keys: keys.type === 'StringList' ? keys : { type: 'StringList', values: [keys], location: keys.location },
        location: makeLocation(location())
      };
    }

exists_test
  = "exists"i _ headers:string_or_list {
      return {
        type: 'ExistsTest',
        headers: headers.type === 'StringList' ? headers : { type: 'StringList', values: [headers], location: headers.location },
        location: makeLocation(location())
      };
    }

false_test
  = "false"i {
      return { type: 'FalseTest', location: makeLocation(location()) };
    }

header_test
  = "header"i
    matchType:(_ match_type)?
    relMatch:(_ relational_match)?
    comp:(_ comparator)?
    _ headers:string_or_list
    _ keys:string_or_list {
      return {
        type: 'HeaderTest',
        matchType: matchType ? matchType[1] : undefined,
        relationalMatch: relMatch ? relMatch[1] : undefined,
        comparator: comp ? comp[1] : undefined,
        headers: headers.type === 'StringList' ? headers : { type: 'StringList', values: [headers], location: headers.location },
        keys: keys.type === 'StringList' ? keys : { type: 'StringList', values: [keys], location: keys.location },
        location: makeLocation(location())
      };
    }

not_test
  = "not"i _ test:test {
      return { type: 'NotTest', test, location: makeLocation(location()) };
    }

size_test
  = "size"i _ over:(":over"i / ":under"i) _ size:number {
      return {
        type: 'SizeTest',
        over: over.toLowerCase() === ':over',
        size,
        location: makeLocation(location())
      };
    }

true_test
  = "true"i {
      return { type: 'TrueTest', location: makeLocation(location()) };
    }

// RFC 5173 body 扩展
body_test
  = "body"i
    transform:(_ body_transform)?
    matchType:(_ match_type)?
    comp:(_ comparator)?
    _ keys:string_or_list {
      const t = transform ? transform[1] : {};
      return {
        type: 'BodyTest',
        bodyTransform: t.bodyTransform,
        contentTypes: t.contentTypes,
        matchType: matchType ? matchType[1] : undefined,
        comparator: comp ? comp[1] : undefined,
        keys: keys.type === 'StringList' ? keys : { type: 'StringList', values: [keys], location: keys.location },
        location: makeLocation(location())
      };
    }

body_transform
  = ":raw"i { return { bodyTransform: 'raw' }; }
  / ":text"i { return { bodyTransform: 'text' }; }
  / ":content"i _ types:string_list { return { bodyTransform: 'content', contentTypes: types }; }

// RFC 5260 date 扩展
date_test
  = "date"i
    zone:(_ ":zone"i _ string)?
    originalzone:(_ ":originalzone"i)?
    matchType:(_ match_type)?
    relMatch:(_ relational_match)?
    comp:(_ comparator)?
    _ header:string
    _ datepart:string
    _ keys:string_or_list {
      return {
        type: 'DateTest',
        header,
        datepart: datepart.value,
        matchType: matchType ? matchType[1] : undefined,
        relationalMatch: relMatch ? relMatch[1] : undefined,
        comparator: comp ? comp[1] : undefined,
        zone: zone ? zone[3] : undefined,
        originalzone: !!originalzone,
        keys: keys.type === 'StringList' ? keys : { type: 'StringList', values: [keys], location: keys.location },
        location: makeLocation(location())
      };
    }

currentdate_test
  = "currentdate"i
    zone:(_ ":zone"i _ string)?
    matchType:(_ match_type)?
    relMatch:(_ relational_match)?
    comp:(_ comparator)?
    _ datepart:string
    _ keys:string_or_list {
      return {
        type: 'CurrentDateTest',
        datepart: datepart.value,
        matchType: matchType ? matchType[1] : undefined,
        relationalMatch: relMatch ? relMatch[1] : undefined,
        comparator: comp ? comp[1] : undefined,
        zone: zone ? zone[3] : undefined,
        keys: keys.type === 'StringList' ? keys : { type: 'StringList', values: [keys], location: keys.location },
        location: makeLocation(location())
      };
    }

// RFC 5232 hasflag
hasflag_test
  = "hasflag"i
    matchType:(_ match_type)?
    comp:(_ comparator)?
    varname:(_ string_list)?
    _ flags:string_or_list {
      return {
        type: 'HasFlagTest',
        matchType: matchType ? matchType[1] : undefined,
        comparator: comp ? comp[1] : undefined,
        variablename: varname ? varname[1] : undefined,
        flags: flags.type === 'StringList' ? flags : { type: 'StringList', values: [flags], location: flags.location },
        location: makeLocation(location())
      };
    }

// RFC 5229 string test
string_test
  = "string"i
    matchType:(_ match_type)?
    relMatch:(_ relational_match)?
    comp:(_ comparator)?
    _ source:string_or_list
    _ keys:string_or_list {
      return {
        type: 'StringTest',
        matchType: matchType ? matchType[1] : undefined,
        relationalMatch: relMatch ? relMatch[1] : undefined,
        comparator: comp ? comp[1] : undefined,
        source: source.type === 'StringList' ? source : { type: 'StringList', values: [source], location: source.location },
        keys: keys.type === 'StringList' ? keys : { type: 'StringList', values: [keys], location: keys.location },
        location: makeLocation(location())
      };
    }

// RFC 5463 ihave
ihave_test
  = "ihave"i _ caps:string_or_list {
      return {
        type: 'IhaveTest',
        capabilities: caps.type === 'StringList' ? caps : { type: 'StringList', values: [caps], location: caps.location },
        location: makeLocation(location())
      };
    }

// RFC 7352 duplicate
duplicate_test
  = "duplicate"i opts:duplicate_option* {
      const result = { type: 'DuplicateTest', location: makeLocation(location()) };
      for (const opt of opts) {
        Object.assign(result, opt);
      }
      return result;
    }

duplicate_option
  = _ ":handle"i _ s:string { return { handle: s }; }
  / _ ":header"i _ s:string { return { header: s }; }
  / _ ":uniqueid"i _ s:string { return { uniqueid: s }; }
  / _ ":seconds"i _ n:number { return { seconds: n.value }; }
  / _ ":last"i { return { last: true }; }

// 通用测试
generic_test
  = name:identifier args:(_ argument)* {
      return {
        type: 'GenericTest',
        name,
        arguments: args.map(a => a[1]),
        location: makeLocation(location())
      };
    }

// ============ 参数类型 ============

address_part
  = ":localpart"i { return 'localpart'; }
  / ":domain"i { return 'domain'; }
  / ":all"i { return 'all'; }

match_type
  = ":is"i { return 'is'; }
  / ":contains"i { return 'contains'; }
  / ":matches"i { return 'matches'; }
  / ":regex"i { return 'regex'; }

relational_match
  = ":value"i _ '"' op:("gt" / "ge" / "lt" / "le" / "eq" / "ne") '"' { return op; }
  / ":count"i _ '"' op:("gt" / "ge" / "lt" / "le" / "eq" / "ne") '"' { return op; }

comparator
  = ":comparator"i _ s:string { return s.value; }

argument
  = tag
  / number
  / string
  / string_list
  / test_list

tag
  = ":" name:identifier {
      return { type: 'Tag', name, location: makeLocation(location()) };
    }

test_list
  = "(" _ first:test rest:(_ "," _ test)* _ ")" {
      return { type: 'TestList', tests: buildTestList(first, rest), location: makeLocation(location()) };
    }

// ============ 块 ============

block
  = "{" _ commands:command_list _ "}" {
      return { type: 'Block', commands, location: makeLocation(location()) };
    }

// ============ 字符串 ============

string_or_list
  = string_list
  / string

string_list
  = "[" _ first:string rest:(_ "," _ string)* _ "]" {
      return buildStringList(first, rest, location());
    }

string
  = quoted_string
  / multiline_string

quoted_string
  = '"' chars:(!'"' ("\\\\" / '\\"' / .))* '"' {
      const value = chars.map(c => {
        if (c[1] === '\\\\') return '\\';
        if (c[1] === '\\"') return '"';
        return c[1];
      }).join('');
      return { type: 'String', value, multiline: false, location: makeLocation(location()) };
    }

multiline_string
  = "text:" _ ("#" [^\n]*)? [\r]? [\n] lines:(!"\n.\n" !"\n.\r\n" .)* ("\n.\n" / "\n.\r\n") {
      const text = lines.map(l => l[2]).join('');
      return { type: 'String', value: text.replace(/^\n/, ''), multiline: true, location: makeLocation(location()) };
    }

// ============ 数字 ============

number
  = digits:$[0-9]+ quantifier:$[KMGkmg]? {
      let value = parseInt(digits, 10);
      const q = quantifier.toUpperCase();
      if (q === 'K') value *= 1024;
      else if (q === 'M') value *= 1024 * 1024;
      else if (q === 'G') value *= 1024 * 1024 * 1024;
      return {
        type: 'Number',
        value,
        quantifier: q || undefined,
        location: makeLocation(location())
      };
    }

// ============ 标识符 ============

identifier
  = $([a-zA-Z_][a-zA-Z0-9_]*)

// ============ 空白和注释 ============

_
  = (whitespace / comment)*

whitespace
  = [ \t\r\n]+

comment
  = hash_comment
  / bracket_comment

hash_comment
  = "#" [^\r\n]* [\r]? [\n]?

bracket_comment
  = "/*" (!"*/" .)* "*/"
