import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { NovoAtendimento } from './pages/NovoAtendimento';
import { Historico } from './pages/Historico';
import { Mecanicos } from './pages/Mecanicos';
import { Despesas } from './pages/Despesas';
import { Trafego } from './pages/Trafego';
import { PushConfig } from './pages/PushConfig';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { usuario, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f1117', color: '#94a3b8' }}>
        Carregando Lemoka Centro Automotivo...
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="novo" element={<NovoAtendimento />} />
            <Route path="historico" element={<Historico />} />
            <Route path="mecanicos" element={<Mecanicos />} />
            <Route path="despesas" element={<Despesas />} />
            <Route path="trafego" element={<Trafego />} />
            <Route path="push" element={<PushConfig />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
