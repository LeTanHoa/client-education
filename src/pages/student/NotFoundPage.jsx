import{Compass}from'lucide-react';
import StudentEmptyState from'../../components/StudentEmptyState';
export default function NotFoundPage({navigate}){return <main className="student-main student-not-found"><StudentEmptyState icon={<Compass size={32}/>} title="Con lạc khỏi hành trình rồi!" description="Trang này chưa có hoặc đường dẫn không đúng. Mình cùng quay lại bản đồ học tập nhé." action="Về trang chủ" onAction={navigate}/></main>}
