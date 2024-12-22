# IP 信息聚合服务

这是一个基于 Cloudflare Pages 的 IP 信息聚合服务，可以获取访问者的 IP 地址并提供详细的地理位置信息。

## 功能特点

- 获取访问者真实 IP 地址
- 提供多种格式的地理位置信息
- 集成多个地图服务（美团、腾讯地图）
- 内置 API 访问控制
- 支持 IP 查询和地理位置反查
- 美观的用户界面

## 部署说明

### 1. 环境要求

- Cloudflare 账号
- 腾讯地图 API 密钥

### 2. 部署步骤

1. Fork 或克隆本仓库
2. 在 Cloudflare Pages 中创建新项目
3. 连接您的 Git 仓库
4. 配置环境变量：
   - `TENCENT_MAP_KEY`：腾讯地图 API 密钥
   - `ALLOWED_IPS`：允许的 IP 列表（可选）
   - `ALLOWED_DOMAINS`：允许的域名列表（可选）
5. 创建 KV 命名空间：
   - 在 Cloudflare 中创建一个新的 KV 命名空间
   - 将其绑定到项目，变量名为 `IP_ACCESS_KV`

### 3. 配置说明

1. 修改 `index.html` 中的腾讯地图 KEY：

```html
<script>
  window.TENCENT_MAP_KEY = "您的腾讯地图KEY";
</script>
```

2. 配置访问控制（可选）：
   - 在环境变量中设置 `ALLOWED_IPS`，格式：`ip1,ip2,ip3`
   - 在环境变量中设置 `ALLOWED_DOMAINS`，格式：`domain1.com,domain2.com`

## API 使用说明

### 位置信息查询 API

**请求地址：** `/_api/all-location`

**请求方法：** GET

**请求参数：**

- `ip`：要查询的 IP 地址（必填）

**返回示例：**

```json
{
  "success": true,
  "lat": "39.909187",
  "lng": "116.397451",
  "locations": {
    "locationA": "北京市-朝阳区",
    "locationB": "北京市朝阳区三里屯",
    "recommend": "北京市朝阳区三里屯太古里",
    "standard_address": "北京市朝阳区三里屯路19号"
  }
}
```

### 访问控制说明

1. 同一 Cloudflare Pages 项目内的请求自动获得授权
2. 白名单中的 IP 和域名可以无限制访问
3. 其他访问者每天最多可以请求 3 次
4. 超出限制后需要联系管理员获取授权

## 技术栈

- Cloudflare Pages
- Cloudflare Workers
- Cloudflare KV Storage
- JavaScript/HTML/CSS
- 美团地图 API
- 腾讯地图 API

## 注意事项

1. 请确保正确配置腾讯地图 API 密钥
2. API 访问控制默认开启，可通过环境变量配置白名单
3. 建议在生产环境中设置允许的域名列表
4. 如需商业使用，请确保符合各地图服务的使用条 ���

## 联系方式

如需帮助或获取 API 授权，请联系：

- QQ：35794406

## 许可证

MIT License
