import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'

// StrictMode désactivé : il monte les composants 2x en dev,
// ce qui déclenche runResolution en double dans TourEmpiresPanel.
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
