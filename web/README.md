# 网页互通验证

版本 `20261001-9` 增加 `rest-auth.html` 独立认证页：不加载 SDK，先获取登录地址，随后只用新的回调 Token 发一次 `/users/current` 请求。校验 Apple 消息来源和弹窗 source，不读取或修改任务、不保存凭据、不自动重试。请独立打开此页测试，使用原 Web API Token（Post Message 回调）。此前复用 SDK 会话的验证不作为独立证据。页面语法检查和原有回归通过，真实 REST 认证待用户部署并登录验证。

此目录是可部署至 GitHub Pages 的原生静态页面，无构建工具、无自建服务器。
当前是技术验证版本，不是完整网页版。现有 Swift App 和数据结构未修改。

## 已实现

- 未登录创建本地任务、单个前置任务、完成/重新打开和派生可开始状态。
- 浏览器 localStorage 保存，导出兼容 App 的版本 3 JSON；写入失败不更新内存数据。
- 按需加载 CloudKit JS，使用自己的 Apple 账户访问私有数据库。
- 登录和退出分别持续监听；登录失败后继续监听下一次重试。45 秒未确认显示说明。
- 版本 `20261001-8`：认证完全由 SDK 管理。回调诊断仅观察，不读 SDK 会话、不自动调用用户确认、不复用会话执行 REST；移除手动检查，避免与 SDK 认证并发。初始化结果在登录/退出事件发生后不覆盖事件状态。
- 之前版本的 SDK + REST 交叉验证复用同一会话，不是独立认证证据。当前未实现独立 REST 登录，真实登录故障仍待部署后验证。
- 读取 Core Data 自定义区域全部分页，显示任务、依赖数量及字段类型诊断。
- 仅开发环境修改已存在的 `CD_TaskRecord.CD_title`，携带 recordChangeTag；冲突时报错，不强制覆盖。
- 标签和其他字段不参与写入。Asset 标题拒绝修改。退出登录立即清除云端显示，异步旧请求不重新显示上一账号数据。

尚未实现：自动同步队列、登录时本地合并、云端创建/删除、多前置编辑、图视图、JSON 导入、IndexedDB、PWA 离线缓存。网页自身仍需联网加载，当前仅本地数据可在页面已打开后离线操作。

## 本地运行

在项目根目录执行 `python3 -m http.server 8080 --bind 127.0.0.1 --directory web`，打开 http://127.0.0.1:8080 。

逻辑检查：`node web/core.test.mjs`。测试使用模拟响应，不证明真实 iCloud 互通。

## CloudKit 配置与真实验收

1. 在 CloudKit Console 选择 `iCloud.DAGTodo` 的 Development 环境，确认 App 已上传测试任务。
2. 创建 **Web API Token** 并设置允许的网页 origin / 登录回跳地址（根据 Console 字段填写）。本地使用 `http://127.0.0.1:8080`；Pages 使用 `https://scorpioq.github.io`，页面路径为 `/DAGTodo/`。
3. 在验证页粘贴 Web API Token，启用登录。Token 仅在内存里用于 SDK 配置，不保存到仓库或浏览器存储；不使用 server-to-server 私钥。用户密码仅输入 Apple 官方登录页。
4. 使用与 App 相同的 Apple 账户登录，读取任务。确认标题正确、任务/依赖数匹配，检查 `CD_tags` 类型（SwiftData 数组可能是 Transformable/BYTES，不能直接当字符串数组处理）。
5. 选中测试任务修改标题，在 iPhone / Mac App 检查是否更新，确认 note、tags、priority、依赖均未变化。
6. App 再修改标题，网页重新读取确认；两端同时修改同一记录，验证旧 recordChangeTag 被拒绝，网页不覆盖较新记录。
7. 退出并换账号，确认上一账号任务不显示。本地任务保持设备级独立，在此阶段不合并至任何账号。

未获得 Web API Token 和用户登录前，无法验收真实互通。不得将模拟测试结果写成同步验收通过。

## GitHub Pages

已提供 `.github/workflows/web-pages.yml`，手动触发运行检查并发布 `web/`。仓库 Settings → Pages → Source 选择 GitHub Actions，推送后在 Actions 手动运行 Publish web probe to GitHub Pages。不要把现有原生项目的 `docs/` 文档目录改成站点。
本轮未推送、未配置 GitHub 仓库 Pages 设置、未发布。

## 依据

- [CloudKit JS](https://developer.apple.com/documentation/cloudkitjs)
- [Core Data 记录映射](https://developer.apple.com/documentation/coredata/reading-cloudkit-records-for-core-data)：`CD_` 类型和属性、UUID 为字符串、Transformable 为二进制、长文本转为 Asset。
- [区域增量读取](https://developer.apple.com/documentation/cloudkitjs/cloudkit.database/fetchrecordzonechanges)：从无 token 开始并完整读取分页。
- [保存记录](https://developer.apple.com/documentation/cloudkitjs/cloudkit.database/saverecords)：已有记录携带 recordChangeTag。
