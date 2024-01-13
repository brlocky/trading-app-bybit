import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';

import '@fortawesome/fontawesome-free/css/all.min.css';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import { PersistGate } from 'redux-persist/integration/react';
import './index.css';
import { ApiProvider, SocketProvider } from './providers';
import { SettingsService } from './services';
import { SocketListener } from './socket/socketListener';
import { persistor, store } from './store';

const { apiKey, apiSecret, testnet } = SettingsService.loadSettings();

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

const CommonRoot = () => (
  <React.Fragment>
    <ToastContainer />
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ApiProvider apiKey={apiKey} apiSecret={apiSecret} testnet={testnet}>
          <App />
        </ApiProvider>
        <SocketProvider socketKey={apiKey} socketSecret={apiSecret} testnet={testnet}>
          <SocketListener />
        </SocketProvider>
      </PersistGate>
    </Provider>
  </React.Fragment>
);

const RootComponent =
  process.env.NODE_ENV !== 'production' ? (
    <CommonRoot />
  ) : (
    <React.StrictMode>
      <CommonRoot />
    </React.StrictMode>
  );

root.render(RootComponent);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
