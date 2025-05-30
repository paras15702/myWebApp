

import React from 'react';
import { useToast } from '../context/ToastContext';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div 
      className="toast-container position-fixed end-0 p-3" 
      style={{ 
        zIndex: 1050, 
        maxWidth: '210px', 
        top: '70px', 
        right: '10px', 
        opacity: 0.8 
      }}
    >
      {toasts.map((toast) => (
        <div 
          key={toast.id} 
          className={`toast show d-flex justify-content-between align-items-center text-white bg-${toast.type} border-0`} 
          role="alert" 
          aria-live="assertive" 
          aria-atomic="true"
          style={{ 
            fontSize: '0.7rem', 
            padding: '0.5rem 0.75rem',
            minHeight: '48px',
            lineHeight: '1.2',
            alignItems: 'center'
          }}
        >
          <div style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {toast.message}
          </div>
          <button 
            type="button" 
            className="btn-close btn-close-white ms-2" 
            onClick={() => removeToast(toast.id)} 
            aria-label="Close"
          />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;