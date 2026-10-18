import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { api } from '../lib/api';
import { calculateStudentStats } from '../lib/studentStats';

export default function StudentLayout({ active, navigate, onLogout, user, children }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let activeRequest = true;
    Promise.all([api('/progress/me'), api('/attendance/me')])
      .then(([progress, attendance]) => {
        if (activeRequest) {
          setStats(calculateStudentStats(progress, attendance));
        }
      })
      .catch(() => {});
    return () => { activeRequest = false; };
  }, [active]);

  return (
    <div className="student-shell">
      <Sidebar role="student" active={active} navigate={navigate} onLogout={onLogout} />
      <div className="page student-page">
        <TopBar student user={user} stats={stats} navigate={navigate} />
        {children}
      </div>
    </div>
  );
}
