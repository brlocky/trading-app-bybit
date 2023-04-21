import GuestLayout from "./layouts/Guest";
import { Route, Routes } from "react-router";
import SettingsPage from "./pages/SettingsPage";
import PositionsPage from "./pages/PositionsPage";

function App() {
  return (
    <Routes>
      <Route element={<GuestLayout />}>
        <Route path="/" element={<PositionsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<h1>Not Found</h1>} />
      </Route>
    </Routes>
  );
}

export default App;
