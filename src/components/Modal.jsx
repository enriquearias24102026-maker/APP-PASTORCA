import React, { useEffect } from 'react';

const Modal = ({ isOpen, onClose, title, children, size = 'lg' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isFullscreen = size === 'xl' || size === 'fullscreen';

  const containerStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0, 0, 0, 0.85)',
    zIndex: 2147483647, // Máximo z-index posible
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  };

  const maxWidths = { sm: '500px', md: '680px', lg: '900px' };

  const panelStyle = {
    background: '#ffffff',
    border: '4px solid #3b82f6',
    borderRadius: '24px',
    width: '94%',
    maxWidth: isFullscreen ? '1400px' : (maxWidths[size] || maxWidths.lg),
    height: isFullscreen ? '96vh' : 'auto',
    maxHeight: 'calc(100vh - 40px)',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    position: 'relative',
    zIndex: 2147483647,
  };

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={containerStyle}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={panelStyle}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '2px solid #e2e8f0',
          background: isFullscreen ? '#0f172a' : '#ffffff',
          color: isFullscreen ? '#ffffff' : '#1e3a8a',
          borderRadius: '20px 20px 0 0',
        }}>
          <h3 style={{ fontSize: '24px', fontWeight: 900, margin: 0, textTransform: 'uppercase' }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              width: 40, height: 40, borderRadius: '50%',
              border: 'none', background: '#f1f5f9', color: '#64748b',
              cursor: 'pointer', fontSize: 20, fontWeight: 'bold'
            }}
          >✕</button>
        </div>

        <div style={{
          padding: '24px',
          overflowY: 'auto',
          flex: 1,
        }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
