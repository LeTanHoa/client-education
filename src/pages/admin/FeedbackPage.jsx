import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, MessageSquare, RefreshCw, Star, Trash2, XCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from '../../components/Toast';
import { confirm } from '../../components/ConfirmModal';

const STATUS_TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'pending', label: '⏳ Chờ duyệt' },
  { id: 'approved', label: '✅ Đã duyệt' },
  { id: 'rejected', label: '❌ Từ chối' },
];

const ROLE_LABELS = { student: 'Học sinh', parent: 'Phụ huynh', teacher: 'Giáo viên', other: 'Khác' };
const STATUS_LABELS = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối' };

const formatDate = d => d ? new Date(d).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }) : '';

export default function AdminFeedbackPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [busy, setBusy] = useState({});
  const [noteModal, setNoteModal] = useState(null); // { id, note }

  const load = async (t = tab, p = page) => {
    setLoading(true);
    try {
      const data = await api(`/feedback?status=${t}&page=${p}&limit=15`);
      setItems(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(tab, page); }, [tab, page]);

  const changeStatus = async (id, status) => {
    setBusy(b => ({ ...b, [id]: true }));
    try {
      const updated = await api(`/feedback/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setItems(prev => prev.map(i => i._id === id ? updated : i));
      toast.success(`Đã ${STATUS_LABELS[status].toLowerCase()} phản hồi.`);
    } catch (e) { toast.error(e.message); }
    finally { setBusy(b => ({ ...b, [id]: false })); }
  };

  const saveNote = async () => {
    if (!noteModal) return;
    setBusy(b => ({ ...b, [noteModal.id]: true }));
    try {
      const updated = await api(`/feedback/${noteModal.id}`, { method: 'PATCH', body: JSON.stringify({ status: noteModal.status, adminNote: noteModal.note }) });
      setItems(prev => prev.map(i => i._id === noteModal.id ? updated : i));
      toast.success('Đã lưu ghi chú.');
      setNoteModal(null);
    } catch (e) { toast.error(e.message); }
    finally { setBusy(b => ({ ...b, [noteModal.id]: false })); }
  };

  const deleteFeedback = async id => {
    const ok = await confirm({ title: 'Xóa phản hồi?', message: 'Hành động này không thể hoàn tác.', type: 'danger', confirmText: 'Xóa' });
    if (!ok) return;
    setBusy(b => ({ ...b, [id]: true }));
    try {
      await api(`/feedback/${id}`, { method: 'DELETE' });
      setItems(prev => prev.filter(i => i._id !== id));
      setTotal(t => t - 1);
      toast.success('Đã xóa phản hồi.');
    } catch (e) { toast.error(e.message); }
    finally { setBusy(b => ({ ...b, [id]: false })); }
  };

  const pendingCount = items.filter(i => i.status === 'pending').length;

  return (
    <main className="dashboard role-admin">
      <header className="page-heading">
        <div>
          <span className="role-kicker">QUẢN TRỊ NỘI DUNG</span>
          <h1>Quản lý phản hồi</h1>
          <p>Xét duyệt và quản lý ý kiến từ học sinh, phụ huynh và giáo viên.</p>
        </div>
        <button className="outline" onClick={() => load(tab, page)}><RefreshCw size={15} /> Tải lại</button>
      </header>

      {/* Summary stats */}
      <div className="stats" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon"><MessageSquare size={18} /></div>
          <p>Tổng phản hồi</p>
          <strong>{total}</strong>
          <small>tất cả thời gian</small>
        </div>
        <div className="stat-card">
          <div className="stat-icon peach"><Clock size={18} /></div>
          <p>Chờ duyệt</p>
          <strong>{pendingCount}</strong>
          <small>{pendingCount > 0 ? 'cần xem xét' : 'đã xử lý hết'}</small>
        </div>
        <div className="stat-card">
          <div className="stat-icon mint"><CheckCircle2 size={18} /></div>
          <p>Đã duyệt</p>
          <strong>{items.filter(i => i.status === 'approved').length}</strong>
          <small>hiển thị trên trang chủ</small>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="content-tabs" style={{ marginBottom: 16 }}>
        {STATUS_TABS.map(t => (
          <button key={t.id} className={tab === t.id ? 'selected' : ''} onClick={() => { setTab(t.id); setPage(1); }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="empty" style={{ padding: 40, textAlign: 'center' }}>Đang tải...</div>
      ) : items.length === 0 ? (
        <div className="empty" style={{ padding: 40, textAlign: 'center' }}>
          <MessageSquare size={28} style={{ display: 'block', margin: '0 auto 10px' }} />
          Không có phản hồi nào {tab !== 'all' ? `với trạng thái "${STATUS_LABELS[tab]}"` : ''}.
        </div>
      ) : (
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Người gửi</th>
                  <th>Nội dung</th>
                  <th>Đánh giá</th>
                  <th>Trạng thái</th>
                  <th>Ghi chú</th>
                  <th>Thời gian</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item._id}>
                    <td>
                      <b style={{ display: 'block', fontSize: 13 }}>{item.name}</b>
                      <small style={{ color: '#8593a5' }}>{ROLE_LABELS[item.role] || item.role}</small>
                    </td>
                    <td style={{ maxWidth: 280 }}>
                      <p style={{ fontSize: 13, margin: 0, lineHeight: 1.5, color: '#455a73' }}>
                        {item.content.length > 140 ? item.content.slice(0, 140) + '…' : item.content}
                      </p>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {[1,2,3,4,5].map(n => <Star key={n} size={13} fill={n <= item.rating ? '#f59e0b' : 'none'} color={n <= item.rating ? '#f59e0b' : '#d1d5db'} />)}
                      </div>
                    </td>
                    <td>
                      <span className={`status ${item.status === 'approved' ? 'ok' : item.status === 'rejected' ? '' : 'warning'}`}
                        style={item.status === 'rejected' ? { background: '#fee2e2', color: '#991b1b' } : undefined}>
                        {STATUS_LABELS[item.status]}
                      </span>
                    </td>
                    <td style={{ maxWidth: 160 }}>
                      {item.adminNote
                        ? <small style={{ color: '#6b7280', fontSize: 11 }}>{item.adminNote}</small>
                        : <small style={{ color: '#d1d5db' }}>—</small>
                      }
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: 11, color: '#8593a5' }}>
                      {formatDate(item.createdAt)}
                    </td>
                    <td>
                      <div className="table-actions">
                        {item.status !== 'approved' && (
                          <button className="primary" style={{ padding: '6px 10px', fontSize: 11 }}
                            disabled={busy[item._id]} onClick={() => changeStatus(item._id, 'approved')}>
                            <CheckCircle2 size={13} /> Duyệt
                          </button>
                        )}
                        {item.status !== 'rejected' && (
                          <button className="outline" style={{ padding: '6px 10px', fontSize: 11 }}
                            disabled={busy[item._id]} onClick={() => changeStatus(item._id, 'rejected')}>
                            <XCircle size={13} /> Từ chối
                          </button>
                        )}
                        <button className="outline" style={{ padding: '6px 10px', fontSize: 11 }}
                          onClick={() => setNoteModal({ id: item._id, status: item.status, note: item.adminNote || '' })}>
                          Ghi chú
                        </button>
                        <button className="icon-button" style={{ color: '#c75b5b' }}
                          disabled={busy[item._id]} onClick={() => deleteFeedback(item._id)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid #edf1f5', fontSize: 12, color: '#8593a5' }}>
              <span>Trang {page}/{pages} · {total} phản hồi</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="outline" style={{ padding: '6px 12px', fontSize: 12 }} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Trước</button>
                <button className="outline" style={{ padding: '6px 12px', fontSize: 12 }} disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Tiếp →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Note modal */}
      {noteModal && (
        <div className="modal-backdrop" onClick={() => setNoteModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2><MessageSquare size={18} /> Ghi chú quản trị</h2>
            <p style={{ textAlign: 'left', color: '#374151', fontSize: 13 }}>Ghi chú nội bộ (học sinh không thấy):</p>
            <textarea
              style={{ width: '100%', minHeight: 100, border: '1.5px solid #e2e8f0', borderRadius: 10, padding: 12, font: 'inherit', resize: 'vertical', outline: 'none' }}
              value={noteModal.note}
              onChange={e => setNoteModal(n => ({ ...n, note: e.target.value }))}
              placeholder="Nhập lý do từ chối, ghi chú nội bộ..."
              maxLength={500}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="outline full" onClick={() => setNoteModal(null)}>Hủy</button>
              <button className="primary full" onClick={saveNote} disabled={busy[noteModal.id]}>Lưu ghi chú</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

