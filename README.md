# CF-Workers-SUB-Modified

基于 [cmliu/CF-Workers-SUB](https://github.com/cmliu/CF-Workers-SUB) 修改的 Cloudflare Workers 订阅聚合与转换工具。

## ⚙ 功能特点

- 🔗 **订阅聚合** - 将多个订阅源合并为一个订阅链接
- 🔄 **格式转换** - 支持 Base64、Clash、Sing-box、Surge、Quantumult X、Loon 等多种格式
- 📱 **多订阅管理** - 支持创建多个独立的子订阅（sub1, sub2...）
- 🌐 **优选 IP** - 支持自定义优选 IP/域名替换节点地址
- 💾 **KV 存储** - 使用 Cloudflare KV 存储配置数据
- 🎨 **现代化 UI** - 响应式设计，支持明暗主题
- 📲 **Telegram 通知** - 支持访问日志推送到 Telegram

---

## 🛠️ Workers 部署方法

### 1. 部署 Cloudflare Worker

- 在 [Cloudflare Worker](https://dash.cloudflare.com/) 控制台中创建一个新的 Worker
- 将 [worker.js](worker.js) 的内容粘贴到 Worker 编辑器中

### 2. 修改订阅入口

例如您的 Workers 项目域名为：`sub.example.workers.dev`

通过修改 `mytoken` 赋值内容，达到修改你专属订阅的入口，避免订阅泄漏：

```javascript
let mytoken = 'auto';  // 修改为你自己的 token
```

如上所示，你的订阅地址则如下：
```
https://sub.example.workers.dev/auto
或
https://sub.example.workers.dev/?token=auto
```

### 3. 添加你的节点或订阅链接

修改 `MainData` 变量中的内容：

```javascript
let MainData = `
vless://...
vmess://...
https://your-subscription-link
`
```

可同时放入多个节点链接与多个订阅链接，链接之间用换行分隔。

> 💡 **推荐**: 添加 KV 命名空间后，可在管理界面直接编辑，变量将不会使用。

---

## 📋 变量说明

| 变量名 | 示例 | 必填 | 备注 |
|--------|------|:----:|------|
| `TOKEN` | `auto` | ✅ | 汇聚订阅的订阅配置路径地址，例如：`/auto` |
| `GUEST` | `test` | ❌ | 汇聚订阅的访客订阅 TOKEN，例如：`/sub?token=test` |
| `LINK` | `vless://...`, `https://sub...` | ❌ | 可同时放入多个节点链接与多个订阅链接，链接之间用换行分隔（添加 KV 命名空间后，可在管理界面直接编辑，变量将不会使用） |
| `TGTOKEN` | `6894123456:xxxxxxxxxx...` | ❌ | 发送 TG 通知的机器人 token |
| `TGID` | `6946912345` | ❌ | 接收 TG 通知的账户数字 ID |
| `SUBNAME` | `CF-Workers-SUB` | ❌ | 订阅名称 |
| `SUBAPI` | `SUBAPI.example.io` | ❌ | clash、singbox 等订阅转换后端 |
| `SUBCONFIG` | `https://raw.github...` | ❌ | clash、singbox 等订阅转换配置文件 |
| `BESTIPURL` | `https://example.com/ip.txt` | ❌ | 优选 IP 列表 URL |
| `CUSTOMHOSTS` | `1.2.3.4, example.com` | ❌ | 自定义 IP/域名列表 |

---

## 📦 KV 存储支持

绑定 KV 命名空间后，支持以下功能：

1. **管理界面编辑** - 在线编辑订阅内容，无需修改代码
2. **多订阅管理** - 支持 `/sub1`、`/sub2` 等多个独立子订阅
3. **配置持久化** - 订阅配置存储在 KV 中，重新部署不丢失

### 绑定 KV 命名空间

1. 在 Workers & Pages 中创建 KV 命名空间
2. 在 Worker 设置中绑定 KV，变量名设为 `KV`

---

## ⚠️ 注意事项

- `TOKEN` 和 `GUEST` 建议使用 UUID 或复杂字符串，防止被猜测
- `TGTOKEN` 和 `TGID` 在使用时需要先到 Telegram 注册并获取：
  - `TGTOKEN` 是 Telegram bot 的凭证（通过 @BotFather 获取）
  - `TGID` 是用来接收通知的 Telegram 用户或群组 ID

---

## 🔧 主要修改

相比原项目，本版本进行了以下修改：

- 移除了部分硬编码的外部资源引用
- 优化了部分代码结构

---

## 📜 许可证

本项目采用 [Apache-2.0](LICENSE) 许可证开源。

---

## 🙏 致谢

- [cmliu/CF-Workers-SUB](https://github.com/cmliu/CF-Workers-SUB) - 原项目
