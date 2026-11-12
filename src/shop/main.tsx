import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './shop.css';
import ShopApp from './ShopApp.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ShopApp />
  </StrictMode>,
);
