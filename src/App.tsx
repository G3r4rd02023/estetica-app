import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Pacientes } from './pages/Pacientes';
import { Consultas } from './pages/Consultas';
import { ConsultaDetalle } from './pages/ConsultaDetalle';
import { Citas } from './pages/Citas';
import { Tratamientos } from './pages/Tratamientos';
import { TratamientosAsignados } from './pages/TratamientosAsignados';
import { Consentimientos } from './pages/Consentimientos';
import { EvaluacionClinica } from './pages/EvaluacionClinica';
import { getToken } from './services/api';

function AuthGuard({ children }: { children: ReactNode }) {
  const token = getToken();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <Dashboard />
            </AuthGuard>
          }
        />
        <Route
          path="/pacientes"
          element={
            <AuthGuard>
              <Pacientes />
            </AuthGuard>
          }
        />
        <Route
          path="/consultas"
          element={
            <AuthGuard>
              <Consultas />
            </AuthGuard>
          }
        />
        <Route
          path="/consultas/:id"
          element={
            <AuthGuard>
              <ConsultaDetalle />
            </AuthGuard>
          }
        />
        <Route
          path="/citas"
          element={
            <AuthGuard>
              <Citas />
            </AuthGuard>
          }
        />
        <Route
          path="/tratamientos"
          element={
            <AuthGuard>
              <Tratamientos />
            </AuthGuard>
          }
        />
        <Route
          path="/tratamientos-asignados"
          element={
            <AuthGuard>
              <TratamientosAsignados />
            </AuthGuard>
          }
        />
        <Route
          path="/consentimientos"
          element={
            <AuthGuard>
              <Consentimientos />
            </AuthGuard>
          }
        />
        <Route
          path="/evaluacion-clinica"
          element={
            <AuthGuard>
              <EvaluacionClinica />
            </AuthGuard>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;