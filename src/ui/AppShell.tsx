import { Link, useLocation } from 'react-router-dom';
import { Dumbbell, Calendar, Brain, Activity, Settings as Cog } from 'lucide-react';
import { ReactNode } from 'react';

const nav = [
  { to: '/strategy', label: 'Strategy', icon: Brain },
  { to: '/schedule', label: 'Schedule', icon: Calendar },
  { to: '/session', label: "Today's Session", icon: Dumbbell },
  { to: '/recovery', label: 'Recovery', icon: Activity },
  { to: '/settings', label: 'Settings', icon: Cog }
];

export default function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-aptum-blue/90"></div>
            <span className="font-extrabold tracking-tight text-aptum-blue">APTUM</span>
          </div>
          <nav className="hidden md:flex items-center gap-2">
            {nav.map((n) => {
              const active = pathname.startsWith(n.to);
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={
                    'btn ' + (active ? 'btn-primary' : 'btn-outline')
                  }
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
      </main>

      <footer className="md:hidden fixed bottom-0 inset-x-0 border-t border-line bg-white/95 backdrop-blur">
        <div className="grid grid-cols-5 text-xs">
          {nav.map((n) => {
            const active = pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={
                  'flex flex-col items-center justify-center py-2 ' +
                  (active ? 'text-aptum-blue' : 'text-muted')
                }
              >
                <Icon className="h-5 w-5" />
                <span>{n.label}</span>
              </Link>
            );
          })}
        </div>
      </footer>
    </div>
  );
}
