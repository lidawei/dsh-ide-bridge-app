# @deepseek-ai/dsh-client-ui-ide-bridge

**Web Client 插件**（浏览器 bundle，由 Cordis Client 加载）。

## 职责

- 在插件内 `ctx.remote.$mount(ideBridgeRemote)`，**不**依赖 harness `api/remotes` 预注册（与 `client-ui-agent-team` 相同）
- 注册 slot `conversation.composer.dock`（composer 下方、统计行上方）
- 每秒轮询 `ideBridge/getContext`，展示 `VSCode - 相对路径 起始行:结束行` 与 IDE 图标

## 为何单独成包

Client 面是 React + CSS Modules + tsdown 浏览器 bundle（`lib/client.js`），构建链与 Host 完全不同，且禁止把 Node-only 依赖打进浏览器包。

## 入口

| 导出 | 加载方 |
|------|--------|
| `./client` | Cordis Client `apply()` |
| `@deepseek-ai/dsh-ide-bridge/remote` | 由本包 import，随 `$mount` 注册 |

## 编译

在仓库根目录执行 `pnpm run build:client`（`tsc` → tsdown `scripts/build-client-tsdown.config.ts`）。

## 产物

- `lib/client.js` — 浏览器插件 bundle
- `lib/index.js` — 占位（Cordis 元数据）

## 运行时依赖

`peerDependencies`：`dsh-client-ui-conversation`、`dsh-client-ui-slots`、`dsh-api-remotes` 等（web profile 已带的 Client 栈）。

## 相关文档

- 仓库根 [README.md](../../README.md)
- [../ide-bridge/README.md](../ide-bridge/README.md) — Remote 数据来源
