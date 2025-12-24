# FilterForge

Sieve (RFC 5228/5229) 可视化解析与表单驱动编辑器。

## 功能特性

- **解析器** - 将 Sieve 脚本解析为 AST，支持树形视图、JSON 视图和代码重新生成
- **可视化编辑器** - 通过表单创建和编辑 Sieve 过滤规则，无需手写代码
- **代码生成** - 自动生成格式化的 Sieve 脚本，包含正确的 `require` 语句
- **导入/导出** - 支持 `.sieve` 文件的导入和导出
- **本地存储** - 编辑器状态自动保存到浏览器
- **暗色主题** - 支持浅色/深色/跟随系统三种主题模式

## 支持的扩展

| RFC | 扩展名 | 功能 |
|-----|--------|------|
| 5228 | core | 核心语言 |
| 5229 | variables | 变量支持 |
| 5173 | body | 邮件正文测试 |
| 5230 | vacation | 自动回复 |
| 5231 | relational | 关系比较 |
| 5232 | imap4flags | IMAP 标记操作 |
| 5233 | subaddress | 子地址解析 |
| 5260 | date | 日期测试 |
| 5293 | editheader | 邮件头编辑 |
| 5429 | reject | 拒绝邮件 |
| 5435 | notify | 通知扩展 |
| 5463 | ihave | 能力检测 |
| 7352 | duplicate | 重复检测 |
| draft | regex | 正则表达式 |

## 技术栈

- React 19 + TypeScript
- React Router v7
- TailwindCSS v4
- Peggy (PEG 解析器生成器)
- Vite 7
- Biome (Lint/Format)

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 代码检查
pnpm lint

# 代码格式化
pnpm format
```

## 参考资源

- [RFC 5228 - Sieve 核心规范](https://www.rfc-editor.org/rfc/rfc5228)
- [RFC 5229 - 变量扩展](https://datatracker.ietf.org/doc/rfc5229/)
- [IANA Sieve 扩展注册表](https://www.iana.org/assignments/sieve-extensions)

## License

MIT
