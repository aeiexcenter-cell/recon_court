# Recon Court

Recon Court 是一个基于 Vue 3 开发的数字化法庭/辩论模拟系统前端项目。它提供了一个沉浸式的交互界面，支持多种角色参与、证据管理、实时对战以及可视化进度跟踪。

## ✨ 核心特性

- **🎭 多角色交互**：支持原告、被告、法官等多种角色的实时对话与辩论。
- **📁 证据管理系统**：侧边栏集成证据列表，支持证据筛选、详细内容查看（包括文档、图片、视频等）。
- **🪟 数字化窗口**：支持可拖拽、可缩放的多任务处理窗口，方便同时查看多份证据或案情摘要。
- **💬 智能对话界面**：集成 Markdown 渲染、思考进度提示（Thinking Indicator）以及中断处理机制。
- **🌓 主题切换**：支持深色/浅色模式切换，适配不同使用场景。
- **⚡ 响应式设计**：侧边栏可调节宽度，灵活适配各种屏幕尺寸。

## 🛠️ 技术栈

- **框架**: [Vue 3 (Composition API)](https://vuejs.org/)
- **状态管理**: [Pinia](https://pinia.vuejs.org/)
- **构建工具**: [Vite](https://vitejs.dev/)
- **样式**: [Tailwind CSS](https://tailwindcss.com/)
- **图标**: [Lucide Vue Next](https://lucide.dev/)
- **类型安全**: [TypeScript](https://www.typescriptlang.org/)
- **其他**: `markdown-it`, `dompurify`, `date-fns`

## 🚀 快速开始

### 预设环境

确保你已安装了 [Node.js](https://nodejs.org/) (建议 v18+) 和 `npm`。

### 安装依赖

```bash
cd recon-court
npm install
```

### 本地开发

启动开发服务器：

```bash
npm run dev
```

### 项目打包

构建生产环境版本：

```bash
npm run build
```

## 📂 项目结构

```text
recon-court/
├── src/
│   ├── components/      # UI 组件（ChatArea, EvidenceWindow, LeftSidebar 等）
│   ├── stores/          # Pinia 状态管理（CourtStore, ThemeStore）
│   ├── data/            # 静态数据与案情配置
│   ├── types/           # TypeScript 类型定义
│   ├── utils/           # 工具函数
│   ├── App.vue          # 根组件
│   └── main.ts          # 入口文件
├── public/              # 静态资源
├── package.json         # 项目配置与依赖
├── tailwind.config.js   # Tailwind 配置
└── vite.config.ts       # Vite 配置
```

## ⚖️ 案情配置

案情数据通常存储在 `src/data/cases` 目录下，通过 `src/data/index.ts` 进行导出和激活。
