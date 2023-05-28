import React from 'react';
import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';
import { HashRouter } from 'react-router-dom';
import App from './App';

import './index.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { ApiProvider } from './providers';
import { Provider } from 'react-redux';
import { persistor, store } from './store';
import { SettingsService } from './services';
import { SocketListener } from './socket/socketListener';
import { PersistGate } from 'redux-persist/integration/react';

const { apiKey, apiSecret } = SettingsService.loadSettings();

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <HashRouter>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <ApiProvider apiKey={apiKey} apiSecret={apiSecret}>
            <SocketListener apiKey={apiKey} apiSecret={apiSecret} />
            <App />
          </ApiProvider>
        </PersistGate>
      </Provider>
    </HashRouter>
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
