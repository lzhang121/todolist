# TodoList

零构建的静态待办清单页面，数据保存在浏览器 `localStorage`。

## 功能

- 添加、完成、删除待办（可选截止日期）
- 筛选：全部 / 未完成 / 已完成
- 清除已完成
- 情境化空状态与示例待办
- 删除后 5 秒内撤销
- 新增项高亮动画
- 存储自动降级（localStorage → sessionStorage → 当前会话内存）
- 跟随系统的暗色模式
- 基础无障碍（键盘、屏幕阅读器、减少动效）

## 本地运行

在项目目录执行：

```bash
python3 -m http.server 8080
```

浏览器打开 `http://localhost:8080`，或直接双击打开 `index.html`。若浏览器禁止持久化存储，页面会自动降级到 `sessionStorage` 或仅当前标签页内存，不再弹出告警条。

## 浏览器要求

- 支持 ES6+ JavaScript
- 支持 `localStorage`（用于持久化待办）

## 文件说明

| 文件 | 说明 |
|------|------|
| `index.html` | 页面结构 |
| `script.js` | 逻辑与交互 |
| `style.css` | 样式与暗色主题 |

数据存储键名：`todolist.items.v1`。
