# 大學神隊友 - Re-app (React 現代化版本)

![Version](https://img.shields.io/badge/Version-v1.0.0--alpha-orange.svg)![Framework](https://img.shields.io/badge/Framework-React%20v18-61dafb.svg)![Build Tool](https://img.shields.io/badge/Build%20Tool-Vite-646cff.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

**大學神隊友 - Re-app** 是原本「大學神隊友」系統的 React 現代化重構版本。
我們採用了 **React 18** 與 **Vite** 作為核心引擎，將原有的 Vanilla JS 架構遷移至更具擴充性、維護性與開發效率的元件化架構。

> [!TIP]
> 目前本分支處於 **Pre-release (alpha)** 階段，正逐步將原系統功能進行模組化遷移。

## 📊 重構核心目標

* **🧩 元件化架構：** 將頁面拆解為可復用的 React Components，提升代碼自描述性。
* **⚡ 極速開發體驗：** 利用 Vite 的 HMR (Hot Module Replacement) 實現秒級熱更新。
* **🔄 狀態管理優化：** 導入 React Context API 處理全域狀態（如使用者登錄、深色模式）。
* **🎨 樣式繼承與升級：** 完美繼承原版的視覺美學，並優化 CSS 管理架構。

## 🛠️ 技術棧 (Tech Stack)

* **核心框架：** React 18
* **建構工具：** Vite
* **資料庫與驗證：** Google Firebase (Auth, Firestore)
* **CSS 管理：** Vanilla CSS (維持高效性能與靈活設計)
* **Linting：** ESLint & React Compiler (實驗中)

## 📂 專案結構 (Project Structure)

```text
Re-app/
├── public/              # 靜態資源
├── src/
│   ├── assets/          # 圖片、圖標資源
│   ├── components/      # [通用元件] Button, Input, Modal, Sidebar
│   ├── pages/           # [頁面級別元件] Dashboard, Landing, Settings
│   ├── context/         # React Context (全域狀態管理)
│   ├── firebase.js      # Firebase 初始化配置
│   ├── App.jsx          # 主路由與應用入口
│   ├── main.jsx         # 渲染掛載點
│   └── *.css            # 繼承原版並優化後的模組化樣式
├── index.html           # SPA 單頁應用入口
├── vite.config.js       # Vite 配置
└── package.json         # 依賴管理與腳本指令
```

## 🚀 快速開發 (Quick Start)

1. **安裝依賴：**
   ```bash
   npm install
   ```
2. **填寫金鑰：**
   編輯 `src/firebase.js` 並填入你的 Firebase API Key。
3. **啟動開發伺服器：**
   ```bash
   npm run dev
   ```
4. **構建生產版本：**
   ```bash
   npm run build
   ```

## 🏷️ 開發規範

本專案遵循與主專案一致的 **約定式提交 (Conventional Commits)** 規範。

**常用類型對照表：**
* **`feat`**: 新增 React 元件或功能。
* **`fix`**: 修復 React 渲染或邏輯錯誤。
* **`refactor`**: 代碼重構（非功能性修改）。
* **`style`**: 修改 CSS 樣式。
* **`chore`**: 修改 package.json 或 Vite 設定。

---
Produced by **Huang Zhaohong**
