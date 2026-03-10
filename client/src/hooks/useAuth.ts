// client/src/hooks/useAuth.ts
// Hook para gerir autenticação (token JWT)

'use client';

import { useState, useEffect } from 'react';

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: number; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carregar token do sessionStorage ao montar
    const savedToken = typeof window !== 'undefined' ? window.sessionStorage.getItem('token') : null;
    if (savedToken) {
      setToken(savedToken);
      // Descodificar payload do JWT
      try {
        const payload = JSON.parse(atob(savedToken.split('.')[1]));
        setUser({ id: payload.id, email: payload.email, role: payload.role });
      } catch {
        setToken(null);
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken: string) => {
    window.sessionStorage.setItem('token', newToken);
    setToken(newToken);
    try {
      const payload = JSON.parse(atob(newToken.split('.')[1]));
      setUser({ id: payload.id, email: payload.email, role: payload.role });
    } catch {
      // token inválido
    }
  };

  const logout = () => {
    window.sessionStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return { token, user, loading, login, logout };
}