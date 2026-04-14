// client/src/app/admin/layout.tsx
// Layout do backoffice — sidebar para admin, header para formador

'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">A carregar...</p>
      </div>
    );
  }

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // ── Layout formador — header simples, sem sidebar ──────────────────────────
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-base font-bold text-blue-900">Badges</span>
              <span className="text-gray-300 mx-2">·</span>
              <span className="text-sm text-gray-500">CESAE Digital</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-900 text-xs font-bold">
                {user.email[0].toUpperCase()}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 leading-none">{user.email}</p>
                <p className="text-xs text-gray-400 capitalize mt-0.5">{user.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              Terminar sessão
            </button>
          </div>
        </header>
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    );
  }

  // ── Layout admin — sidebar completa ────────────────────────────────────────
  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '' },
    { href: '/admin/events', label: 'Eventos', icon: '' },
    { href: '/admin/templates', label: 'Templates', icon: '' },
    { href: '/admin/users', label: 'Utilizadores', icon: '' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-900">Badges</h1>
          <p className="text-xs text-gray-500 mt-1">CESAE Digital</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-900'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-900 text-sm font-bold">
              {user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Terminar sessão
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
