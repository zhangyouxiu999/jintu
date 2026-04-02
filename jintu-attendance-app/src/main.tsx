import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@tamagui/core/reset.css'
import App from './App'
import './index.css'
import { init } from './store/db'
import { getAppName } from './lib/appConfig'

document.title = getAppName()

init().then(() => {
  createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
  );
})
