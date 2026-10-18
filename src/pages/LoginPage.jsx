import {useState} from 'react';
import {LogIn, Mail, Lock} from 'lucide-react';
import Brand from '../components/Brand';
import {api} from '../lib/api';
import {toast} from '../components/Toast';


export default function LoginPage({onLogin, onGoLanding}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async event => {
    event.preventDefault();
    setLoading(true);
    try {
      onLogin(await api('/auth/login', {method: 'POST', body: JSON.stringify({email, password})}));
    } catch (error) {
      toast.error(error.message === 'Failed to fetch' ? 'Không thể kết nối máy chủ. Hãy kiểm tra máy chủ API.' : error.message);
    } finally { setLoading(false); }
  };
  return <main className="login-page"><section className="login-card"><Brand/><div className="login-copy"><h1>Chào mừng trở lại!</h1><p>Đăng nhập để tiếp tục hành trình học tập cùng H.</p></div><form onSubmit={submit}><label>Email <span className="input-wrap"><Mail size={18}/><input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="email@example.com" required autoComplete="email"/></span></label><label>Mật khẩu <span className="input-wrap"><Lock size={18}/><input type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Nhập mật khẩu" required autoComplete="current-password"/></span></label><button className="primary login-submit" disabled={loading}>{loading ? 'Đang đăng nhập...' : <><LogIn size={18}/> Đăng nhập</>}</button></form>{onGoLanding && <button type="button" className="login-back-link" onClick={onGoLanding}>← Quay lại trang chủ</button>}</section></main>;
}
