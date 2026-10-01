# 网页互通验证

此目录是可部署至 GitHub Pages 的原生静态页面，无构建工具、无自建服务器。
当前是技术验证版本，不是完整网页版。现有 Swift App 和数据结构未修改。

## 已实现

- 未登录创建本地任务、单个前置任务、完成/重新打开和派生可开始状态。
- 浏览器 localStorage 保存，导出兼容 App 的版本 3 JSON；写入失败不更新内存数据。
- 按需加载 CloudKit JS，使用自己的 Apple 账户访问私有数据库。
- 登录和退出分别持续监听；登录失败后继续监听下一次重试。45 秒未回调显示说明，支持手动重新检查登录状态。内置浏览器弹窗未传回结果时，使用 Safari / Chrome 重试；这属于兼容性排查建议，尚未证明是本次故障原因。
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
