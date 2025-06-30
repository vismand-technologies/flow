import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import './index.css'
import App from './App.tsx'
import { store } from './core/store'
import { initializeWorkflowSystem } from './core/nodes/initNodes'

// Create root element
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

// Initialize our workflow system with custom node types
initializeWorkflowSystem();

const root = createRoot(rootElement);

// Render app with Redux provider
root.render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
