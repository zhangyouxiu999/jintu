import { HashRouter } from 'react-router-dom'
import { PortalProvider, TamaguiProvider, Theme } from 'tamagui'
import BackHandler from './components/BackHandler'
import AnimatedRoutes from './components/AnimatedRoutes'
import ErrorBoundary from './components/ErrorBoundary'
import tamaguiConfig from './tamagui.config'

export default function App() {
  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="classroomCalm">
      <Theme name="classroomCalm">
        <PortalProvider shouldAddRootHost>
          <HashRouter>
            <BackHandler />
            <ErrorBoundary>
              <AnimatedRoutes />
            </ErrorBoundary>
          </HashRouter>
        </PortalProvider>
      </Theme>
    </TamaguiProvider>
  )
}
