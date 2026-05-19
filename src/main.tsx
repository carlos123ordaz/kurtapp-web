import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { LoadScript } from '@react-google-maps/api'
import './index.css'
import App from './App.tsx'

const GOOGLE_MAPS_API_KEY = 'AIzaSyAI4wxGabETICPQ6rmWft48nCg3i09efcY'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
        <App />
      </LoadScript>
    </BrowserRouter>
  </StrictMode>,
)
