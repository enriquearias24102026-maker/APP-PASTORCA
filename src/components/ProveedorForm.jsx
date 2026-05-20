import React, { useState } from 'react';

const INP = (focused, filled) => ({
  width: '100%',
  padding: '13px 16px',
  borderRadius: 12,
  border: `2px solid ${focused ? '#0891b2' : filled ? '#06b6d4' : '#bae6fd'}`,
  fontSize: 14,
  fontWeight: 600,
  color: '#0c4a6e',
  background: focused ? '#f0f9ff' : filled ? '#e0f7fa' : '#f0fdff',
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'all 0.2s',
  boxShadow: focused ? '0 0 0 4px rgba(6,182,212,0.2)' : 'none',
});

const LBL = {
  display: 'block',
  fontSize: 11,
  fontWeight: 800,
  color: '#0e7490',
  textTransform: 'uppercase',
  letterSpacing: '0.9px',
  marginBottom: 6,
};

const REQ = { color: '#ef4444', marginLeft: 3 };

const ProveedorForm = ({ proveedor, onSave, onCancel }) => {
  const [form, setForm] = useState({
    nombre:    proveedor?.nombre    || '',
    rif:       proveedor?.rif       || '',
    telefono:  proveedor?.telefono  || '',
    email:     proveedor?.email     || '',
    contacto:  proveedor?.contacto  || '',
    direccion: proveedor?.direccion || '',
  });
  const [focused, setFocused] = useState('');

  const set = field => e => setForm(p => ({ ...p, [field]: e.target.value }));
  const inp = (name) => INP(focused === name, !!form[name]);
  const foc = (name) => () => setFocused(name);
  const blur = () => setFocused('');

  const handleSave = () => {
    if (!form.nombre.trim()) { alert('El nombre del proveedor es obligatorio.'); return; }
    if (!form.rif.trim())    { alert('El RIF es obligatorio.'); return; }
    onSave({ ...form, ...(proveedor ? { id: proveedor.id } : {}) });
  };

  const Field = ({ name, label, required, type = 'text', placeholder }) => (
    <div>
      <label style={LBL}>{label}{required && <span style={REQ}>{'*'}</span>}</label>
      <input
        type={type}
        value={form[name]}
        onChange={set(name)}
        placeholder={placeholder}
        style={inp(name)}
        onFocus={foc(name)}
        onBlur={blur}
      />
    </div>
  );

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Banner */}
      <div style={{
        background: 'linear-gradient(135deg,#0c4a6e,#0891b2)',
        borderRadius: 14, padding: '16px 20px', marginBottom: 22,
        display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: '0 6px 20px rgba(8,145,178,0.4)',
      }}>
        <div style={{ fontSize: 36 }}>{'🏭'}</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>
            {proveedor ? 'Editar datos del proveedor' : 'Registrar nuevo proveedor'}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
            {'Los campos con (*) son obligatorios'}
          </div>
        </div>
      </div>

      {/* Grid de campos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <Field name="nombre" label="Nombre / Razon Social" required placeholder="Ej: UPACA" />
        <Field name="rif"    label="RIF" required placeholder="Ej: J-00000000-0" />
        <Field name="telefono" label="Telefono" placeholder="Ej: 0291-0000000" />
        <Field name="email"    label="Email" type="email" placeholder="ventas@proveedor.com" />
        <Field name="contacto" label="Persona de Contacto" placeholder="Departamento o nombre" />
      </div>

      {/* Direccion full width */}
      <div style={{ marginBottom: 4 }}>
        <label style={LBL}>{'Direccion'}</label>
        <textarea
          value={form.direccion}
          onChange={set('direccion')}
          placeholder="Direccion completa del proveedor..."
          rows={3}
          style={{ ...inp('direccion'), resize: 'vertical', lineHeight: 1.6 }}
          onFocus={foc('direccion')}
          onBlur={blur}
        />
      </div>

      {/* Acciones */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end', gap: 12,
        marginTop: 22, paddingTop: 18, borderTop: '2px solid #e0f2fe',
      }}>
        <button
          onClick={onCancel}
          style={{
            background: '#f0fdff', border: '2px solid #bae6fd',
            color: '#0891b2', borderRadius: 12,
            padding: '12px 26px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >{'Cancelar'}</button>
        <button
          onClick={handleSave}
          style={{
            background: 'linear-gradient(135deg,#0891b2,#06b6d4)',
            border: 'none', color: 'white', borderRadius: 12,
            padding: '12px 28px', fontSize: 14, fontWeight: 800, cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(6,182,212,0.45)',
          }}
        >{proveedor ? 'Actualizar Proveedor' : 'Registrar Proveedor'}</button>
      </div>
    </div>
  );
};

export default ProveedorForm;
