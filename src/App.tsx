import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { LoginPage } from "./features/auth/LoginPage";
import { BrewNowPage } from "./features/brew/BrewNowPage";
import { BrosBoardPage } from "./features/bros/BrosBoardPage";
import { LibraryPage } from "./features/library/LibraryPage";
import { AuthProvider, useAuth } from "./lib/auth";

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

function AppRoutes() {
  const { bro } = useAuth();

  if (!bro) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<BrewNowPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/bros" element={<BrosBoardPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
