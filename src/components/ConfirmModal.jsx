import { useEffect, useState } from 'react';
import { AlertTriangle, Trash2, Info, X } from 'lucide-react';

let currentResolver = null;

export function confirm(options) {
  const normalized = typeof options === 'string'
    ? {
        title: /xóa|delete|remove|hủy bỏ/i.test(options) ? 'Xác nhận xóa' : 'Xác nhận',
        message: options,
        confirmText: /xóa|delete|remove|hủy bỏ/i.test(options) ? 'Xóa' : 'Xác nhận',
        cancelText: 'Hủy',
        type: /xóa|delete|remove|hủy bỏ/i.test(options) ? 'danger' : 'warning'
      }
    : {
        title: options.title || (options.type === 'danger' ? 'Xác nhận xóa' : 'Xác nhận'),
        message: options.message || '',
        confirmText: options.confirmText || (options.type === 'danger' ? 'Xóa' : 'Xác nhận'),
        cancelText: options.cancelText || 'Hủy',
        type: options.type || 'warning',
        isAlert: false
      };

  return new Promise(resolve => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hoc-vui-confirm', {
        detail: { ...normalized, resolve }
      }));
    } else {
      resolve(false);
    }
  });
}

export function alertModal(options) {
  const normalized = typeof options === 'string'
    ? {
        title: 'Thông báo',
        message: options,
        confirmText: 'Đã hiểu',
        type: 'info',
        isAlert: true
      }
    : {
        title: options.title || 'Thông báo',
        message: options.message || '',
        confirmText: options.confirmText || 'Đã hiểu',
        type: options.type || 'info',
        isAlert: true
      };

  return new Promise(resolve => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hoc-vui-confirm', {
        detail: { ...normalized, resolve }
      }));
    } else {
      resolve(true);
    }
  });
}

export default function ConfirmModalContainer() {
  const [modal, setModal] = useState(null);

  useEffect(() => {
    const handleOpen = event => {
      if (currentResolver) {
        currentResolver(false);
      }
      currentResolver = event.detail.resolve;
      setModal(event.detail);
    };

    window.addEventListener('hoc-vui-confirm', handleOpen);
    return () => {
      window.removeEventListener('hoc-vui-confirm', handleOpen);
    };
  }, []);

  const close = confirmed => {
    if (currentResolver) {
      currentResolver(confirmed);
      currentResolver = null;
    }
    setModal(null);
  };

  useEffect(() => {
    if (!modal) return;
    const handleKeyDown = e => {
      if (e.key === 'Escape') {
        close(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modal]);

  if (!modal) return null;

  const isDanger = modal.type === 'danger';
  const isInfo = modal.type === 'info';

  return (
    <div className="confirm-backdrop" onClick={() => close(false)}>
      <div
        className="confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          className="confirm-modal-close"
          aria-label="Đóng"
          onClick={() => close(false)}
        >
          <X size={17} />
        </button>

        <div className={`confirm-icon-badge ${modal.type}`}>
          {isDanger ? <Trash2 size={24} /> : isInfo ? <Info size={24} /> : <AlertTriangle size={24} />}
        </div>

        <h3 id="confirm-modal-title" className="confirm-title">{modal.title}</h3>
        <p className="confirm-message">{modal.message}</p>

        <div className="confirm-actions">
          {!modal.isAlert && (
            <button
              type="button"
              className="confirm-btn-cancel"
              onClick={() => close(false)}
            >
              {modal.cancelText || 'Hủy'}
            </button>
          )}
          <button
            type="button"
            className={`confirm-btn-action ${modal.type}`}
            autoFocus
            onClick={() => close(true)}
          >
            {modal.confirmText || 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}

