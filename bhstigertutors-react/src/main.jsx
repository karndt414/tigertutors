import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // Import this
import App from './Layout'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* Add this wrapper */}
      <App />
    </BrowserRouter> {/* And this one */}
  </React.StrictMode>,
)