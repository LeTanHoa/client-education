import {X}from'lucide-react';
export default function Modal({ title, children, onClose, className = '', style = {} }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal ${className}`} style={style} onClick={e => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Đóng"><X size={18} /></button>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}
