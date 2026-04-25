import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav.jsx';
import TopBar from './TopBar.jsx';

// The "in-app" chrome: top bar, scrollable content, bottom nav.
// Only mounted once the user is approved and past onboarding.
export default function AppShell() {
  return (
    <div className="min-h-full flex flex-col bg-bg">
      <TopBar showBack />
      <main className="flex-1 max-w-app w-full mx-auto px-4 py-4 pb-8">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
