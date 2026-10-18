import {useEffect, useMemo, useRef, useState} from 'react';
import {AlertCircle, Download, FileUp, Pencil, Plus, Trash2, X} from 'lucide-react';
import DataTable from '../../components/DataTable';
import {api} from '../../lib/api';
import {toast} from '../../components/Toast';
import {confirm} from '../../components/ConfirmModal';

const QUESTION_TYPES = {multiple_choice: 'Trắc nghiệm', fill_blank: 'Điền khuyết', drag_drop: 'Kéo thả / Sắp xếp'};

const DIFFICULTY_LABELS = {easy: 'Dễ', medium: 'Vừa', hard: 'Khó'};

const STATUS_LABELS = {draft: 'Bản nháp', pending: 'Chờ duyệt', published: 'Đã công bố', rejected: 'Cần sửa', archived: 'Đã ẩn'};

const IMPORT_COLUMNS = ['STT', 'Dạng câu hỏi', 'Độ khó', 'Nội dung câu hỏi', ...Array.from({length: 8}, (_, index) => `Phương án ${index + 1}`), 'Đáp án đúng'];

const IMPORT_EXAMPLES = [
  [1, 'Trắc nghiệm', 'Dễ', '2 + 3 bằng bao nhiêu?', '4', '5', '6', '', '', '', '', '', '5'],
  [2, 'Điền khuyết', 'Dễ', 'Điền số còn thiếu: 10, 20, __', '', '', '', '', '', '', '', '', '30'],
  [3, 'Kéo thả', 'Vừa', 'Sắp xếp các số từ bé đến lớn: 3, 1, 2', '3', '1', '2', '', '', '', '', '', '1 → 2 → 3']
];

const IMPORT_TYPES = {'trac nghiem': 'multiple_choice', 'dien khuyet': 'fill_blank', 'keo tha': 'drag_drop', 'keo tha / sap xep': 'drag_drop'};

const IMPORT_DIFFICULTIES = {de: 'easy', vua: 'medium', kho: 'hard'};

const MANAGER_STYLES = `
.modal.modal-large{max-width:1080px;max-height:92vh;padding:0;display:flex;flex-direction:column;overflow:hidden;text-align:left}
.manager-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:20px 24px;border-bottom:1px solid #edf1f4}
.manager-head h2{margin:0 0 4px;font-size:20px}
.manager-head p{margin:0;color:#718297;font-size:13px}
.manager-toolbar{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;padding:14px 24px;background:#f7f9fc;border-bottom:1px solid #edf1f4}
.manager-toolbar label{display:flex;flex-direction:column;gap:6px;min-width:260px;font-size:13px;font-weight:800;color:#667991;text-align:left}
.manager-toolbar-actions{display:flex;align-items:center;gap:12px}
.manager-count{font-size:13px;color:#8493a5}
.manager-body{display:grid;grid-template-columns:minmax(260px,340px) 1fr;flex:1 1 auto;min-height:260px;overflow:hidden}
.manager-list{display:flex;flex-direction:column;gap:8px;padding:12px;overflow-y:auto;border-right:1px solid #edf1f4}
.manager-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid #e5ebf1;border-radius:12px;background:#fff;cursor:pointer;text-align:left}
.manager-item:hover{border-color:#45b79c}
.manager-item.selected{border-color:#45b79c;background:#effbf7}
.manager-index{display:grid;place-items:center;flex:0 0 auto;width:24px;height:24px;border-radius:50%;background:#e6f4ff;color:#357fe0;font-size:12px;font-weight:900}
.manager-text{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}
.manager-text b{font-size:13px;color:#334a62;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.manager-text small{font-size:11px;color:#8493a5}
.manager-warn{display:grid;place-items:center;flex:0 0 auto;color:#d97706}
.manager-editor{padding:20px 24px;overflow-y:auto;text-align:left}
.manager-empty{padding:32px 24px;text-align:center;color:#8493a5;font-size:13px}
.manager-foot{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;padding:16px 24px;background:#f7f9fc;border-top:1px solid #edf1f4}
.manager-hint{font-size:12px;color:#8493a5}
.manager-foot-actions{display:flex;gap:10px}
.question-editor-fields{display:flex;flex-direction:column;gap:14px}
.question-editor-fields .field-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.question-editor-fields>label{display:grid;gap:6px;font-size:13px;font-weight:800;color:#455a73;text-align:left}
.question-editor-fields input,.question-editor-fields select,.question-editor-fields textarea{width:100%;border:1px solid #dce3eb;border-radius:8px;padding:10px;outline:0;background:#fff;font:inherit}
.question-editor-fields textarea{min-height:78px;resize:vertical}
@media(max-width:860px){.modal.modal-large{max-height:96vh}.manager-body{grid-template-columns:1fr;min-height:0}.manager-list{max-height:26vh;border-right:0;border-bottom:1px solid #edf1f4}.manager-editor{padding:16px}.manager-toolbar label{min-width:0;width:100%}}
`;

const dateLabel = value => value ? new Date(value).toLocaleString('vi-VN', {dateStyle: 'short', timeStyle: 'short'}) : '—';

const stripAccents = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').trim().toLowerCase();

const cellText = cell => cell?.text?.trim() || '';

let draftSequence = 0;

function blankDraft() {
  draftSequence += 1;
  return {key: `draft-${draftSequence}`, id: '', type: 'multiple_choice', difficulty: 'easy', content: '', options: ['', ''], answer: ''};
}

function toDraft(question) {
  const options = question.options || [];
  let answer = question.answer;
  if (question.type === 'drag_drop') {
    answer = (Array.isArray(answer) ? answer : []).map(value => options.indexOf(value) + 1).join(', ');
  }
  if (question.type === 'fill_blank') answer = answer ?? '';
  return {
    key: `draft-${(draftSequence += 1)}`,
    id: question._id,
    type: question.type,
    difficulty: question.difficulty || 'easy',
    content: question.content || '',
    options: question.type === 'fill_blank' ? [] : options,
    answer
  };
}

function withType(draft, type) {
  return {...draft, type, options: type === 'fill_blank' ? [] : ['', ''], answer: ''};
}

function trimmedOptions(draft) {
  return draft.type === 'fill_blank' ? [] : draft.options.map(value => value.trim()).filter(Boolean);
}

function dragOrder(draft) {
  return String(draft.answer).split(/[\s,;]+/).filter(Boolean).map(Number);
}

function draftProblem(draft) {
  if (!draft.content.trim()) return 'Nhập nội dung câu hỏi';
  if (draft.type === 'fill_blank') return String(draft.answer ?? '').trim() ? null : 'Câu điền khuyết cần có đáp án';
  const options = trimmedOptions(draft);
  if (options.length < 2) return 'Cần ít nhất 2 phương án';
  if (draft.type === 'multiple_choice') return options.includes(draft.answer) ? null : 'Đáp án đúng phải trùng một phương án';
  if (draft.type === 'drag_drop') {
    const order = dragOrder(draft);
    const inRange = order.every(value => Number.isInteger(value) && value >= 1 && value <= options.length);
    const complete = order.length === options.length && new Set(order).size === options.length;
    return inRange && complete ? null : 'Nhập đủ thứ tự đúng bằng các số phương án, ví dụ: 2, 1, 3';
  }
  return 'Dạng câu hỏi không hợp lệ';
}

function draftPayload(draft, lesson) {
  const options = trimmedOptions(draft);
  let answer = draft.answer;
  if (draft.type === 'fill_blank') answer = String(draft.answer).trim();
  if (draft.type === 'drag_drop') answer = dragOrder(draft).map(value => options[value - 1]);
  return {lesson: lesson._id, type: draft.type, difficulty: draft.difficulty, content: draft.content.trim(), options, answer, subject: lesson.subject, grade: lesson.grade};
}

function draftSignature(draft) {
  return JSON.stringify({
    type: draft.type,
    difficulty: draft.difficulty,
    content: draft.content.trim(),
    options: trimmedOptions(draft),
    answer: draft.type === 'drag_drop' ? dragOrder(draft) : draft.answer
  });
}

function downloadFile(buffer, name) {
  const blob = new Blob([buffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function QuestionEditorFields({draft, onChange}) {
  const update = patch => onChange({...draft, ...patch});
  const setOption = (index, value) => update({options: draft.options.map((option, position) => position === index ? value : option)});
  const removeOption = index => update({options: draft.options.filter((_, position) => position !== index), answer: ''});

  return <div className="question-editor-fields">
    <div className="field-row">
      <label>Dạng câu hỏi
        <select value={draft.type} onChange={event => onChange(withType(draft, event.target.value))}>
          {Object.entries(QUESTION_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label>Độ khó
        <select value={draft.difficulty} onChange={event => update({difficulty: event.target.value})}>
          {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
    </div>

    <label>Nội dung câu hỏi
      <textarea value={draft.content} onChange={event => update({content: event.target.value})} placeholder="Nhập đề bài ở đây"/>
    </label>

    {draft.type === 'fill_blank'
      ? <label>Đáp án đúng
          <input value={draft.answer} onChange={event => update({answer: event.target.value})} placeholder="Nhập đáp án"/>
        </label>
      : <div className="option-editor">
          <span className="form-caption">{draft.type === 'drag_drop' ? 'Các mục cần sắp xếp' : 'Các phương án'}</span>
          {draft.options.map((option, index) => <div className="option-row" key={index}>
            {draft.type === 'multiple_choice' && <input
              aria-label="Đáp án đúng"
              type="radio"
              name={`correct-${draft.key}`}
              checked={draft.answer === option && Boolean(option)}
              onChange={() => update({answer: option})}
            />}
            <input value={option} onChange={event => setOption(index, event.target.value)} placeholder={`Phương án ${index + 1}`}/>
            {draft.options.length > 2 && <button type="button" className="icon-button" title="Xoá phương án" onClick={() => removeOption(index)}>
              <Trash2 size={15}/>
            </button>}
          </div>)}
          <button type="button" className="link" onClick={() => update({options: [...draft.options, '']})}>+ Thêm phương án</button>
          {draft.type === 'drag_drop' && <label>Thứ tự đúng (theo số phương án)
            <input value={draft.answer} onChange={event => update({answer: event.target.value})} placeholder="Ví dụ: 2, 1, 3"/>
            <small>Đánh số theo thứ tự phương án ở trên.</small>
          </label>}
        </div>}
  </div>;
}

function QuestionListPanel({drafts, selectedKey, onSelect, onRemove}) {
  if (!drafts.length) {
    return <div className="manager-empty">Chưa có câu hỏi nào. Bấm <b>Thêm câu hỏi</b> để bắt đầu.</div>;
  }

  return <div className="manager-list">
    {drafts.map((draft, index) => {
      const problem = draftProblem(draft);
      return <div
        key={draft.key}
        role="button"
        tabIndex={0}
        className={'manager-item' + (draft.key === selectedKey ? ' selected' : '')}
        onClick={() => onSelect(draft.key)}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect(draft.key);
          }
        }}
      >
        <span className="manager-index">{index + 1}</span>
        <span className="manager-text">
          <b>{draft.content.trim() || 'Câu hỏi mới'}</b>
          <small>{QUESTION_TYPES[draft.type] || draft.type} · {DIFFICULTY_LABELS[draft.difficulty] || draft.difficulty}{draft.id ? '' : ' · chưa lưu'}</small>
        </span>
        {problem && <span className="manager-warn" title={problem}><AlertCircle size={15}/></span>}
        <button type="button" className="icon-button" title="Xoá câu hỏi" onClick={event => {
          event.stopPropagation();
          onRemove(draft.key);
        }}><Trash2 size={15}/></button>
      </div>;
    })}
  </div>;
}

function QuestionManagerModal({lessons, questions, initialLessonId, initialQuestionId, onClose, onSaved}) {
  const [lessonId, setLessonId] = useState(initialLessonId || lessons[0]?._id || '');
  const [drafts, setDrafts] = useState([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (lessonId && lessons.some(item => item._id === lessonId)) return;
    const fallback = lessons.some(item => item._id === initialLessonId) ? initialLessonId : lessons[0]?._id;
    if (fallback && fallback !== lessonId) setLessonId(fallback);
  }, [lessons, initialLessonId, lessonId]);

  const lesson = lessons.find(item => item._id === lessonId) || null;

  const lessonQuestions = useMemo(
    () => questions.filter(item => (item.lesson?._id || item.lesson) === lessonId),
    [questions, lessonId]
  );

  const originalDrafts = useMemo(() => lessonQuestions.map(toDraft), [lessonQuestions]);

  const originalSignatures = useMemo(
    () => new Map(originalDrafts.map(draft => [draft.id, draftSignature(draft)])),
    [originalDrafts]
  );

  useEffect(() => {
    setDrafts(originalDrafts);
    const preferred = initialQuestionId && originalDrafts.find(draft => draft.id === initialQuestionId);
    setSelectedKey((preferred || originalDrafts[0])?.key || '');
  }, [originalDrafts]);

  const selected = drafts.find(draft => draft.key === selectedKey) || null;

  const replaceDraft = next => setDrafts(current => current.map(draft => draft.key === next.key ? next : draft));

  const addDraft = () => {
    const draft = blankDraft();
    setDrafts(current => [...current, draft]);
    setSelectedKey(draft.key);
  };

  const removeDraft = key => {
    const next = drafts.filter(draft => draft.key !== key);
    setDrafts(next);
    if (selectedKey === key) setSelectedKey(next[0]?.key || '');
  };

  const collectChanges = () => {
    const keptIds = drafts.filter(draft => draft.id).map(draft => draft.id);
    return {
      removed: lessonQuestions.filter(question => !keptIds.includes(question._id)),
      created: drafts.filter(draft => !draft.id),
      updated: drafts.filter(draft => draft.id && originalSignatures.get(draft.id) !== draftSignature(draft))
    };
  };

  const hasPendingChanges = () => {
    const {removed, created, updated} = collectChanges();
    return removed.length + created.length + updated.length > 0;
  };

  const switchLesson = async value => {
    if (value === lessonId) return;
    if (hasPendingChanges()) {
      const ok = await confirm({
        title: 'Thay đổi chưa lưu',
        message: 'Bạn có thay đổi chưa lưu. Chuyển khóa học sẽ hủy các thay đổi này. Bạn có muốn tiếp tục?',
        confirmText: 'Bỏ thay đổi',
        type: 'warning'
      });
      if (!ok) return;
    }
    setLessonId(value);
  };

  const requestClose = async () => {
    if (hasPendingChanges()) {
      const ok = await confirm({
        title: 'Thay đổi chưa lưu',
        message: 'Bạn có thay đổi chưa lưu. Đóng bảng quản lý sẽ hủy các thay đổi này. Bạn có muốn tiếp tục?',
        confirmText: 'Bỏ thay đổi',
        type: 'warning'
      });
      if (!ok) return;
    }
    onClose();
  };

  const save = async () => {
    if (!lesson) {
      toast.error('Hãy chọn một khóa học bản nháp.');
      return;
    }
    const problem = drafts.map(draft => draftProblem(draft)).find(Boolean);
    if (problem) {
      const invalid = drafts.find(draft => draftProblem(draft));
      setSelectedKey(invalid.key);
      toast.error(problem);
      return;
    }

    const {removed, created, updated} = collectChanges();

    if (!removed.length && !created.length && !updated.length) {
      toast.info('Không có thay đổi nào để lưu.');
      onClose();
      return;
    }

    setSaving(true);
    try {
      for (const question of removed) {
        await api(`/questions/${question._id}`, {method: 'DELETE'});
      }
      for (const draft of updated) {
        await api(`/questions/${draft.id}`, {method: 'PATCH', body: JSON.stringify(draftPayload(draft, lesson))});
      }
      for (const draft of created) {
        await api('/questions', {method: 'POST', body: JSON.stringify(draftPayload(draft, lesson))});
      }
      toast.success(`Đã lưu câu hỏi: thêm ${created.length}, sửa ${updated.length}, xoá ${removed.length}.`);
      onSaved();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return <div className="modal-backdrop">
    <style>{MANAGER_STYLES}</style>
    <div className="modal modal-large" role="dialog" aria-label="Quản lý câu hỏi">
      <header className="manager-head">
        <div>
          <h2>Quản lý câu hỏi</h2>
          <p>Thêm, sửa hoặc xoá câu hỏi trong khóa học rồi bấm <b>Lưu</b> để áp dụng.</p>
        </div>
        <button type="button" className="icon-button" title="Đóng" onClick={requestClose}><X size={18}/></button>
      </header>

      <div className="manager-toolbar">
        <label>Khóa học bản nháp
          <select className="select" value={lessonId} onChange={event => switchLesson(event.target.value)} disabled={saving}>
            {!lessons.length && <option value="">Chưa có khóa học bản nháp</option>}
            {lessons.map(item => <option key={item._id} value={item._id}>{item.title} · Lớp {item.grade}</option>)}
          </select>
        </label>
        <div className="manager-toolbar-actions">
          <span className="manager-count">{drafts.length} câu hỏi</span>
          <button type="button" className="primary" onClick={addDraft} disabled={!lesson || saving}><Plus size={16}/> Thêm câu hỏi</button>
        </div>
      </div>

      <div className="manager-body">
        <QuestionListPanel drafts={drafts} selectedKey={selectedKey} onSelect={setSelectedKey} onRemove={removeDraft}/>
        <section className="manager-editor">
          {selected
            ? <QuestionEditorFields draft={selected} onChange={replaceDraft}/>
            : <div className="manager-empty">Chọn một câu hỏi ở khung bên trái để chỉnh sửa.</div>}
        </section>
      </div>

      <footer className="manager-foot">
        <span className="manager-hint">Thay đổi chỉ được lưu vào hệ thống khi bạn bấm <b>Lưu</b>.</span>
        <div className="manager-foot-actions">
          <button type="button" className="outline" onClick={requestClose} disabled={saving}>Hủy</button>
          <button type="button" className="primary" onClick={save} disabled={!lesson || saving}>{saving ? 'Đang lưu...' : 'Lưu'}</button>
        </div>
      </footer>
    </div>
  </div>;
}

function ImportPanel({lessons, onImported}) {
  const drafts = lessons.filter(item => item.status === 'draft');
  const [importLesson, setImportLesson] = useState('');
  const [busy, setBusy] = useState(false);
  const fileInput = useRef(null);
  const targetLesson = importLesson || drafts[0]?._id || '';

  const exportTemplate = async () => {
    try {
      const {default: ExcelJS} = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Câu hỏi');
      sheet.columns = IMPORT_COLUMNS.map(header => ({header, key: header, width: Math.max(16, header.length + 3)}));
      IMPORT_EXAMPLES.forEach(row => sheet.addRow(row));
      sheet.getRow(1).font = {bold: true, color: {argb: 'FFFFFFFF'}};
      sheet.getRow(1).fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FF347E78'}};
      sheet.views = [{state: 'frozen', ySplit: 1}];
      const instructions = workbook.addWorksheet('Hướng dẫn');
      instructions.addRows([
        ['HƯỚNG DẪN NHẬP CÂU HỎI'],
        ['Mỗi dòng là một câu hỏi; STT chỉ để đánh số.'],
        ['Dạng câu hỏi: Trắc nghiệm, Điền khuyết hoặc Kéo thả.'],
        ['Độ khó: Dễ, Vừa hoặc Khó.'],
        ['Trắc nghiệm: đáp án đúng phải trùng một phương án.'],
        ['Kéo thả: ghi thứ tự đáp án đúng, ngăn cách bằng mũi tên →.'],
        ['Khi nhập file, chọn khóa học bản nháp ở trang Ngân hàng câu hỏi.']
      ]);
      instructions.getColumn(1).width = 110;
      instructions.getColumn(1).alignment = {wrapText: true, vertical: 'top'};
      downloadFile(await workbook.xlsx.writeBuffer(), 'mau-cau-hoi-hoc-vui.xlsx');
    } catch (error) {
      toast.error(`Không thể tạo file mẫu: ${error.message}`);
    }
  };

  const importFile = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!targetLesson) {
      toast.error('Hãy chọn khóa học nhận câu hỏi trước.');
      return;
    }
    setBusy(true);
    try {
      const {default: ExcelJS} = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const sheet = workbook.worksheets[0];
      if (!sheet) throw new Error('File Excel không có trang tính.');
      const headerRow = sheet.getRow(1);
      const headers = new Map();
      headerRow.eachCell((cell, index) => headers.set(stripAccents(cellText(cell)), index));
      const column = (row, name) => {
        const index = headers.get(stripAccents(name));
        return index ? cellText(row.getCell(index)) : '';
      };
      const rows = [];
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const content = column(row, 'Nội dung câu hỏi');
        if (!content) return;
        const type = IMPORT_TYPES[stripAccents(column(row, 'Dạng câu hỏi'))];
        if (!type) throw new Error(`Dòng ${rowNumber}: dạng câu hỏi chưa hợp lệ.`);
        const difficulty = IMPORT_DIFFICULTIES[stripAccents(column(row, 'Độ khó'))] || 'easy';
        const options = Array.from({length: 8}, (_, index) => column(row, `Phương án ${index + 1}`)).filter(Boolean);
        const rawAnswer = column(row, 'Đáp án đúng');
        let answer = rawAnswer;
        if (type === 'multiple_choice' && /^[A-H]$/i.test(rawAnswer)) {
          answer = options[rawAnswer.toUpperCase().charCodeAt(0) - 65] || rawAnswer;
        } else if (type === 'drag_drop') {
          answer = rawAnswer.split(/\s*(?:→|->|>)\s*/).map(value => value.trim()).filter(Boolean);
        }
        rows.push({type, difficulty, content, options: type === 'fill_blank' ? [] : options, answer});
      });
      if (!rows.length) throw new Error('Không tìm thấy câu hỏi. Kiểm tra tiêu đề cột và các dòng dữ liệu.');
      const result = await api('/questions/import', {method: 'POST', body: JSON.stringify({lesson: targetLesson, questions: rows})});
      toast.success(`Đã nhập ${result.imported} câu hỏi.`);
      onImported();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  return <section className="panel question-import">
    <div>
      <h2>Nhập câu hỏi từ Excel</h2>
      <p>Chọn khóa học bản nháp, sau đó tải file .xlsx có cùng cấu trúc với file mẫu.</p>
    </div>
    <select className="select" value={targetLesson} onChange={event => setImportLesson(event.target.value)} disabled={!drafts.length}>
      {!drafts.length && <option value="">Chưa có khóa học bản nháp</option>}
      {drafts.map(item => <option key={item._id} value={item._id}>{item.title} · Lớp {item.grade}</option>)}
    </select>
    <button type="button" className="outline" onClick={exportTemplate}><Download size={16}/> Tải file Excel mẫu</button>
    <button type="button" className="primary" disabled={!targetLesson || busy} onClick={() => fileInput.current?.click()}>
      <FileUp size={16}/>{busy ? 'Đang nhập...' : 'Chọn file Excel'}
    </button>
    <input ref={fileInput} hidden type="file" accept=".xlsx,.xlsm" onChange={importFile}/>
  </section>;
}

export default function QuestionBankPage() {
  const [lessons, setLessons] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [groupByLesson, setGroupByLesson] = useState(true);
  const [manager, setManager] = useState(null);

  const load = async () => {
    try {
      const [questionData, lessonData, subjectData] = await Promise.all([
        api('/questions'),
        api('/lessons'),
        api('/subjects').catch(() => [])
      ]);
      setQuestions(questionData.items || []);
      setLessons(lessonData || []);
      setSubjects(Array.isArray(subjectData) ? subjectData : []);
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {load()}, []);

  const editableLessons = lessons.filter(item => item.status === 'draft');

  useEffect(() => {
    const lessonId = sessionStorage.getItem('editing-lesson');
    if (!lessonId) return;
    sessionStorage.removeItem('editing-lesson');
    setManager({lessonId, questionId: ''});
  }, []);

  const openManager = (lessonId, questionId = '') => {
    if (!editableLessons.length) {
      toast.error('Cần có khóa học bản nháp trước khi soạn câu hỏi.');
      return;
    }
    setManager({lessonId: lessonId || editableLessons[0]._id, questionId});
  };

  const groupedLessons = lessons
    .map(lesson => ({...lesson, items: questions.filter(question => (question.lesson?._id || question.lesson) === lesson._id)}))
    .filter(lesson => lesson.items.length > 0);

  const questionColumns = [
    {key: 'content', label: 'Câu hỏi', render: item => <><b>{item.content}</b><small className="table-subtext">{item.lesson?.title || 'Khóa học đã xóa'}</small></>},
    {key: 'grade', label: 'Lớp', render: item => `Lớp ${item.grade}`},
    {key: 'type', label: 'Dạng', render: item => QUESTION_TYPES[item.type] || item.type},
    {key: 'difficulty', label: 'Độ khó', render: item => DIFFICULTY_LABELS[item.difficulty] || item.difficulty},
    {key: 'createdAt', label: 'Ngày tạo', render: item => dateLabel(item.createdAt), sortValue: item => new Date(item.createdAt || 0).getTime()},
    {
      key: 'actions',
      label: 'Thao tác',
      sortable: false,
      render: item => item.lesson?.status === 'draft'
        ? <button className="outline" onClick={() => openManager(item.lesson?._id || item.lesson, item._id)}><Pencil size={14}/> Sửa</button>
        : <span className="status">Chỉ xem</span>
    }
  ];

  const subjectMap = subjects.reduce((acc, s) => { acc[s.key] = s; return acc; }, { math: { name: 'Toán học' }, vietnamese: { name: 'Tiếng Việt' } });
  const subjectOptions = subjects.length ? subjects.map(s => ({ value: s.key, label: s.name })) : [{ value: 'math', label: 'Toán' }, { value: 'vietnamese', label: 'Tiếng Việt' }];

  const groupedColumns = [
    {key: 'title', label: 'Bài học', render: item => <><b>{item.title}</b><small className="table-subtext">{item.description || '—'}</small></>},
    {key: 'grade', label: 'Lớp', render: item => `Lớp ${item.grade}`},
    {key: 'subject', label: 'Môn học', render: item => subjectMap[item.subject]?.name || (item.subject === 'math' ? 'Toán' : item.subject === 'vietnamese' ? 'Tiếng Việt' : item.subject)},
    {key: 'items.length', label: 'Số câu hỏi', sortValue: item => item.items.length, render: item => item.items.length},
    {key: 'createdAt', label: 'Ngày tạo', render: item => dateLabel(item.createdAt), sortValue: item => new Date(item.createdAt || 0).getTime()},
    {key: 'status', label: 'Trạng thái', render: item => <span className={'status ' + (item.status === 'published' ? 'ok' : 'warning')}>{STATUS_LABELS[item.status] || item.status}</span>},
    {
      key: 'actions',
      label: 'Thao tác',
      sortable: false,
      render: item => item.status === 'draft'
        ? <button className="outline" onClick={() => openManager(item._id)}><Pencil size={14}/> Quản lý câu hỏi</button>
        : <span className="status">Chỉ xem</span>
    }
  ];

  return <main className="dashboard role-teacher">
    <header className="page-heading">
      <div>
        <span className="role-kicker">KHO HỌC LIỆU</span>
        <h1>Ngân hàng câu hỏi</h1>
        <p>Mở bảng quản lý để thêm, sửa, xoá câu hỏi rồi lưu một lần, hoặc nhập hàng loạt từ file Excel.</p>
      </div>
      <button className="primary" onClick={() => openManager(editableLessons[0]?._id || '')}><Plus size={18}/> Quản lý câu hỏi</button>
    </header>

    <ImportPanel lessons={lessons} onImported={load}/>

    <label className="question-group-toggle">
      <input type="checkbox" checked={groupByLesson} onChange={event => setGroupByLesson(event.target.checked)}/>
      <span>Gộp câu hỏi theo bài học</span>
    </label>

    {groupByLesson
      ? <section className="panel">
          <DataTable
            rows={groupedLessons}
            columns={groupedColumns}
            initialSort={{ key: 'createdAt', direction: -1 }}
            searchKeys={['title', 'description']}
            searchPlaceholder="Tìm bài học"
            filters={[
              {key: 'grade', label: 'Khối lớp', options: [1, 2, 3, 4, 5].map(value => ({value: String(value), label: `Lớp ${value}`}))},
              {key: 'subject', label: 'Môn học', options: subjectOptions},
              {key: 'status', label: 'Trạng thái', options: Object.entries(STATUS_LABELS).map(([value, label]) => ({value, label}))}
            ]}
            emptyText="Không có bài học chứa câu hỏi."
          />
        </section>
      : <section className="panel">
          <DataTable
            rows={questions}
            columns={questionColumns}
            initialSort={{ key: 'createdAt', direction: -1 }}
            searchKeys={['content', 'lesson.title']}
            searchPlaceholder="Tìm nội dung hoặc khóa học"
            filters={[
              {key: 'lesson', label: 'Khóa học', getValue: item => item.lesson?._id || item.lesson, options: lessons.map(item => ({value: item._id, label: item.title}))},
              {key: 'grade', label: 'Khối lớp', options: [1, 2, 3, 4, 5].map(value => ({value: String(value), label: `Lớp ${value}`}))},
              {key: 'type', label: 'Dạng câu hỏi', options: Object.entries(QUESTION_TYPES).map(([value, label]) => ({value, label}))},
              {key: 'difficulty', label: 'Độ khó', options: Object.entries(DIFFICULTY_LABELS).map(([value, label]) => ({value, label}))}
            ]}
            emptyText="Chưa có câu hỏi phù hợp."
          />
        </section>}

    {manager && <QuestionManagerModal
      lessons={editableLessons}
      questions={questions}
      initialLessonId={manager.lessonId}
      initialQuestionId={manager.questionId}
      onClose={() => setManager(null)}
      onSaved={async () => {setManager(null); await load();}}
    />}
  </main>;
}
