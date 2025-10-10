## IP 信息聚合服务 (辰星IP聚合)

> 基于 Cloudflare Pages 的 IP 信息聚合服务，可以获取访问者的 IP 地址并提供详细的地理位置信息

> 为用户提供完整的IP信息查询，包括地理位置、ISP信息、时区等，并集成多个地图服务API

> 已部署运行中，基于Cloudflare Pages + Workers + KV Storage架构

> 个人开发项目 (QQ: 35794406)

> **技术栈**: Cloudflare Pages/Workers, JavaScript, HTML5, CSS3, Bootstrap 5, jQuery 3.6, 美团地图API, 腾讯地图API



## Dependencies

* Bootstrap (5.1.3): UI框架，提供响应式布局和组件
* jQuery (3.6.0): JavaScript库，用于DOM操作和AJAX请求
* Font Awesome (5.15.4): 图标库
* 钉钉进步体字体: 自定义中文字体
* Google Fonts - Noto Sans SC: 备用中文字体
* 美团地图API: 获取经纬度信息
* 腾讯地图API: 地理位置反查服务
* ITDog API: 出国IP和IPv6信息查询
* 不蒜子: 网站访问统计


## Development Environment

**运行环境要求:**
- Cloudflare 账号（用于部署Pages和Workers）
- 腾讯地图 API 密钥（用于地理位置服务）
- Cloudflare KV 命名空间（用于API访问控制）

**本地开发:**
- 任何支持HTML5的现代浏览器
- 本地Web服务器（如Live Server）

**部署方式:**
- 通过Cloudflare Pages自动部署
- 支持Git仓库连接，自动构建和发布


## Structrue (init from project tree)
> If the number of files is too large, you should at least list all the directories, and provide comments for the parts you consider particularly important.

> In the code block below, add comments to the directories/files to explain their functionality and usage scenarios.

> if you think the directory/file is not important, you can not skip it, just add a simple comment to it.

> but if you think the directory/file is important, you should read the files and add more detail comments on it (e.g. add comments on the functions, classes, and variables. explain the functionality and usage scenarios. write the importance of the directory/file).
```
root
- functions              // Cloudflare Pages Functions目录（Serverless API）
    - _api              // API路由目录
        - all-location.js   // 获取所有位置信息API（美团经纬度+腾讯地图位置反查）
        - ip-info.js        // IP基本信息查询API（含访问控制）
        - public-ip.js      // 获取公网IP的备用API
- pages                 // 前端页面目录
    - assets            // 静态资源
        - css
            - styles.css    // 主样式文件，包含亮色/暗色主题、蜂巢背景、响应式布局
        - js
            - main.js       // 主逻辑文件：IP查询、位置显示、复制功能、主题切换、时间更新
    - index.html        // 主页面：Bootstrap布局、IP信息展示
- README.md             // 项目文档
- .codelf/              // 项目信息管理目录
```
