# @deepseek-ai/dsh-ide-bridge-app

**Bundle 安装层**（几乎无运行时代码，只有 patch 清单）。

## 职责

- 在 `package.json` 声明 `dsh.bundle.patch` → `./cordis.patch.yml`
- patch **insert** 两个 Cordis 插件行：
  - `@deepseek-ai/dsh-ide-bridge`（Host）
  - `@deepseek-ai/dsh-client-ui-ide-bridge`（Client UI）

`dsh plugin add` 只把**声明了 `dsh.bundle` 的包**加入 profile 的 bundles 列表；patch 里引用的 Host/Client 包名必须在 profile 的 `node_modules` 里也能解析。

## 为何单独成包

DSH 的安装单元是 **bundle 包**，不是「一个 zip 里塞所有源码」。Host 与 Client 各是一个 npm 包、两种构建产物；bundle 只负责「装到 web profile 时要叠哪几行插件」。

## cordis.patch.yml

```yaml
- insert:
    - id: ide-bridge
      name: '@deepseek-ai/dsh-ide-bridge'
    - id: ui-ide-bridge
      name: '@deepseek-ai/dsh-client-ui-ide-bridge'
```

## 安装到 profile（三个包都要进 node_modules）

```powershell
dsh plugin --profile web add ..\ide-bridge
dsh plugin --profile web add ..\client-ui-ide-bridge
dsh plugin --profile web add .
```

最后一行在 `packages/ide-bridge-app` 目录执行，或写绝对路径。仅 add bundle 而不 add Host/Client 会导致启动时报 `Cannot find package '@deepseek-ai/dsh-ide-bridge'`。

## 编译

`pnpm run build:host` 会生成占位 `lib/index.js`（`export {}`）；真正逻辑在 sibling 包。

## 相关文档

- 仓库根 [README.md](../../README.md)
- [../ide-bridge/README.md](../ide-bridge/README.md)
- [../client-ui-ide-bridge/README.md](../client-ui-ide-bridge/README.md)
