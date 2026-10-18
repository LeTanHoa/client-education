import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';

export default function WorkspaceLayout({ role, active, navigate, onLogout, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={`workspace ${role}`}>
      <Sidebar
        role={role}
        active={active}
        navigate={navigate}
        onLogout={onLogout}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="workspace-page">
        <TopBar onToggleMenu={() => setMobileOpen(prev => !prev)} />
        {children}
      </div>
    </div>
  );
}
