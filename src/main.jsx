import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { applyRouteMeta } from './seo.js'
import './styles.css'

applyRouteMeta()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
