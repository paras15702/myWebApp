import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { ArtistInfoProvider } from './context/ArtistInfoContext';
import { ArtworksProvider } from './context/ArtworksContext';
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <AuthProvider>
    <FavoritesProvider>
      <ArtistInfoProvider>
      <ArtworksProvider>
      <React.StrictMode>
        <App  />
      </React.StrictMode>
      </ArtworksProvider>
      </ArtistInfoProvider>
    </FavoritesProvider>
  </AuthProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();