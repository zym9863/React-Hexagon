# 🎯 旋转六边形弹球游戏

一个基于 React + TypeScript 开发的物理引擎弹球游戏。小球在旋转的六边形容器内受到重力和摩擦力影响，实现逼真的弹跳效果。

![游戏预览](https://img.shields.io/badge/Status-运行中-brightgreen) ![技术栈](https://img.shields.io/badge/Tech-React%20%2B%20TypeScript%20%2B%20Vite-blue)

## ✨ 游戏特性

### 🔬 真实物理引擎
- **重力系统**：500 pixels/s² 的重力加速度
- **摩擦力模拟**：0.98 的速度衰减系数，模拟空气阻力
- **能量损失**：碰撞时 15% 的能量损失，模拟真实反弹
- **向量数学**：完整的 2D 向量运算系统

### 🎮 交互功能
- **点击操控**：点击画布给小球施加力量
- **实时控制面板**：
  - ⏸️ 暂停/继续功能
  - 🔄 旋转速度调节（0-0.1 rad/frame）
  - 📐 六边形大小调节（100-280px）
  - ⚽ 小球大小调节（4-20px）
  - 🔄 重置小球位置

### 🎨 视觉效果
- **渐变背景**：紫色渐变主题
- **发光效果**：六边形和小球都有发光效果
- **径向渐变**：3D 立体感的小球渲染
- **流畅动画**：60fps 的流畅动画效果
- **响应式设计**：支持移动端适配

## 🚀 快速开始

### 环境要求
- Node.js 16.0+
- pnpm 包管理器

### 安装与运行
```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview
```

### 访问游戏
开发服务器启动后，在浏览器中访问：[http://localhost:5173](http://localhost:5173)

## 🎯 操作指南

1. **点击画布**：给小球施加力量，力的大小和方向取决于点击位置
2. **使用控制面板**：实时调节物理参数和游戏设置
3. **暂停按钮**：随时暂停/继续游戏观察效果
4. **重置按钮**：重置小球到初始位置

## 🏗️ 项目结构

```
src/
├── components/
│   └── HexagonBounce.tsx    # 主游戏组件
├── utils/
│   ├── physics.ts           # 物理引擎核心
│   └── collision.ts         # 碰撞检测系统
├── App.tsx                  # 应用主组件
├── App.css                  # 游戏样式
└── main.tsx                 # 应用入口
```

## 🔧 技术实现

### 物理引擎核心
- **向量运算**：加法、减法、数乘、点积、归一化等
- **碰撞检测**：点到线段距离计算，六边形边界检测
- **反射计算**：基于入射角和法向量的真实反弹
- **约束系统**：确保小球始终在容器内部

### 渲染系统
- **Canvas 2D API**：高性能图形渲染
- **requestAnimationFrame**：流畅的动画循环
- **渐变效果**：径向渐变和线性渐变
- **实时更新**：60fps 的流畅体验

### 状态管理
- **React Hooks**：useState、useRef、useEffect、useCallback
- **性能优化**：防止不必要的重渲染
- **内存管理**：正确清理动画循环

## 🧮 物理公式

### 重力更新
```typescript
velocity += gravity * deltaTime
position += velocity * deltaTime
```

### 摩擦力应用
```typescript
velocity *= frictionCoefficient
```

### 向量反射
```typescript
reflected = incident - 2 * dot(incident, normal) * normal
```

## 🛠️ 开发工具

- **React 19.1.1** - UI 框架
- **TypeScript 5.8.3** - 类型安全
- **Vite 7.1.2** - 构建工具
- **ESLint** - 代码质量
- **pnpm** - 包管理器

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 开源协议

本项目采用 MIT 协议 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🎮 游戏截图

游戏运行后您将看到：
- 紫色渐变的优雅背景
- 旋转的绿色六边形容器
- 橙红色的立体感小球
- 右侧的实时控制面板

---

**享受物理弹球的乐趣！** 🎯✨
