import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/orders', label: 'Orders', icon: '📦' },
    { href: '/admin/users', label: 'Users', icon: '👥' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <nav className="fixed top-0 left-0 h-full w-64 bg-white shadow-lg">
        <div className="p-4">
          <h1 className="text-xl font-bold text-gray-900">Eden Clinic Admin</h1>
        </div>
        <ul className="mt-4">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium ${
                  pathname === item.href
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Main content */}
      <div className="ml-64">
        <header className="bg-white shadow">
          <div className="px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              {navItems.find(item => item.href === pathname)?.label || 'Admin'}
            </h1>
          </div>
        </header>
        <main>
          {children}
        </main>
      </div>
    </div>
  );
}
