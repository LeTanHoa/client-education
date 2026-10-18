import{useEffect,useMemo,useState}from'react';
import{BarChart3,CheckCircle2,Clock3,Users,RefreshCw}from'lucide-react';
import StatCard from'../../components/StatCard';
import DataTable from'../../components/DataTable';
import{api}from'../../lib/api';
import{toast}from'../../components/Toast';

const gradeOptions=[1,2,3,4,5].map(value=>({value:String(value),label:`Lớp ${value}`}));
export default function TeacherProgressPage(){
  const[rows,setRows]=useState([]),[subjects,setSubjects]=useState([]),[loading,setLoading]=useState(true);
  const load=async(notify=false)=>{setLoading(true);try{setRows(await api('/progress/teacher'));api('/subjects').then(setSubjects).catch(()=>{});if(notify)toast.success('Đã cập nhật bảng điểm.')}catch(error){toast.error(error.message)}finally{setLoading(false)}};
  useEffect(()=>{load()},[]);
  const completed=rows.filter(row=>row.status==='completed'),average=completed.length?Math.round(completed.reduce((sum,row)=>sum+(row.score||0),0)/completed.length):0,totalMinutes=Math.round(rows.reduce((sum,row)=>sum+(row.timeSpent||0),0)/60),studentCount=new Set(rows.map(row=>row.student.id)).size;
  const subjectMap=subjects.reduce((acc,s)=>{acc[s.key]=s;return acc},{math:{name:'Toán học'},vietnamese:{name:'Tiếng Việt'}});
  const subjectOptions=subjects.length?subjects.map(s=>({value:s.key,label:s.name})):[{value:'math',label:'Toán'},{value:'vietnamese',label:'Tiếng Việt'}];
  const columns=[{key:'student.name',label:'Học sinh'},{key:'student.email',label:'Email'},{key:'lesson.title',label:'Bài học'},{key:'lesson.grade',label:'Lớp',render:row=>`Lớp ${row.lesson.grade}`},{key:'lesson.subject',label:'Môn học',render:row=>subjectMap[row.lesson.subject]?.name||row.lesson.subject},{key:'score',label:'Điểm lần gần nhất',render:row=>row.status==='completed'?<b>{row.score}%</b>:'—',sortValue:row=>row.score??-1},{key:'correctCount',label:'Số câu đúng',render:row=>row.status==='completed'?`${row.correctCount}/${row.totalQuestions}`:'—',sortValue:row=>row.totalQuestions?row.correctCount/row.totalQuestions:-1},{key:'completedAt',label:'Lần làm gần nhất',render:row=>row.completedAt?new Date(row.completedAt).toLocaleString('vi-VN',{dateStyle:'short',timeStyle:'short'}):'Chưa làm',sortValue:row=>new Date(row.completedAt||0).getTime()},{key:'status',label:'Trạng thái',render:row=><span className={'status '+(row.status==='completed'?'ok':'warning')}>{row.status==='completed'?'Đã hoàn thành':'Chưa làm'}</span>}];
  const filters=[{key:'lesson.grade',label:'Khối lớp',getValue:row=>row.lesson.grade,options:gradeOptions},{key:'lesson.subject',label:'Môn học',getValue:row=>row.lesson.subject,options:subjectOptions},{key:'status',label:'Trạng thái',options:[{value:'completed',label:'Đã hoàn thành'},{value:'pending',label:'Chưa làm'}]}];
  return <main className="dashboard role-teacher"><header className="page-heading"><div><span className="role-kicker">KẾT QUẢ HỌC TẬP</span><h1>Điểm số học sinh</h1><p>Điểm và lần làm bài gần nhất của học sinh trong các bài tập bạn đã giao.</p></div><button className="outline" onClick={()=>load(true)} disabled={loading}><RefreshCw size={16}/> Làm mới</button></header>
    <section className="stats"><StatCard icon={<Users/>} title="Học sinh được giao" value={loading?'…':studentCount} note={`${rows.length} lượt học sinh · bài học`}/><StatCard icon={<CheckCircle2/>} title="Lượt hoàn thành" value={loading?'…':completed.length} note={`${rows.length-completed.length} lượt chưa làm`} tone="mint"/><StatCard icon={<BarChart3/>} title="Điểm trung bình" value={completed.length?`${average}%`:'—'} note="Tính theo lần làm gần nhất" tone="peach"/><StatCard icon={<Clock3/>} title="Thời gian làm bài" value={loading?'…':`${totalMinutes} phút`} note="Cộng thời gian các lượt đã ghi nhận"/></section>
    <div style={{ height: '20px' }}></div>
    <section className="panel"><div className="panel-title"><div><h2>Bảng kết quả theo bài học</h2><p>Mỗi dòng là kết quả mới nhất của một học sinh trong một bài được giao.</p></div></div><DataTable rows={rows} columns={columns} searchKeys={['student.name','student.email','lesson.title']} searchPlaceholder="Tìm học sinh hoặc bài học" filters={filters} emptyText={loading?'Đang tải dữ liệu điểm…':'Chưa có dữ liệu bài tập được giao.'}/></section>
  </main>;
}
