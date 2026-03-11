import { HashRouter } from 'react-router-dom'
import BackHandler from './components/BackHandler'
import AnimatedRoutes from './components/AnimatedRoutes'
import ErrorBoundary from './components/ErrorBoundary'

export default function App() {
  return (
    <HashRouter>
      <BackHandler />
      <ErrorBoundary>
        <AnimatedRoutes />
      </ErrorBoundary>
    </HashRouter>
  )
}
