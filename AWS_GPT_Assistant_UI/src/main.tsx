import React from 'react';
import ReactDOM from 'react-dom/client';
import AssistantUI from './gpt-assistant-ui.tsx'; // 👈 use your Assistant component
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AssistantUI />
  </React.StrictMode>
);
