import React, { useState, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { useAppData } from '../context/AppDataContext';

/**
 * LogoUploader — panel que permite subir y reemplazar el logo de la pre-factura.
 * Sube el archivo a Firebase Storage y guarda la URL pública en config.logoUrl.
 */
const LogoUploader = ({ onClose }) => {
  const { config, setConfig } = useAppData();
  const [progress,   setProgress]   = useState(0);
  const [uploading,  setUploading]  = useState(false);
  const [preview,    setPreview]    = useState(null);   // base64 preview
  const [file,       setFile]       = useState(null);
  const [done,       setDone]       = useState(false);
  const inputRef = useRef();

  const currentLogo = config?.logoUrl || '/logo-marcosbarco.png';

  /* ── Selección de archivo ── */
  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    // Validar tipo
    if (!f.type.startsWith('image/')) {
      alert('Solo se aceptan imágenes (PNG, JPG, SVG, WEBP).');
      return;
    }
    // Validar tamaño máx 3MB
    if (f.size > 3 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 3MB.');
      return;
    }

    setFile(f);
    setDone(false);

    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  /* ── Subir a Firebase Storage ── */
  const handleUpload = () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);

    const storageRef = ref(storage, `logos/logo-principal.${file.name.split('.').pop()}`);
    const task = uploadBytesResumable(storageRef, file);

    task.on(
      'state_changed',
      (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        setProgress(pct);
      },
      (err) => {
        console.error('Upload error:', err);
        alert('Error al subir el logo: ' + err.message);
        setUploading(false);
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        await setConfig({ logoUrl: url });
        setUploading(false);
        setDone(true);
      }
    );
  };

  /* ── Restaurar logo original ── */
  const handleRestore = async () => {
    if (!window.confirm('¿Restaurar el logo original de Marcos Barco?')) return;
    await setConfig({ logoUrl: null });
    setPreview(null);
    setFile(null);
    setDone(false);
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Logo actual */}
      <div style={{
        background: 'linear-gradient(135deg,#f0f9ff,#e0f2fe)',
        border: '1.5px solid #bae6fd',
        borderRadius: 14, padding: '18px 20px',
        marginBottom: 20, textAlign: 'center',
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          Logo actual en la Pre-Factura
        </div>
        <img
          src={preview || currentLogo}
          alt="Logo actual"
          style={{ maxWidth: 180, maxHeight: 120, objectFit: 'contain', borderRadius: 10, border: '1px solid #e0f2fe', background: 'white', padding: 8 }}
          onError={e => { e.target.src = '/logo-marcosbarco.png'; }}
        />
        {config?.logoUrl && (
          <div style={{ marginTop: 10 }}>
            <button onClick={handleRestore} style={{
              background: 'none', border: '1px solid #f87171', color: '#dc2626',
              borderRadius: 8, padding: '5px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}>
              ↩ Restaurar logo original
            </button>
          </div>
        )}
      </div>

      {/* Zona de carga */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); }}
        onDrop={e => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) { inputRef.current.files = e.dataTransfer.files; handleFileChange({ target: { files: [f] } }); }
        }}
        style={{
          border: `2px dashed ${uploading ? '#94a3b8' : '#3b82f6'}`,
          borderRadius: 14,
          padding: '30px 20px',
          textAlign: 'center',
          cursor: uploading ? 'default' : 'pointer',
          background: uploading ? '#f8fafc' : 'rgba(59,130,246,0.04)',
          transition: 'all 0.2s',
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 8 }}>📁</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1e40af', marginBottom: 4 }}>
          {file ? `📎 ${file.name}` : 'Haz clic o arrastra tu logo aquí'}
        </div>
        <div style={{ fontSize: 11, color: '#64748b' }}>PNG, JPG, WEBP o SVG — máximo 3MB</div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {/* Barra de progreso */}
      {uploading && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#475569', marginBottom: 4 }}>
            <span>Subiendo logo...</span>
            <span style={{ fontWeight: 800, color: '#2563eb' }}>{progress}%</span>
          </div>
          <div style={{ height: 8, background: '#e2e8f0', borderRadius: 20, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg,#2563eb,#06b6d4)',
              borderRadius: 20,
              transition: 'width 0.3s',
            }} />
          </div>
        </div>
      )}

      {/* Mensaje de éxito */}
      {done && (
        <div style={{
          background: 'rgba(5,150,105,0.08)', border: '1px solid #6ee7b7',
          borderRadius: 10, padding: '10px 16px', marginBottom: 16,
          fontSize: 13, fontWeight: 700, color: '#065f46',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          ✅ Logo actualizado correctamente. Ya aparece en todas las pre-facturas.
        </div>
      )}

      {/* Botones */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
        <button onClick={onClose} style={{
          background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569',
          borderRadius: 10, padding: '10px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}>
          Cerrar
        </button>
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          style={{
            background: file && !uploading
              ? 'linear-gradient(135deg,#1e40af,#3b82f6)'
              : '#cbd5e1',
            color: 'white', border: 'none', borderRadius: 10,
            padding: '10px 26px', fontSize: 13, fontWeight: 800,
            cursor: file && !uploading ? 'pointer' : 'default',
            boxShadow: file && !uploading ? '0 4px 14px rgba(37,99,235,0.35)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          {uploading ? `⏳ Subiendo ${progress}%...` : '☁️ Subir y Aplicar Logo'}
        </button>
      </div>
    </div>
  );
};

export default LogoUploader;
