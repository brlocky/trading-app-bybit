import React from 'react';
import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';
import { HashRouter } from 'react-router-dom';
import App from './App';

import './index.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { ApiProvider } from './providers';
import { Provider } from 'react-redux';
import { store } from './store';
import { SettingsService } from './services';
import { SocketListener } from './socket/socketListener';
import { selectInterval, selectSymbol } from './slices/symbolSlice';

const { apiKey, apiSecret } = SettingsService.loadSettings();
const state = store.getState();
const symbol = selectSymbol(state);
const interval = selectInterval(state);

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <HashRouter>
      <Provider store={store}>
        <ApiProvider apiKey={apiKey} apiSecret={apiSecret}>
          <SocketListener apiKey={apiKey} apiSecret={apiSecret} symbol={symbol} interval={interval} />
          <App />
        </ApiProvider>
      </Provider>
    </HashRouter>
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
