em
==

enterprise middle page framework

em 具有如下特性：

- 首屏和ajax模板合一，只需维护一套模板。
- 通过hash维护页面状态，hash change自动触发页面局部重绘
- 封装hash change，支持浏览器前进后退
- 提供事件代理，支持通过sizzle选择器来绑定事件代理
- 自动merge  A标签的hash跳转到全局hash状态池
- 提供注册模板机制，ajax自动build queryString加载后端模板

    一下代码借鉴自er
    src/ajax.js
    src/Deferred.js
    src/assert.js
    src/locator.js
