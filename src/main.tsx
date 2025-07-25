import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  console.error('Error details:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  console.error('Promise:', event.promise);
});

try {
  const container = document.getElementById("root");
  if (!container) {
    throw new Error('Root element not found');
  }

  const root = createRoot(container);
  root.render(<App />);
} catch (error) {
  console.error('Failed to initialize React app:', error);
  
  // Show a basic error message if React fails to render
  const container = document.getElementById("root");
  if (container) {
    container.innerHTML = `
      <div style="
        display: flex; 
        align-items: center; 
        justify-content: center; 
        min-height: 100vh; 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background-color: #f9fafb;
      ">
        <div style="
          background: white; 
          padding: 2rem; 
          border-radius: 8px; 
          box-shadow: 0 1px 3px rgba(0,0,0,0.1); 
          text-align: center;
          max-width: 400px;
          width: 90%;
        ">
          <h1 style="color: #ef4444; margin-bottom: 1rem;">Application Error</h1>
          <p style="color: #6b7280; margin-bottom: 1.5rem;">
            Failed to initialize the application. Please refresh the page or check your connection.
          </p>
          <button 
            onclick="window.location.reload()" 
            style="
              background: #ec4899; 
              color: white; 
              border: none; 
              padding: 0.5rem 1rem; 
              border-radius: 4px; 
              cursor: pointer;
              font-size: 14px;
            "
          >
            Refresh Page
          </button>
          <details style="margin-top: 1rem; text-align: left; font-size: 12px; color: #6b7280;">
            <summary style="cursor: pointer;">Error Details</summary>
            <pre style="margin-top: 0.5rem; overflow: auto;">${error.toString()}</pre>
          </details>
        </div>
      </div>
    `;
  }
}
