import GuestLayout from './layouts/GuestLayout';
import SettingsPage from './pages/SettingsPage';
import HomePage from './pages/HomePage';
import { HashRouter, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<GuestLayout />}>
          <Route path="/:symbol?/:interval?" element={<HomePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<h1>Not Found</h1>} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
