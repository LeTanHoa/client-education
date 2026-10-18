import { Home, Map, Trophy, CalendarCheck, UserRound, BookOpen, FileQuestion, ClipboardList, BarChart3, Settings, Users, ShieldCheck, LogOut, MessageSquare, GraduationCap } from 'lucide-react';
import Brand from './Brand';

const icons = {
  home: Home, map: Map, award: Trophy, attendance: CalendarCheck, profile: UserRound,
  lessons: BookOpen, questions: FileQuestion, assignments: ClipboardList, progress: BarChart3,
  settings: Settings, users: Users, content: BookOpen, system: ShieldCheck, feedback: MessageSquare,
  subjects: GraduationCap
};

const student = [
  ['home',       'Trang chủ'],
  ['map',        'Khám phá'],
  ['assignments','Bài tập'],
  ['attendance', 'Điểm danh'],
  ['award',      'Thành tích'],
  ['profile',    'Cá nhân'],
];

const teacher = [
  ['home',       'Tổng quan'],
  ['lessons',    'Bài học'],
  ['questions',  'Câu hỏi'],
  ['assignments','Giao bài'],
  ['progress',   'Điểm số'],
  // ['settings',   'Cài đặt'],
];

const admin = [
  ['home',    'Tổng quan'],
  ['users',   'Người dùng'],
  ['subjects','Môn học'],
  ['content', 'Duyệt nội dung'],
    ['feedback','Phản hồi'],
  ['system',  'Hệ thống'],
  ['settings','Cài đặt'],
];

const workspace = [
  ['home',       'Tổng quan'],
  ['progress',   'Tiến độ'],
  ['assignments','Bài tập'],
  ['settings',   'Cài đặt'],
];

export default function Sidebar({ role = 'student', active = 'home', navigate, onLogout }) {
  const list = role === 'student' ? student : role === 'teacher' ? teacher : role === 'admin' ? admin : workspace;
  const isStudent = role === 'student';

  return (
    <aside className={`sidebar ${role}`}>
      <Brand />
      <nav>
        {list.map(([id, label]) => {
          const I = icons[id];
          const isActive = active === id;
          return (
            <button
              key={id}
              className={isActive ? 'selected' : ''}
              onClick={() => navigate(id)}
              title={label}
            >
              <I size={isStudent ? 22 : 20} />
              <span>{label}</span>
              {isStudent && isActive && <span className="nav-active-dot" />}
            </button>
          );
        })}
      </nav>
      <button className="logout" onClick={onLogout}>
        <LogOut size={19} />
        <span>Đăng xuất</span>
      </button>
    </aside>
  );
}
