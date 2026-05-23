import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';

const ShareModal = ({ isOpen, onClose, item, type, onPrint, data: extraData }) => {
  const { sendTransfer, addItem, config } = useAppData();
  const { user } = useAuth();
  const [targetEmail, setTargetEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '', code: '' });
  const [showEmailOptions, setShowEmailOptions] = useState(false);
  const [clipBoardSuccess, setClipBoardSuccess] = useState(false);

  const activeData = item || extraData;
  if (!isOpen || !activeData) return null;

  const docTypeLabel = activeData.tipoDocumento === 'nota' ? 'Nota de Entrega' : 'Pre-Factura';
  const itemName = activeData.nombre || activeData.nombreCompleto || activeData.razonSocial || 
                   (type === 'pre-factura' ? `${docTypeLabel} #${activeData.numeroPreFactura}` : 'Elemento sin nombre');
  
  let itemInfo = '';
  if (type === 'producto') {
    itemInfo = `📦 Producto: ${activeData.nombre}\n💰 Precio: ${activeData.precioVenta} ${activeData.moneda || 'USD'}\n📝 Ref: ${activeData.referencia || 'N/A'}`;
  } else if (type === 'cliente') {
    itemInfo = `👤 Cliente: ${activeData.nombre}\n📞 Telf: ${activeData.telefono || 'N/A'}\n📧 Email: ${activeData.correo || 'N/A'}`;
  } else if (type === 'pre-factura') {
    itemInfo = `📋 ${docTypeLabel}: ${activeData.numeroPreFactura}\n👤 Cliente: ${activeData.clienteNombre}\n💰 Total: $ ${activeData.total}\n📅 Fecha: ${activeData.fecha}`;
  }

  // Helper to format line breaks for mailto
  const formatForEmail = (text) => text.replace(/\n/g, '%0D%0A');

  // WhatsApp
  const handleWhatsApp = () => {
    const message = `👋 Hola! Te comparto los datos de este ${type} desde mi App Administrativa:\n\n${itemInfo}\n\nEnviado por: ${user?.email || 'un usuario'}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Email sharing functions
  const toggleEmailOptions = () => {
    setShowEmailOptions(!showEmailOptions);
  };

  const handleMailto = () => {
    const subject = `Datos de ${type}: ${itemName}`;
    const body = `Te comparto la información de este ${type}:\n\n${itemInfo}\n\nSaludos!`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${formatForEmail(body)}`;
  };

  const handleGmailWeb = () => {
    const subject = `Datos de ${type}: ${itemName}`;
    const body = `Te comparto la información de este ${type}:\n\n${itemInfo}\n\nSaludos!`;
    const url = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank');
  };

  const handleCopyToClipboard = () => {
    const body = `Te comparto la información de este ${type}:\n\n${itemInfo}\n\nSaludos!`;
    navigator.clipboard.writeText(body).then(() => {
      setClipBoardSuccess(true);
      setTimeout(() => setClipBoardSuccess(false), 3000);
    }).catch(err => {
      console.error('Error al copiar al portapapeles:', err);
      alert('No se pudo copiar al portapapeles. Intenta seleccionarlo manualmente.');
    });
  };

  // Interno (App to App)
  const handleInternal = async (e) => {
    e.preventDefault();
    if (!targetEmail) return;
    setSending(true);
    setStatus({ type: 'info', msg: 'Verificando en la red de usuarios...', code: '' });
    try {
      await sendTransfer({ targetEmail, data: activeData, type });
      setStatus({ type: 'success', msg: '¡Transferencia interna exitosa!', code: '' });
      setTimeout(() => {
        onClose();
        setTargetEmail('');
        setStatus({ type: '', msg: '', code: '' });
      }, 2000);
    } catch (err) {
      if (err.code === 'USER_NOT_FOUND') {
        setStatus({ 
          type: 'error', 
          msg: 'Este correo no está registrado en la App aún.',
          code: 'USER_NOT_FOUND'
        });
      } else {
        setStatus({ 
          type: 'error', 
          msg: err.message || 'Error al conectar con el servidor',
          code: ''
        });
      }
    } finally {
      setSending(false);
    }
  };

  const handleInviteAlly = async () => {
    setSending(true);
    setStatus({ type: 'info', msg: 'Registrando en tu Red de Aliados...', code: '' });
    try {
      // Registrar en la colección de aliados
      await addItem('aliados', {
        nombre: targetEmail.split('@')[0], // Nombre temporal basado en email
        correo: targetEmail,
        fechaInvitacion: new Date().toISOString(),
        tipoRelacion: type,
        empresa: activeData.empresa || activeData.razonSocial || ''
      });
      
      const subject = `Invitación Especial de ${config.nombreEmpresa || 'PASTORCA'}`;
      const body = `👋 ¡Hola!\n\nNo te encontré en la App, así que te invito a unirte a mi Red de Aliados Estratégicos.\n\nTe comparto los datos de este ${type} que gestiono:\n\n${itemInfo}\n\nSi quieres optimizar tu gestión como yo y recibir mis actualizaciones directamente, únete aquí:\nhttps://app-ventas-compras-3ab35.web.app\n\nSaludos,\n${config.adminNombre || 'Tu contacto comercial'}`;
      
      // Intentar abrir el cliente de correo con el destinatario ya puesto
      window.location.href = `mailto:${targetEmail}?subject=${encodeURIComponent(subject)}&body=${formatForEmail(body)}`;

      setStatus({ type: 'success', msg: '✨ ¡Aliado guardado! Se ha abierto tu correo para enviar la invitación.', code: '' });
      setTimeout(() => {
        onClose();
        setTargetEmail('');
        setStatus({ type: '', msg: '', code: '' });
      }, 4000);
    } catch (err) {
      setStatus({ type: 'error', msg: 'No se pudo guardar el aliado en la base de datos.', code: '' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`📤 Compartir ${type === 'producto' ? 'Producto' : type === 'cliente' ? 'Cliente' : 'Pre-Factura'}`}
      size="sm"
    >
      <div style={{ padding: '10px 0' }}>
        <p style={{ marginBottom: '32px', color: '#1e293b', fontSize: '22px', fontWeight: '600', lineHeight: '1.4' }}>
          Estás compartiendo: <br/>
          <strong style={{ color: '#1e40af', fontSize: '28px', fontWeight: '900' }}>{itemName}</strong>
        </p>

        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '16px', fontWeight: '800', color: '#64748b', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            🌍 COMPARTIR EXTERNO (WhatsApp/Email)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button 
              onClick={handleWhatsApp} 
              style={{ 
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', 
                padding: '16px', background: '#25D366', color: 'white', border: 'none', 
                borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '700'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <span style={{ fontSize: '32px' }}>📱</span>
              <span style={{ fontSize: '18px' }}>WhatsApp</span>
            </button>
            
            <button 
              onClick={toggleEmailOptions} 
              style={{ 
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', 
                padding: '16px', background: '#EA4335', color: 'white', border: showEmailOptions ? '3px solid #b91c1c' : 'none', 
                borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '700',
                boxShadow: showEmailOptions ? '0 0 12px rgba(234,67,53,0.5)' : 'none'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <span style={{ fontSize: '32px' }}>📧</span>
              <span style={{ fontSize: '18px' }}>{showEmailOptions ? 'Opciones...' : 'Email'}</span>
            </button>
          </div>

          {showEmailOptions && (
            <div style={{
              marginTop: '12px',
              padding: '14px',
              background: '#f8fafc',
              border: '1.5px dashed #EA4335',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              <p style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: '800', color: '#EA4335', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Selecciona cómo enviar por correo:
              </p>
              
              <button
                type="button"
                onClick={handleMailto}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px', background: 'white', color: '#1e293b',
                  border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer',
                  fontWeight: '700', fontSize: '13px', textAlign: 'left', transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#EA4335'; e.currentTarget.style.background = 'rgba(234,67,53,0.02)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = 'white'; }}
              >
                <span style={{ fontSize: '20px' }}>📬</span>
                <div>
                  <div style={{ fontWeight: 800 }}>Aplicación de Correo (Outlook / Mail)</div>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'normal' }}>Usa el gestor de correo predeterminado del sistema</div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleGmailWeb}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px', background: 'white', color: '#1e293b',
                  border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer',
                  fontWeight: '700', fontSize: '13px', textAlign: 'left', transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#EA4335'; e.currentTarget.style.background = 'rgba(234,67,53,0.02)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = 'white'; }}
              >
                <span style={{ fontSize: '20px' }}>🌐</span>
                <div>
                  <div style={{ fontWeight: 800 }}>Gmail en la Web</div>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'normal' }}>Abre una pestaña de Gmail para redactar desde el navegador</div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleCopyToClipboard}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px', background: 'white', color: '#1e293b',
                  border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer',
                  fontWeight: '700', fontSize: '13px', textAlign: 'left', transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#EA4335'; e.currentTarget.style.background = 'rgba(234,67,53,0.02)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = 'white'; }}
              >
                <span style={{ fontSize: '20px' }}>📋</span>
                <div>
                  <div style={{ fontWeight: 800 }}>Copiar al Portapapeles</div>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'normal' }}>Copia el texto para pegarlo manualmente en tu correo</div>
                </div>
              </button>
              
              {clipBoardSuccess && (
                <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: '800', textAlign: 'center', marginTop: '4px' }}>
                  ¡Texto copiado con éxito! Ya puedes pegarlo.
                </div>
              )}
            </div>
          )}
        </div>

        {onPrint && (
          <button 
            onClick={() => { onPrint(); onClose(); }} 
            style={{ 
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', 
              padding: '16px', background: '#475569', color: 'white', border: 'none', 
              borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '900',
              fontSize: '20px', marginBottom: '24px'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span style={{ fontSize: '28px' }}>🖨️</span>
            <span>IMPRIMIR AHORA</span>
          </button>
        )}

        <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '20px', backgroundColor: '#f8fafc', margin: '0 -15px', padding: '20px 15px', borderRadius: '0 0 16px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1e40af', textTransform: 'uppercase', margin: 0 }}>
              🚀 Transferencia Directa
            </h3>
            <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '900' }}>APP A APP</span>
          </div>
          
          <p style={{ fontSize: '14px', color: '#64748b', fontWeight: '600', marginBottom: '18px' }}>
            Úsalo para enviar datos a otros usuarios registrados en PASTORCA.
          </p>
          
          <form onSubmit={handleInternal}>
            <div style={{ marginBottom: '20px' }}>
              <input 
                type="email" 
                placeholder="Correo del destinatario en la App..."
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                required
                style={{
                  width: '100%', padding: '18px 20px', borderRadius: '12px',
                  border: '2px solid #cbd5e1', outline: 'none', fontSize: '18px',
                  fontWeight: '700', transition: 'all 0.2s', backgroundColor: '#ffffff'
                }}
                onFocus={e => { e.target.style.borderColor = '#3b82f6'; }}
                onBlur={e => { e.target.style.borderColor = '#cbd5e1'; }}
              />
            </div>
            
            {status.msg && (
              <div style={{ 
                padding: '15px', borderRadius: '12px', marginBottom: '16px',
                backgroundColor: status.type === 'error' ? '#fee2e2' : status.type === 'success' ? '#dcfce7' : '#e0f2fe',
                color: status.type === 'error' ? '#dc2626' : status.type === 'success' ? '#16a34a' : '#0284c7',
                fontSize: '16px', fontWeight: '800', textAlign: 'center', border: '1px solid'
              }}>
                {status.code === 'USER_NOT_FOUND' ? '❌ ' : ''} {status.msg}
              </div>
            )}

            {status.code === 'USER_NOT_FOUND' && (
              <div style={{ 
                marginBottom: '16px', padding: '15px', borderRadius: '12px', 
                backgroundColor: '#fff7ed', border: '1px solid #ffedd5' 
              }}>
                <p style={{ fontSize: '15px', color: '#9a3412', fontWeight: '800', textAlign: 'center', marginBottom: '10px' }}>
                  💡 ACLARACIÓN IMPORTANTE:
                </p>
                <p style={{ fontSize: '14px', color: '#7c2d12', fontWeight: '600', textAlign: 'center', lineHeight: '1.4' }}>
                  Estar en tu lista de <strong>Aliados</strong> no es lo mismo que estar registrado en la <strong>App</strong>. <br/><br/>
                  Para usar la "Transferencia Directa", el destinatario debe haber creado su propia cuenta en PASTORCA.
                </p>
                <div style={{ margin: '15px 0', borderTop: '1px solid #ffedd5' }}></div>
                <button 
                  type="button"
                  onClick={handleInviteAlly}
                  style={{ 
                    width: '100%', padding: '18px', borderRadius: '14px', border: 'none',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: 'white', fontWeight: '900', fontSize: '18px', cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(217,119,6,0.2)', textTransform: 'uppercase',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  ✨ INVITAR A REGISTRARSE
                </button>
              </div>
            )}

            <button 
              type="submit" 
              disabled={sending}
              style={{ 
                width: '100%', padding: '18px', borderRadius: '14px', border: 'none',
                background: status.code === 'USER_NOT_FOUND' ? '#94a3b8' : 'linear-gradient(135deg, #1e40af, #2563eb)',
                color: 'white', fontWeight: '900', fontSize: '18px', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37,99,235,0.2)', textTransform: 'uppercase',
                transition: 'all 0.2s'
              }}
            >
              {sending ? '⏳ PROCESANDO...' : '🚀 Enviar por la App'}
            </button>
          </form>
        </div>
      </div>
    </Modal>
  );
};


export default ShareModal;
