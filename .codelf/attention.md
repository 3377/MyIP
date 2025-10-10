## Development Guidelines

### Framework and Language
> 本项目基于原生JavaScript + jQuery开发，使用Bootstrap作为UI框架，部署在Cloudflare Pages上

**Framework Considerations:**
- Version Compatibility: Bootstrap 5.1.3 + jQuery 3.6.0，确保CDN资源可用性
- Feature Usage: 充分利用Cloudflare Pages Functions实现Serverless API
- Performance Patterns: 使用Promise.allSettled并行调用多个API，减少等待时间
- Upgrade Strategy: 保持CDN版本锁定，避免自动升级导致的兼容性问题
- Importance Notes for Framework: 
	* Cloudflare Pages Functions的文件路径结构决定了API路由
	* jQuery主要用于DOM操作，考虑未来迁移到原生JS或Vue/React
	* Bootstrap提供响应式布局，需特别注意移动端适配

**Language Best Practices:**
- Type Safety: Use strong typing where available to prevent runtime errors
- Modern Features: Utilize modern language features while maintaining compatibility
- Consistency: Apply consistent coding patterns throughout the codebase

### Code Abstraction and Reusability
> During development, prioritize code abstraction and reusability to ensure modular and component-based functionality. Try to search for existing solutions before reinventing the wheel.
> List below the directory structure of common components, utility functions, and API encapsulations in the current project.


**Modular Design Principles:**
- Single Responsibility: Each module is responsible for only one functionality
- High Cohesion, Low Coupling: Related functions are centralized, reducing dependencies between modules
- Stable Interfaces: Expose stable interfaces externally while internal implementations can vary

**Reusable Component Library:**
```
root
- pages/assets/js
    - main.js 包含的可复用函数：
        - createInfoItem() // 创建信息展示行
        - updateTime() // 更新时间显示
        - formatDate() // 格式化日期
        - copyIP() // 复制功能（全局函数）
        - updateLocationInfo() // 更新位置信息
        - fetchIPInfo() // IP信息查询
        - fetchPublicIP() // 公网IP获取
- functions/_api
    - 可复用的API模式，每个API都包含访问控制和错误处理
```

### Coding Standards and Tools
**Code Formatting Tools:**
- 本项目暂未使用代码格式化工具
- 建议未来添加：ESLint + Prettier

**Naming and Structure Conventions:**
- Semantic Naming: 变量/函数名应清楚表达其目的
- Consistent Naming Style: JavaScript使用camelCase，CSS使用kebab-case
- Directory Structure: functions/_api为API路由，pages为前端页面

### Mobile Responsiveness (重要)
**移动端适配原则：**
- 使用@media (max-width: 768px)进行移动端样式适配
- 所有position: absolute元素需要在移动端重新验证定位
- Tooltip等浮层组件需考虑小屏幕的显示问题
- 文本溢出使用text-overflow: ellipsis时，需确保父元素position: relative

**已知移动端问题和解决方案：**
- ✅ Tooltip定位问题：使用right对齐代替居中对齐，避免超出屏幕
- ⚠️ 长地址显示：使用ellipsis截断，点击可复制完整内容
- ⚠️ 时间格式：移动端简化显示（MM-DD HH:mm:ss而非完整日期）

### Frontend-Backend Collaboration Standards
**API Design and Documentation:**
- 本项目使用Cloudflare Pages Functions实现Serverless API
- API路径格式：`/_api/{function-name}`
- 所有API使用GET方法，参数通过query string传递
- 统一返回JSON格式：`{success: boolean, ...data}`

**当前API列表：**
- `/_api/ip-info?ip={ip}` - 获取IP基本信息（含访问控制）
- `/_api/all-location?ip={ip}` - 获取完整位置信息（美团+腾讯地图）
- `/_api/public-ip` - 获取公网IP（备用）

**Data Flow:**
- 前端使用jQuery进行AJAX请求，未使用状态管理库
- 使用Promise.allSettled并行调用多个API
- 先显示基础信息，位置信息异步更新（渐进式加载）
- 数据验证主要在后端进行，前端做基本格式检查

### Performance and Security
**Performance Optimization Focus:**
- 并行API调用：使用Promise.allSettled同时获取多个数据源
- 渐进式加载：先显示基础信息，位置信息异步更新
- CDN加速：所有外部资源通过CDN加载（Bootstrap、jQuery、字体）
- 节流机制：时间更新每秒一次，主题检查每小时一次

**Security Measures:**
- API访问控制：使用Cloudflare KV实现访问频率限制（每IP每天3次）
- 白名单机制：支持IP和域名白名单（通过环境变量配置）
- 敏感信息保护：
	* 腾讯地图API Key通过环境变量配置，不硬编码
	* 前端展示的Key为占位符，实际Key在后端使用
- HTTPS强制：Cloudflare Pages默认启用HTTPS
- CORS控制：API仅允许特定来源访问

**注意事项：**
- ⚠️ 前端的window.TENCENT_MAP_KEY仅为占位符，实际API调用在后端
- ⚠️ 访问控制依赖Cloudflare KV，需确保正确绑定
- ⚠️ 环境变量需在Cloudflare Pages设置中配置