import './App.css'
import HexagonBounce from './components/HexagonBounce'

/**
 * 主应用组件
 */
function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>旋转六边形弹球游戏</h1>
        <p>在旋转的六边形内体验真实物理效果的弹球</p>
      </header>
      <main className="app-main">
        <HexagonBounce />
      </main>
    </div>
  )
}

export default App
