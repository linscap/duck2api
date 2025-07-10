# DuckDuckGo to OpenAI API Proxy

🦆 一个基于 Deno 部署的 DuckDuckGo AI 转 OpenAI API 格式的兼容层服务

## ✨ 特性

- 🔄 **流式与非流式支持** - 完全兼容 OpenAI API 的流式和非流式响应
- 🚀 **重试机制** - 针对 418/429 状态码实现单次重试，提高服务稳定性
- 🔐 **动态加密绕过** - 使用 jsdom 技术绕过新版动态 JS 加密限制
- 💾 **Hash 缓存** - 内置Hash缓存，
- 🛠️ **零配置部署** - 支持环境变量配置，开箱即用

## 🚀 快速开始

### 环境变量配置

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `BASE_URL` | DuckDuckGo 反代 URL（可选） | `https://duckduckgo.com` |
| `TOKEN` | 访问令牌（可选） | 空 |

### 部署方式

```bash
# 克隆项目
git clone <repository-url>

# 使用 Deno 运行
deno run --allow-net --allow-env main.ts
# 或者 deployctl deploy --prod 部署到云端
```

## 🔧 不支持

- [ ] **大并发支持** - 沉浸式绕路
- [ ] **多Hash缓存** - 没必要


## ⚠️ 注意事项

- 服务仅供学习和研究使用