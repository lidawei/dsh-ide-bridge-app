# dsh-ide-bridge-app

独立 DSH 插件 monorepo：对接 **dsh-ide-vscode** WebSocket，在 **dsh web** composer 下方显示 VS Code 当前文件与行号。

本仓库与 deepseek-harness **分离**，可单独上库；运行时依赖已安装的 `dsh`，编译时只认仓库根目录的 `./harness` 软链接（指向你 clone 的 harness 源码，不进 git）。Web 侧桥接实现以本仓为准。

## 仓库目录

```text
dsh-ide-bridge-app/
├── package.json / pnpm-workspace.yaml   # 根脚本与 workspace
├── scripts/                             # build:host / build:client、emit-typert
└── packages/
    ├── ide-bridge/           → Host 插件（详见 packages/ide-bridge/README.md）
    ├── client-ui-ide-bridge/ → Web UI 插件（详见 packages/client-ui-ide-bridge/README.md）
    └── ide-bridge-app/       → Bundle patch（详见 packages/ide-bridge-app/README.md）
```

VS Code 扩展 **dsh-ide-vscode** 在**另一 git 仓**，负责 WS + lock；本仓只消费 lock/WS，不包含 `import 'vscode'`。

## 为什么拆成三个包

| 面 | 包 | 运行环境 | 不能合并的原因 |
|----|-----|----------|----------------|
| Host | `ide-bridge` | Node（dsh 进程） | `ws`、读 lock、Typert Host |
| Client | `client-ui-ide-bridge` | 浏览器 | React、CSS Modules、tsdown client bundle |
| 安装层 | `ide-bridge-app` | 无（仅 patch） | `dsh plugin` 只认 `dsh.bundle`；patch insert 两行插件 |

```text
dsh-ide-vscode (扩展, 另一仓)
    WS + $DSH_HOME/ide/*.lock
        ↓
packages/ide-bridge (Host) → ideBridge/getContext
        ↓
packages/client-ui-ide-bridge (Web UI, slot composer.dock)
        ↑
packages/ide-bridge-app (cordis.patch.yml 叠层)
```

Client UI 自行 `$mount` Remote（与 harness `client-ui-agent-team` 相同），**无需改** harness `api/remotes`。

## 前置条件

- Node 22+、pnpm
- 已安装可运行的 `dsh`（运行时从 web profile 解析 `@deepseek-ai/*`，不依赖本仓里的 harness 链接）

### 必须先 clone deepseek-harness 源码

本仓**不能**单独完成编译：`@deepseek-ai/cordis`、Typert、Client UI slot 等包未以本机开发版本发布到 npm，`pnpm install` / `tsc` / `emit-typert` 都要从 **deepseek-harness 源码树**里取类型、生成器和编译期实现。

因此需要另 clone 一份 [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)：

```powershell
git clone https://github.com/deepseek-ai/deepseek-harness.git
```

再在本仓根目录建 `./harness` 软链接（Windows 用 junction），指向这份 checkout。编译和 pnpm overrides 都只认这个链接，不再另配一份路径：

```powershell
New-Item -ItemType Junction -Path harness -Target <path-to-deepseek-harness>
```

`./harness` 不进 git，**不是**把 harness 源码拷进本仓。可选：设 `DSH_HARNESS_ROOT` 后跑 `node scripts/ensure-harness-link.mjs`，由脚本创建该链接。

## 编译

在本仓根目录：

```powershell
pnpm install
pnpm run build
```

分步：`pnpm run build:host`（Host + bundle 占位）、`pnpm run build:client`（浏览器 bundle）。

产物：

- `packages/ide-bridge/lib/index.js`、`typert.remote-client.js`
- `packages/client-ui-ide-bridge/lib/client.js`
- `packages/ide-bridge-app/lib/index.js`

## 安装到 web profile

**三个包**都要进 `$DSH_HOME/profiles/web/node_modules`（仅 add bundle 不够）：

```powershell
dsh plugin --profile web add .\packages\ide-bridge
dsh plugin --profile web add .\packages\client-ui-ide-bridge
dsh plugin --profile web add .\packages\ide-bridge-app
```

卸载 bundle：`dsh plugin --profile web remove @deepseek-ai/dsh-ide-bridge-app`（Host/Client 依赖可再 `remove`）。

## 使用

1. 编译并安装 **dsh-ide-vscode**，Reload Window（写 lock，`ideId: vscode`）
2. `pnpm run build` 后重启 `dsh --profile web`，浏览器强刷
3. Composer 下方一行示例：`VSCode - packages/foo.ts 10:12`（悬停见完整路径）

## 开发说明

- 编译只认根目录 `./harness` 软链接；`pnpm-workspace.yaml` 的 `overrides` 也指向它
- `pnpm-workspace.yaml` 里 `autoInstallPeers: false` 避免去 npm 拉未发布的 harness 版本；`excludeLinksFromLockfile: true` 避免 lock 写入开发机上的 checkout 路径
- 改 Host → `build:host`；改 UI → `build:client`；改 patch → 重启 dsh

## Remote API

`ideBridge/getContext` 含 `ideId` / `ideName`（来自 lock 与 WS `hello`）、`editor`（1-based 行号，`selectionEndLine` 为选区结束行）。

```json
{
  "connected": true,
  "ideId": "vscode",
  "ideName": "Visual Studio Code",
  "editor": {
    "relativePath": "src/index.ts",
    "line": 10,
    "selectionEndLine": 12
  }
}
```
