export const QUESTION_TYPES = {
  multiple_choice: 'Trắc nghiệm',
  fill_blank: 'Điền khuyết',
  drag_drop: 'Kéo thả / Sắp xếp'
};

export const DIFFICULTY_LABELS = {easy: 'Dễ', medium: 'Vừa', hard: 'Khó'};

let sequence = 0;

function nextKey() {
  sequence += 1;
  return `draft-${sequence}`;
}

export function blankDraft() {
  return {
    key: nextKey(),
    id: '',
    type: 'multiple_choice',
    difficulty: 'easy',
    content: '',
    options: ['', ''],
    answer: ''
  };
}

export function toDraft(question) {
  const options = question.options || [];
  let answer = question.answer;
  if (question.type === 'drag_drop') {
    answer = (Array.isArray(answer) ? answer : []).map(value => options.indexOf(value) + 1).join(', ');
  }
  if (question.type === 'fill_blank') {
    answer = answer ?? '';
  }
  return {
    key: nextKey(),
    id: question._id,
    type: question.type,
    difficulty: question.difficulty || 'easy',
    content: question.content || '',
    options: question.type === 'fill_blank' ? [] : options,
    answer
  };
}

export function withType(draft, type) {
  return {...draft, type, options: type === 'fill_blank' ? [] : ['', ''], answer: ''};
}

export function trimmedOptions(draft) {
  return draft.type === 'fill_blank' ? [] : draft.options.map(value => value.trim()).filter(Boolean);
}

function dragOrder(draft) {
  return String(draft.answer).split(/[\s,;]+/).filter(Boolean).map(Number);
}

export function draftProblem(draft) {
  if (!draft.content.trim()) return 'Nhập nội dung câu hỏi';
  if (draft.type === 'fill_blank') {
    return String(draft.answer ?? '').trim() ? null : 'Câu điền khuyết cần có đáp án';
  }
  const options = trimmedOptions(draft);
  if (options.length < 2) return 'Cần ít nhất 2 phương án';
  if (draft.type === 'multiple_choice') {
    return options.includes(draft.answer) ? null : 'Đáp án đúng phải trùng một phương án';
  }
  if (draft.type === 'drag_drop') {
    const order = dragOrder(draft);
    const inRange = order.every(value => Number.isInteger(value) && value >= 1 && value <= options.length);
    const complete = order.length === options.length && new Set(order).size === options.length;
    return inRange && complete ? null : 'Nhập đủ thứ tự đúng bằng các số phương án, ví dụ: 2, 1, 3';
  }
  return 'Dạng câu hỏi không hợp lệ';
}

export function draftPayload(draft, lesson) {
  const options = trimmedOptions(draft);
  let answer = draft.answer;
  if (draft.type === 'fill_blank') {
    answer = String(draft.answer).trim();
  }
  if (draft.type === 'drag_drop') {
    answer = dragOrder(draft).map(value => options[value - 1]);
  }
  return {
    lesson: lesson._id,
    type: draft.type,
    difficulty: draft.difficulty,
    content: draft.content.trim(),
    options,
    answer,
    subject: lesson.subject,
    grade: lesson.grade
  };
}

export function draftSignature(draft) {
  return JSON.stringify({
    type: draft.type,
    difficulty: draft.difficulty,
    content: draft.content.trim(),
    options: trimmedOptions(draft),
    answer: draft.type === 'drag_drop' ? dragOrder(draft) : draft.answer
  });
}
