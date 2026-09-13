# @deepseek-ai/dsh-ide-bridge

**Host 插件**（Node，跑在 `dsh --profile web` 进程里）。

## 职责

- 扫描 `$DSH_HOME/ide/*.lock`，选择最新且 PID 仍存活的 lock
- 用 lock 里的 `port` / `authToken` 连接 **dsh-ide-vscode** 的 loopback WebSocket
- 消费 `hello`（`ideId` / `ideName`）与 `snapshot` / `event`（editor 源）
- 通过 Typert Remote 暴露 `ideBridge/getContext`
- 注册 runtime context `ide:editor`：发消息时把当前文件、1-based 行列和选区文本注入模型上下文（未连接或无文件则为空）

## 为何单独成包

Host 面需要 `ws`、读磁盘、Typert Host 生成物，**不能**与浏览器 Client 打在同一 npm 包里。DSH 约定：一个 Cordis 插件行对应一个可独立解析的包。

## 数据流

```text
$DSH_HOME/ide/{port}.lock
    → IdeWsClient (auth + snapshot)
    → IdeBridgeContext
    → Remote getContext
    → systemPrompt.context ide:editor
```

## 编译

在仓库根目录执行 `pnpm run build:host`（会先 `tsc` 本包，再 `emit-typert`，再 tsdown 出 `lib/index.js`）。

## 产物

| 路径 | 用途 |
|------|------|
| `lib/index.js` | Cordis 加载的 Host 入口 |
| `lib/typert.remote-client.js` | Client UI `$mount` 用的 Remote 描述符 |
| `lib/types/` | 类型与 `./types` 导出 |

## 运行时依赖

`peerDependencies`：`@deepseek-ai/cordis`、`dsh-home-paths`、`dsh-system-prompt`、`dsh-typert-protocol`（由已安装的 `dsh` profile 提供）。

`devDependencies` 仅用于**本机编译**（经 `pnpm-workspace.yaml` overrides → `./harness`），不是 profile 安装时的运行时来源。

## 相关文档

- 仓库根 [README.md](../../README.md) — monorepo 总览与安装
- [../ide-bridge-app/README.md](../ide-bridge-app/README.md) — patch 如何把本包 insert 进 profile
- 扩展协议：同级目录 `../dsh-ide-vscode/docs/`（若 checkout 在同一父目录下）
