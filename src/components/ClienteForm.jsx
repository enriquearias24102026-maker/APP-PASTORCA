import React, { useState } from 'react';

const FIELD_STYLE = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: 12,
  border: '2px solid #e2e8f0',
  fontSize: 14,
  color: '#0f172a',
  background: '#f8faff',
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const LABEL_STYLE = {
  display: 'block',
  fontSize: 11,
  fontWeight: 800,
  color: '#1e40af',
  textTransform: 'uppercase',
  letterSpacing: '0.8px',
  marginBottom: 6,
};

const REQUIRED = { color: '#ef4444', marginLeft: 2 };

const Field = ({ label, required, children }) => (
  <div style={{ marginBottom: 4 }}>
    <label style={LABEL_STYLE}>
      {label}{required && <span style={REQUIRED}>*</span>}
    </label>
    {children}
  </div>
);

const ClienteForm = ({ cliente, onSave, onCancel }) => {
  const [form, setForm] = useState({
    nombre:    cliente?.nombre    || '',
    rif:       cliente?.rif       || '',
    telefono:  cliente?.telefono  || '',
    email:     cliente?.email     || '',
    direccion: cliente?.direccion || '',
    contacto:  cliente?.contacto  || '',
  });
  const [focused, setFocused] = useState('');

  const set = field => e => setForm(p => ({ ...p, [field]: e.target.value }));

  const inputStyle = (name) => ({
    ...FIELD_STYLE,
    borderColor: focused === name ? '#2563eb' : form[name] ? '#3b82f6' : '#e2e8f0',
    boxShadow: focused === name ? '0 0 0 3px rgba(37,99,235,0.15)' : 'none',
    background: form[name] ? '#f0f7ff' : '#f8faff',
  });

  const handleSave = () => {
    if (!form.nombre.trim()) { alert('El nombre del cliente es obligatorio.'); return; }
    if (!form.rif.trim())    { alert('El RIF / Cedula es obligatorio.'); return; }
    onSave({ ...form, ...(cliente ? { id: cliente.id } : {}) });
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Header banner */}
      <div style={{
        background: 'linear-gradient(135deg,#1e3a6e,#2563eb)',
        borderRadius: 14, padding: '16px 20px', marginBottom: 22,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{ fontSize: 36, lineHeight: 1 }}>{'🏪'}</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>
            {cliente ? 'Editar datos del cliente' : 'Registrar nuevo cliente'}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
            {'Los campos con (*) son obligatorios'}
          </div>
        </div>
      </div>

      {/* Grid campos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <Field label="Nombre / Razon Social" required>
          <input
            type="text"
            value={form.nombre}
            onChange={set('nombre')}
            placeholder="Ej: Supermercado El Venezolano"
            style={inputStyle('nombre')}
            onFocus={() => setFocused('nombre')}
            onBlur={() => setFocused('')}
          />
        </Field>

        <Field label="RIF / Cedula" required>
          <input
            type="text"
            value={form.rif}
            onChange={set('rif')}
            placeholder="Ej: J-12345678-9 o V-12345678"
            style={inputStyle('rif')}
            onFocus={() => setFocused('rif')}
            onBlur={() => setFocused('')}
          />
        </Field>

        <Field label="Telefono">
          <input
            type="text"
            value={form.telefono}
            onChange={set('telefono')}
            placeholder="Ej: 0291-1234567"
            style={inputStyle('telefono')}
            onFocus={() => setFocused('telefono')}
            onBlur={() => setFocused('')}
          />
        </Field>

        <Field label="Email (opcional)">
          <input
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="contacto@email.com"
            style={inputStyle('email')}
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused('')}
          />
        </Field>

        <Field label="Persona de Contacto">
          <input
            type="text"
            value={form.contacto}
            onChange={set('contacto')}
            placeholder="Nombre del responsable"
            style={inputStyle('contacto')}
            onFocus={() => setFocused('contacto')}
            onBlur={() => setFocused('')}
          />
        </Field>
      </div>

      <Field label="Direccion">
        <textarea
          value={form.direccion}
          onChange={set('direccion')}
          placeholder="Direccion completa del establecimiento..."
          rows={3}
          style={{
            ...inputStyle('direccion'),
            resize: 'vertical',
            lineHeight: 1.6,
          }}
          onFocus={() => setFocused('direccion')}
          onBlur={() => setFocused('')}
        />
      </Field>

      {/* Acciones */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end', gap: 12,
        marginTop: 22, paddingTop: 18,
        borderTop: '2px solid #e2e8f0',
      }}>
        <button
          onClick={onCancel}
          style={{
            background: '#f1f5f9', border: '1.5px solid #e2e8f0',
            color: '#475569', borderRadius: 12,
            padding: '12px 26px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >{'Cancelar'}</button>
        <button
          onClick={handleSave}
          style={{
            background: 'linear-gradient(135deg,#1e40af,#2563eb)',
            border: 'none', color: 'white', borderRadius: 12,
            padding: '12px 28px', fontSize: 14, fontWeight: 800, cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(37,99,235,0.45)',
          }}
        >{cliente ? 'Actualizar Cliente' : 'Registrar Cliente'}</button>
      </div>
    </div>
  );
};

export default ClienteForm;
