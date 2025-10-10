## 2025-10-10 22:30:00

### 1. 修复手机端"已复制"提示框显示问题（第二次修复）

**Change Type**: fix

> **Purpose**: 彻底解决手机端tooltip被裁剪和一闪而过的问题
> **Detailed Description**: 第一次修复后发现tooltip仍然被父元素的`overflow: hidden`裁剪。本次修复通过以下方式彻底解决：
>   1. 在移动端为`.info-row`设置`overflow: visible !important`，解除对子元素的裁剪
>   2. 为`.copyable-value`和`.ip-value`设置`overflow: visible !important`
>   3. 将tooltip显示时间从1.5秒延长到2秒，避免"一闪而过"
>   4. 优化tooltip在移动端的定位：右对齐（`right: -10px`），避免超出屏幕
>   5. 设置`min-width: 70px`确保tooltip内容完整显示
> **Reason for Change**: 用户反馈tooltip"一闪而过"且"并没有完整显示出来"，根本原因是父元素的overflow属性导致tooltip被裁剪
> **Impact Scope**: 
>   - 仅影响移动端（max-width: 768px）
>   - 解决了tooltip被裁剪的问题
>   - 延长了显示时间提升用户体验
>   - PC端不受影响
> **API Changes**: 无
> **Configuration Changes**: 无
> **Performance Impact**: 无性能影响

   ```
   root
   - pages
    - assets
     - css
      - styles.css              // fix - 移动端tooltip裁剪问题
        + 添加.info-row { overflow: visible !important; }
        + 添加.copyable-value和.ip-value { overflow: visible !important; }
        + 修改.copy-tooltip移动端样式：right: -10px, top: -40px
        + 添加min-width: 70px确保完整显示
     - js
      - main.js                 // fix - 延长tooltip显示时间
        + 将setTimeout时间从1500ms改为2000ms
        + 移除了fixed定位的动态计算逻辑（不再需要）
   ```