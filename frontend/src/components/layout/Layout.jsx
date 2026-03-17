import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Eye, Bot, Search } from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/stocks', icon: TrendingUp, label: 'Tüm Hisseler' },
  { path: '/watchlist', icon: Eye, label: 'İzleme Listesi' },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border z-40 hidden lg:block">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link to="/" className="flex items-center gap-3" data-testid="logo-link">
          <div className="w-10 h-10 bg-primary rounded flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
              BIST DOKTORU
            </h1>
            <p className="text-xs text-muted-foreground">Borsa Takip Platformu</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="py-6">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Legal Disclaimer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Bu platform eğitim amaçlıdır. Yatırım tavsiyesi değildir. 
          Veriler gecikmeli olarak sağlanmaktadır.
        </p>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 lg:hidden">
      <div className="flex justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              data-testid={`mobile-nav-${item.label.toLowerCase().replace(' ', '-')}`}
              className={`flex flex-col items-center gap-1 p-2 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function Header({ onSearchClick }) {
  return (
    <header className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border z-30 lg:hidden">
      <div className="flex items-center justify-between p-4">
        <Link to="/" className="flex items-center gap-2" data-testid="mobile-logo">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-lg font-bold">BIST DOKTORU</span>
        </Link>
        <button 
          onClick={onSearchClick}
          className="p-2 text-muted-foreground hover:text-foreground"
          data-testid="mobile-search-btn"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}

export function Layout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileNav />
      <main className="lg:ml-64 pb-20 lg:pb-0">
        {children}
      </main>
    </div>
  );
}

export default Layout;
