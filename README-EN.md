# 🇬🇧 Language Switch | 语言切换

[![中文](https://img.shields.io/badge/中文-README.md-blue)](README.md) | [![English](https://img.shields.io/badge/English-README--EN.md-red)](README-EN.md)

---

# 🎯 Rotating Hexagon Bounce Game

A physics-based bounce ball game developed with React + TypeScript. The ball is affected by gravity and friction forces within a rotating hexagonal container, achieving realistic bouncing effects.

![Game Preview](https://img.shields.io/badge/Status-Running-brightgreen) ![Tech Stack](https://img.shields.io/badge/Tech-React%20%2B%20TypeScript%20%2B%20Vite-blue)

## ✨ Game Features

### 🔬 Realistic Physics Engine
- **Gravity System**: 500 pixels/s² gravitational acceleration
- **Friction Simulation**: 0.98 velocity decay coefficient, simulating air resistance
- **Energy Loss**: 15% energy loss during collisions, simulating real bounces
- **Vector Mathematics**: Complete 2D vector operation system

### 🎮 Interactive Features
- **Click Control**: Click canvas to apply force to the ball
- **Real-time Control Panel**:
  - ⏸️ Pause/Resume functionality
  - 🔄 Rotation speed adjustment (0-0.1 rad/frame)
  - 📐 Hexagon size adjustment (100-280px)
  - ⚽ Ball size adjustment (4-20px)
  - 🔄 Reset ball position

### 🎨 Visual Effects
- **Gradient Background**: Purple gradient theme
- **Glow Effects**: Both hexagon and ball have glow effects
- **Radial Gradient**: 3D stereoscopic ball rendering
- **Smooth Animation**: 60fps smooth animation effects
- **Responsive Design**: Mobile device support

## 🚀 Quick Start

### Requirements
- Node.js 16.0+
- pnpm package manager

### Installation & Running
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build production version
pnpm build

# Preview build result
pnpm preview
```

### Access Game
After starting the development server, access in browser: [http://localhost:5173](http://localhost:5173)

## 🎯 Operation Guide

1. **Click Canvas**: Apply force to the ball, force magnitude and direction depend on click position
2. **Use Control Panel**: Real-time adjustment of physics parameters and game settings
3. **Pause Button**: Pause/resume game anytime to observe effects
4. **Reset Button**: Reset ball to initial position

## 🏗️ Project Structure

```
src/
├── components/
│   └── HexagonBounce.tsx    # Main game component
├── utils/
│   ├── physics.ts           # Physics engine core
│   └── collision.ts         # Collision detection system
├── App.tsx                  # Main app component
├── App.css                  # Game styles
└── main.tsx                 # App entry point
```

## 🔧 Technical Implementation

### Physics Engine Core
- **Vector Operations**: Addition, subtraction, scalar multiplication, dot product, normalization, etc.
- **Collision Detection**: Point-to-line segment distance calculation, hexagon boundary detection
- **Reflection Calculation**: Real bounce based on incident angle and normal vector
- **Constraint System**: Ensures ball always stays within container

### Rendering System
- **Canvas 2D API**: High-performance graphics rendering
- **requestAnimationFrame**: Smooth animation loop
- **Gradient Effects**: Radial and linear gradients
- **Real-time Updates**: 60fps smooth experience

### State Management
- **React Hooks**: useState, useRef, useEffect, useCallback
- **Performance Optimization**: Preventing unnecessary re-renders
- **Memory Management**: Proper cleanup of animation loops

## 🧮 Physics Formulas

### Gravity Update
```typescript
velocity += gravity * deltaTime
position += velocity * deltaTime
```

### Friction Application
```typescript
velocity *= frictionCoefficient
```

### Vector Reflection
```typescript
reflected = incident - 2 * dot(incident, normal) * normal
```

## 🛠️ Development Tools

- **React 19.1.1** - UI Framework
- **TypeScript 5.8.3** - Type Safety
- **Vite 7.1.2** - Build Tool
- **ESLint** - Code Quality
- **pnpm** - Package Manager

## 🤝 Contributing Guidelines

Welcome to submit Issues and Pull Requests!

1. Fork this repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Submit Pull Request

## 📄 Open Source License

This project uses MIT License - see [LICENSE](LICENSE) file for details

## 🎮 Game Screenshots

When the game is running, you will see:
- Elegant purple gradient background
- Rotating green hexagonal container
- Orange-red stereoscopic ball
- Real-time control panel on the right

---

**Enjoy the physics bounce ball fun!** 🎯✨