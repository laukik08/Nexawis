import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { ThemeProvider } from './context/ThemeContext.tsx'
import { ClerkProviderWrapper } from './context/ClerkProviderWrapper.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { ProjectsProvider } from './context/ProjectsContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ClerkProviderWrapper>
        <AuthProvider>
          <ProjectsProvider>
            <App />
          </ProjectsProvider>
        </AuthProvider>
      </ClerkProviderWrapper>
    </ThemeProvider>
  </StrictMode>,
)

