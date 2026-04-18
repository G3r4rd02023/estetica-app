import { useState, type ChangeEvent, type FocusEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { api, AUTH_ENDPOINTS, saveToken } from '../services/api';
import type { ApiResponse, AuthResponse, LoginRequest } from '../types/auth';

interface FormErrors {
  email?: string;
  password?: string;
}

export function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [errorMessage, setErrorMessage] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateField = (field: keyof FormErrors, value: string): string | undefined => {
    if (field === 'email') {
      if (!value.trim()) return 'El correo electrónico es requerido';
      if (!validateEmail(value)) return 'Ingresa un correo electrónico válido';
    }

    if (field === 'password' && !value.trim()) {
      return 'La contraseña es requerida';
    }

    return undefined;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    setErrorMessage('');
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name as keyof FormErrors, value);

    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const newErrors: FormErrors = {
      email: validateField('email', formData.email),
      password: validateField('password', formData.password),
    };

    if (newErrors.email || newErrors.password) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await api.post<ApiResponse<AuthResponse>>(AUTH_ENDPOINTS.login, formData);

      if (response.data.success && response.data.data.token) {
        saveToken(response.data.data.token);
        navigate('/dashboard');
      } else {
        setErrorMessage(response.data.message || 'No se pudo iniciar sesión.');
      }
    } catch {
      setErrorMessage('Ocurrió un error inesperado. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(238,69,138,0.16),_transparent_34%),linear-gradient(135deg,#fff8fb_0%,#fffdf8_52%,#f3f7fb_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(238,69,138,0.12),_transparent_34%),linear-gradient(135deg,#0f172a_0%,#1e293b_52%,#0f172a_100%)] transition-colors duration-500">
      <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),transparent)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:px-8">
        <div className="mb-10 hidden lg:block">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-500">
              Estetica Plus
            </p>
            <h1 className="mt-5 text-5xl font-semibold leading-tight text-slate-900 dark:text-white transition-colors">
              La operación diaria de la clínica, en un solo panel.
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300 transition-colors">
              Gestiona pacientes, consultas, citas, tratamientos y consentimientos desde una
              interfaz clara, rápida y preparada para crecer con la operación.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ['Pacientes', 'Registro y seguimiento'],
                ['Consultas', 'Historial y detalle clínico'],
                ['Agenda', 'Citas y estados en tiempo real'],
              ].map(([title, description]) => (
                <div
                  key={title}
                  className="rounded-3xl border border-white/70 dark:border-white/10 bg-white/80 dark:bg-slate-900/40 p-5 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.35)] backdrop-blur transition-all"
                >
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">{title}</p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full max-w-md lg:justify-self-end">
          <div className="mb-8 text-center lg:text-left">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500 shadow-lg shadow-primary-200/80">
              <svg
                className="h-8 w-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-500">
              Acceso seguro
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white transition-colors">Clínica Estética</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400 transition-colors">Ingresa a tu cuenta para continuar.</p>
          </div>

          <Card className="border border-white/70 dark:border-white/10 bg-white/90 dark:bg-slate-900/60 p-6 shadow-[0_32px_90px_-40px_rgba(15,23,42,0.45)] backdrop-blur sm:p-8 transition-colors">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                id="email"
                name="email"
                type="email"
                label="Correo electrónico"
                placeholder="correo@ejemplo.com"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.email}
                disabled={loading}
                autoComplete="email"
              />

              <Input
                id="password"
                name="password"
                type="password"
                label="Contraseña"
                placeholder="********"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.password}
                disabled={loading}
                autoComplete="current-password"
              />

              {errorMessage && (
                <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-3 transition-colors">
                  <p className="text-center text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
                </div>
              )}

              <Button type="submit" loading={loading} className="w-full rounded-xl py-3.5">
                Iniciar sesión
              </Button>
            </form>
          </Card>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400 lg:text-left transition-colors">
            ¿Necesitas ayuda? Contacta al administrador.
          </p>
        </div>
      </div>
    </div>
  );
}
