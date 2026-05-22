import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { U } from '../utils';
import Modal from './Modal';

// Configuración de Supabase Storage
const SUPABASE_URL = 'https://styeihrihercdpwiecdp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0eWVpaHJpaGVyY2Rwd2llY2RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMDExMTksImV4cCI6MjA5NDg3NzExOX0.Pi2MO1ZnoEhY4wS_qD4XOPvoCQ3Y73nbdk7HUeBiOJk';
const BUCKET_NAME = 'archivos-pdf';

const Archivo = ({ type }) => {
  const { data, addItem, removeItem, setCurrentView } = useAppData();
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [viewingPdf,  setViewingPdf]    = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [dragOver, setDragOver]         = useState(false);
  const [uploading, setUploading]       = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError]   = useState(null);

  const listKey  = type === 'UPACA' ? 'archivosUpaca' : 'archivosClientes';
  const archives = data[listKey] || [];

  const isUpaca   = type === 'UPACA';
  const accent    = isUpaca ? '#0891b2' : '#059669';
  const accentBg  = isUpaca ? 'rgba(6,182,212,0.1)' : 'rgba(5,150,105,0.1)';
  const gradient  = isUpaca
    ? 'linear-gradient(135deg,#0891b2,#06b6d4)'
    : 'linear-gradient(135deg,#059669,#10b981)';
  const glow      = isUpaca ? 'rgba(6,182,212,0.35)' : 'rgba(16,185,129,0.35)';
  const icon      = isUpaca ? '🧾' : '👥';
  const typeLabel = isUpaca ? 'Facturas Proveedores' : 'Documentos Clientes';

  // Límite seguro para Firestore directo (base64 inflates ~33%, so 700KB file → ~933KB base64)
  const FIRESTORE_SAFE_LIMIT = 700 * 1024; // 700 KB

  /* ── Subir PDF: intenta Supabase Storage, si falla usa Firestore directo ── */
  const processFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    // ── INTENTO 1: Supabase Storage (sin límite práctico) ──
    try {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${listKey}/${timestamp}_${safeName}`;
      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${filePath}`;

      setUploadProgress(20);

      // Subimos usando fetch directamente a la API REST de Supabase Storage
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': file.type,
        },
        body: file
      });

      setUploadProgress(70);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error del servidor Supabase (${response.status})`);
      }

      // Si la subida fue exitosa, generamos la URL pública
      const downloadURL = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;

      await addItem(listKey, {
        name: file.name,
        date: U.today(),
        size: file.size >= 1048576
          ? (file.size / 1048576).toFixed(2) + ' MB'
          : (file.size / 1024).toFixed(2) + ' KB',
        content: downloadURL,
        storagePath: filePath,
        type: file.type,
      });

      setUploadProgress(100);
      setUploading(false);
      setIsModalOpen(false);
      return; // Éxito con Supabase Storage
    } catch (storageErr) {
      console.warn('⚠️ Supabase Storage falló o requiere políticas de acceso:', storageErr.message);
      // Guardamos el error para mostrarlo en caso de que Firestore también falle o el archivo sea muy grande
      const isPolicyError = storageErr.message.includes('403') || storageErr.message.includes('401') || storageErr.message.includes('policies');
      
      if (file.size > FIRESTORE_SAFE_LIMIT) {
        setUploadError(
          isPolicyError 
            ? 'Error de acceso (403): Asegúrate de haber agregado la política de subida (INSERT) en tu bucket de Supabase.'
            : `Error al subir a Supabase: ${storageErr.message}. Y el archivo es demasiado grande para Firestore (${(file.size / 1024).toFixed(0)} KB).`
        );
        setUploading(false);
        return;
      }
      console.log('Fallback: intentando guardar en Firestore directamente...');
    }

    // ── INTENTO 2: Firestore directo (base64, con límite de tamaño) ──
    try {
      setUploadProgress(40);
      const reader = new FileReader();
      const base64 = await new Promise((resolve, reject) => {
        reader.onload = (ev) => resolve(ev.target.result);
        reader.onerror = () => reject(new Error('Error leyendo archivo'));
        reader.readAsDataURL(file);
      });

      setUploadProgress(60);
      await addItem(listKey, {
        name: file.name,
        date: U.today(),
        size: file.size >= 1048576
          ? (file.size / 1048576).toFixed(2) + ' MB'
          : (file.size / 1024).toFixed(2) + ' KB',
        content: base64,
        type: file.type,
      });

      setUploadProgress(100);
      setUploading(false);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error guardando PDF:', err);
      setUploadError('Error al guardar el archivo: ' + err.message);
      setUploading(false);
    }
  };

  const handleFileUpload = (e) => processFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') processFile(file);
  };

  const thSt = {
    padding: '12px 18px', textAlign: 'left', fontSize: '11px', fontWeight: 800,
    textTransform: 'uppercase', letterSpacing: '1px', color: '#1e293b',
    borderBottom: `3px solid ${accent}`, background: '#f8fafc',
    whiteSpace: 'nowrap',
  };
  const tdSt = {
    padding: '13px 18px', fontSize: '13px', color: '#1e293b',
    borderBottom: '1px solid #e2e8f0', verticalAlign: 'middle',
  };

  const totalSizeLabel = (() => {
    const bytes = archives.reduce((s, f) => {
      const n = parseFloat(f.size);
      if (f.size?.includes('MB')) return s + n * 1048576;
      if (f.size?.includes('KB')) return s + n * 1024;
      return s;
    }, 0);
    return bytes >= 1048576 ? (bytes/1048576).toFixed(2)+' MB' : (bytes/1024).toFixed(2)+' KB';
  })();
  const lastUpload = archives.length > 0 ? [...archives].sort((a,b) => b.date?.localeCompare(a.date))[0]?.date : null;

  return (
    <div className="view-container">

      {/* ── HERO HEADER ── */}
      <div style={{
        background: `linear-gradient(135deg,#0f172a 0%,#1e3a6e 60%,${accent} 100%)`,
        borderRadius: '20px', padding: '26px 32px', marginBottom: '24px',
        border: `1px solid ${accent}40`,
        boxShadow: `0 10px 36px ${glow}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px',
      }}>
        <div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '6px' }}>
            {'PASTORCA · Repositorio de Archivos PDF'}
          </div>
          <h2 style={{ margin:0, fontSize:'24px', fontWeight:900, color:'white', letterSpacing:'-0.5px' }}>
            {icon+' Archivo — '+typeLabel}
          </h2>
          <div style={{ marginTop:'10px', display:'flex', gap:'10px', flexWrap:'wrap' }}>
            <span style={{ background:'rgba(255,255,255,0.12)', borderRadius:'20px', padding:'4px 14px', fontSize:'12px', color:'rgba(255,255,255,0.85)', fontWeight:600 }}>
              {'Archivos: '+archives.length}
            </span>
            <span style={{ background:'rgba(255,255,255,0.08)', borderRadius:'20px', padding:'4px 14px', fontSize:'12px', color:'rgba(255,255,255,0.7)', fontWeight:600 }}>
              {'Almacenamiento: '+totalSizeLabel}
            </span>
            {lastUpload && (
              <span style={{ background:'rgba(255,255,255,0.08)', borderRadius:'20px', padding:'4px 14px', fontSize:'12px', color:'rgba(255,255,255,0.7)', fontWeight:600 }}>
                {'Ultimo: '+U.fmtDate(lastUpload)}
              </span>
            )}
          </div>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <button
            onClick={() => setCurrentView('dashboard')}
            style={{
              background:'rgba(255,255,255,0.1)', border:'1.5px solid rgba(255,255,255,0.3)',
              color:'white', borderRadius:'12px', padding:'12px 20px',
              fontSize:'13px', fontWeight:700, cursor:'pointer',
              display:'flex', alignItems:'center', gap:6,
            }}
          >{'<- Panel Principal'}</button>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              background: gradient, border:'none', color:'white',
              borderRadius:'12px', padding:'12px 26px', fontSize:'14px', fontWeight:800,
              cursor:'pointer', display:'flex', alignItems:'center', gap:'8px',
              boxShadow:`0 4px 16px ${glow}`,
            }}
          >{'Subir PDF'}</button>
        </div>
      </div>

      {/* ── KPI STATS ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
        {[
          { label:'Archivos Guardados', value: archives.length, sub:'documentos PDF', color: accent, bg: accentBg, border: accent+'40' },
          { label:'Espacio Utilizado',  value: totalSizeLabel, sub:'almacenamiento local', color:'#7c3aed', bg:'rgba(124,58,237,0.08)', border:'rgba(124,58,237,0.3)' },
          { label:'Ultimo Registro',   value: lastUpload ? U.fmtDate(lastUpload) : 'Sin archivos', sub:'fecha de subida', color:'#d97706', bg:'rgba(217,119,6,0.08)', border:'rgba(217,119,6,0.3)' },
        ].map(k => (
          <div key={k.label} style={{
            background: k.bg, border:`1.5px solid ${k.border}`,
            borderRadius:16, padding:'18px 22px',
            display:'flex', alignItems:'center', gap:16,
          }}>
            <div>
              <div style={{ fontSize:10, fontWeight:800, color:'#64748b', textTransform:'uppercase', letterSpacing:'1px', marginBottom:4 }}>{k.label}</div>
              <div style={{ fontSize:22, fontWeight:900, color:k.color, lineHeight:1, marginBottom:4 }}>{k.value}</div>
              <div style={{ fontSize:11, color:'#94a3b8', fontStyle:'italic' }}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── FILE TABLE ── */}
      <div style={{
        background:'white', borderRadius:'16px', overflow:'hidden',
        border:`1px solid ${accent}30`,
        boxShadow:`0 4px 20px ${glow}`,
      }}>
        {/* Table header bar */}
        <div style={{
          background: gradient, padding:'13px 20px',
          display:'flex', justifyContent:'space-between', alignItems:'center',
        }}>
          <span style={{ fontSize:'13px', fontWeight:800, color:'white', display:'flex', alignItems:'center', gap:'8px' }}>
            {icon} Listado de Archivos
            <span style={{
              background:'rgba(255,255,255,0.2)', borderRadius:'12px',
              padding:'2px 10px', fontSize:'11px',
            }}>
              {archives.length} registros
            </span>
          </span>
          <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.7)' }}>
            Solo archivos PDF · Almacenamiento local
          </span>
        </div>

        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                <th style={thSt}>📅 Fecha</th>
                <th style={thSt}>📄 Nombre del Archivo</th>
                <th style={{ ...thSt, textAlign:'center' }}>📦 Tamaño</th>
                <th style={{ ...thSt, textAlign:'center' }}>⚙️ Acciones</th>
              </tr>
            </thead>
            <tbody>
              {archives.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding:'60px', textAlign:'center' }}>
                    <div style={{ fontSize:'52px', marginBottom:'12px' }}>📭</div>
                    <div style={{ fontSize:'16px', fontWeight:700, color:'#334155', marginBottom:'6px' }}>
                      No hay archivos en este repositorio
                    </div>
                    <div style={{ fontSize:'13px', color:'#64748b' }}>
                      Haz clic en <span onClick={() => setIsModalOpen(true)} style={{ color: accent, cursor: 'pointer', textDecoration: 'underline', fontWeight: 800 }}>⬆️ Subir PDF</span> para agregar el primer archivo
                    </div>
                  </td>
                </tr>
              )}
              {archives.map((file, idx) => (
                <tr key={idx}
                  style={{ background: idx % 2 === 0 ? 'white' : '#f8fafc', transition:'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = accentBg}
                  onMouseLeave={e => e.currentTarget.style.background = idx%2===0 ? 'white' : '#f8fafc'}
                >
                  <td style={tdSt}>
                    <span style={{
                      display:'inline-block', background:`${accent}15`, color: accent,
                      borderRadius:'8px', padding:'3px 10px', fontSize:'12px', fontWeight:700,
                    }}>
                      {U.fmtDate(file.date)}
                    </span>
                  </td>
                  <td style={{ ...tdSt, fontWeight:700, color:'#0f172a', maxWidth:'360px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <span style={{
                        fontSize:'20px', background:'#fee2e2', borderRadius:'8px',
                        padding:'4px 6px', lineHeight:1,
                      }}>📄</span>
                      <span style={{ wordBreak:'break-all' }}>{file.name}</span>
                    </div>
                  </td>
                  <td style={{ ...tdSt, textAlign:'center' }}>
                    <span style={{
                      background:'#f1f5f9', color:'#475569', borderRadius:'8px',
                      padding:'4px 12px', fontSize:'12px', fontWeight:600,
                    }}>
                      {file.size}
                    </span>
                  </td>
                  <td style={{ ...tdSt, textAlign:'center' }}>
                    <div style={{ display:'flex', gap:'8px', justifyContent:'center' }}>
                      <button
                        onClick={() => setViewingPdf(file)}
                        style={{
                          background: gradient, color:'white', border:'none',
                          borderRadius:'8px', padding:'7px 14px', fontSize:'12px',
                          fontWeight:700, cursor:'pointer',
                          boxShadow:`0 2px 8px ${glow}`,
                        }}
                      >
                        👁 Ver PDF
                      </button>
                      <button
                        onClick={() => setConfirmDelete(idx)}
                        style={{
                          background:'rgba(239,68,68,0.1)', color:'#dc2626',
                          border:'1px solid rgba(239,68,68,0.3)',
                          borderRadius:'8px', padding:'7px 12px',
                          fontSize:'12px', fontWeight:700, cursor:'pointer',
                        }}
                      >
                        🗑️ Borrar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: SUBIR PDF ── */}
      <Modal isOpen={isModalOpen} onClose={() => !uploading && setIsModalOpen(false)} title={`Subir Factura PDF — ${isUpaca ? 'Proveedor' : 'Cliente'}`}>
        <div style={{ padding:'8px' }}>
          <div
            onDragOver={e => { e.preventDefault(); if (!uploading) setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={uploading ? undefined : handleDrop}
            style={{
              border: `2px dashed ${uploading ? '#94a3b8' : dragOver ? accent : '#cbd5e1'}`,
              borderRadius:'16px', padding:'48px 24px',
              textAlign:'center', background: uploading ? '#f1f5f9' : dragOver ? accentBg : '#f8fafc',
              transition:'all 0.2s', cursor: uploading ? 'default' : 'pointer',
              opacity: uploading ? 0.7 : 1,
            }}
            onClick={() => !uploading && document.getElementById('pdf-file-input').click()}
          >
            <div style={{ fontSize:'48px', marginBottom:'12px' }}>{uploading ? '⏳' : '📤'}</div>
            <div style={{ fontSize:'16px', fontWeight:700, color:'#1e293b', marginBottom:'6px' }}>
              {uploading ? 'Subiendo archivo a la nube...' : 'Arrastra el PDF aquí o haz clic para seleccionar'}
            </div>
            <div style={{ fontSize:'12px', color:'#64748b' }}>
              {uploading ? `Progreso: ${uploadProgress}%` : 'Solo archivos PDF · Se guardan en la nube de forma segura'}
            </div>
            <input
              id="pdf-file-input"
              type="file"
              accept="application/pdf"
              onChange={handleFileUpload}
              style={{ display:'none' }}
              disabled={uploading}
            />
          </div>

          {/* Barra de progreso */}
          {uploading && (
            <div style={{ marginTop:'16px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', color:'#475569', marginBottom:'4px' }}>
                <span>Subiendo a Firebase Storage...</span>
                <span style={{ fontWeight:800, color: accent }}>{uploadProgress}%</span>
              </div>
              <div style={{ height:8, background:'#e2e8f0', borderRadius:20, overflow:'hidden' }}>
                <div style={{
                  height:'100%',
                  width:`${uploadProgress}%`,
                  background: gradient,
                  borderRadius:20,
                  transition:'width 0.3s',
                }} />
              </div>
            </div>
          )}

          {/* Mensaje de error */}
          {uploadError && (
            <div style={{
              marginTop:'12px', background:'rgba(239,68,68,0.08)', border:'1px solid #fca5a5',
              borderRadius:10, padding:'10px 16px', fontSize:13, fontWeight:700, color:'#dc2626',
              display:'flex', alignItems:'center', gap:8,
            }}>
              ❌ {uploadError}
            </div>
          )}

          <button
            style={{
              marginTop:'16px', width:'100%', background: uploading ? '#94a3b8' : gradient,
              color:'white', border:'none', borderRadius:'10px',
              padding:'13px', fontSize:'14px', fontWeight:800,
              cursor: uploading ? 'default' : 'pointer',
              boxShadow: uploading ? 'none' : `0 4px 16px ${glow}`,
            }}
            onClick={() => !uploading && document.getElementById('pdf-file-input').click()}
            disabled={uploading}
          >
            {uploading ? `⏳ Subiendo ${uploadProgress}%...` : '📂 Seleccionar Archivo PDF'}
          </button>
        </div>
      </Modal>

      {/* ── MODAL: VER PDF ── */}
      {viewingPdf && (
        <Modal isOpen={!!viewingPdf} onClose={() => setViewingPdf(null)} title={`📄 ${viewingPdf.name}`}>
          <iframe
            src={viewingPdf.content}
            width="100%" height="620px"
            style={{ border:'none', borderRadius:'8px' }}
            title="PDF Preview"
          />
        </Modal>
      )}

      {/* ── MODAL: CONFIRMAR BORRADO ── */}
      {confirmDelete !== null && (
        <Modal isOpen={true} onClose={() => setConfirmDelete(null)} title="⚠️ Confirmar Eliminación">
          <div style={{ padding:'20px', textAlign:'center' }}>
            <div style={{ fontSize:'52px', marginBottom:'12px' }}>🗑️</div>
            <p style={{ fontSize:'15px', color:'#334155', marginBottom:'8px', fontWeight:600 }}>
              ¿Seguro que deseas eliminar este archivo?
            </p>
            <p style={{
              color:'#dc2626', fontWeight:700, marginBottom:'28px',
              background:'rgba(239,68,68,0.08)', borderRadius:'8px', padding:'8px 16px',
              fontSize:'13px',
            }}>
              📄 {archives[confirmDelete]?.name}
            </p>
            <div style={{ display:'flex', gap:'12px', justifyContent:'center' }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  background:'#f1f5f9', border:'1px solid #e2e8f0', color:'#334155',
                  borderRadius:'10px', padding:'10px 24px', fontSize:'13px',
                  fontWeight:700, cursor:'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => { removeItem(listKey, archives[confirmDelete]?.id); setConfirmDelete(null); }}
                style={{
                  background:'linear-gradient(135deg,#dc2626,#ef4444)',
                  color:'white', border:'none', borderRadius:'10px',
                  padding:'10px 24px', fontSize:'13px', fontWeight:700,
                  cursor:'pointer', boxShadow:'0 4px 12px rgba(239,68,68,0.4)',
                }}
              >
                🗑️ Sí, Eliminar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Archivo;
