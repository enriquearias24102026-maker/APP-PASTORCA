import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { U } from '../utils';

const CATEGORIAS_BASE = ['Leche', 'Naranjada', 'Néctar', 'Gelatina', 'Yogurt', 'Queso', 'Mantequilla'];
const EMBALAJES       = ['Cesta', 'Bandeja', 'Caja', 'Unidad'];
const MAGIC_VALUE     = '__NUEVA__'; // valor especial para detectar "Agregar nueva"

const ProductoForm = ({ producto, onSave, onCancel }) => {
  const { config, setConfig } = useAppData();

  // Categorías personalizadas del nuevo sistema
  const customCats = (config?.customCats || []).map(c => c.nombre);

  // Unión: base + custom (sin duplicados) + "Otro"
  const allCats = [
    ...CATEGORIAS_BASE,
    ...customCats.filter(n => !CATEGORIAS_BASE.map(b => b.toLowerCase()).includes(n.toLowerCase())),
    'Otro',
  ];

  const [form, setForm] = useState({
    codigo:           producto?.codigo          || '',
    descripcion:      producto?.descripcion     || '',
    presentacion:     producto?.presentacion    || '',
    categoria:        producto?.categoria       || 'Leche',
    embalaje:         producto?.embalaje        || 'Cesta',
    unidadesEmbalaje: producto?.unidadesEmbalaje || 1,
    precioCosto:      producto?.precioCosto     || 0,
    gravable:         producto?.gravable        ?? false,
  });

  // Estado para el input "nueva categoría" inline
  const [addingCat,   setAddingCat]   = useState(false);
  const [newCatInput, setNewCatInput] = useState('');

  const set     = field => e => setForm(p => ({ ...p, [field]: e.target.value }));
  const setNum  = field => e => setForm(p => ({ ...p, [field]: parseFloat(e.target.value) || 0 }));
  const setBool = field => e => setForm(p => ({ ...p, [field]: e.target.value === 'true' }));

  // Detectar selección del valor especial
  const handleCatChange = (e) => {
    if (e.target.value === MAGIC_VALUE) {
      setAddingCat(true);
      setNewCatInput('');
    } else {
      setForm(p => ({ ...p, categoria: e.target.value }));
    }
  };

  // Confirmar la nueva categoría: guardarla en config.customCats y seleccionarla
  const confirmNewCat = () => {
    const name = newCatInput.trim();
    if (!name) { setAddingCat(false); return; }
    const existing = config?.customCats || [];
    const alreadyExists = [
      ...CATEGORIAS_BASE,
      ...existing.map(c => c.nombre),
    ].some(n => n.toLowerCase() === name.toLowerCase());

    if (alreadyExists) {
      alert('Esa categoría ya existe.');
      return;
    }
    // Agregar a customCats en Firebase
    const icons = {};
    const newEntry = { id: 'cc_' + Date.now(), nombre: name, icon: '📦', cat: 'Otro' };
    setConfig({ customCats: [...existing, newEntry] });
    // Seleccionarla en el formulario
    setForm(p => ({ ...p, categoria: name }));
    setAddingCat(false);
    setNewCatInput('');
  };

  const cancelNewCat = () => {
    setAddingCat(false);
    setNewCatInput('');
  };

  const handleSave = () => {
    if (!form.codigo.trim())      { alert('El código del producto es obligatorio.'); return; }
    if (!form.descripcion.trim()) { alert('La descripción es obligatoria.'); return; }
    if (!form.precioCosto)        { alert('El precio de costo debe ser mayor a 0.'); return; }
    onSave({ ...form, ...(producto ? { id: producto.id } : {}) });
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="form-group">
          <label className="form-label">Código *</label>
          <input className="form-input" type="text" value={form.codigo} onChange={set('codigo')} placeholder="Ej: GAI-000225" />
        </div>
        <div className="form-group">
          <label className="form-label">Presentación</label>
          <input className="form-input" type="text" value={form.presentacion} onChange={set('presentacion')} placeholder="Ej: 1000cc, 500g" />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Descripción *</label>
        <input className="form-input" type="text" value={form.descripcion} onChange={set('descripcion')} placeholder="Ej: LECHE PASTEURIZADA PAST" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* ── CATEGORÍA ── */}
        <div className="form-group">
          <label className="form-label">Categoría</label>

          {/* Si está agregando nueva categoría: mostrar input inline */}
          {addingCat ? (
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <input
                autoFocus
                type="text"
                placeholder="Nombre de la nueva categoría..."
                value={newCatInput}
                onChange={e => setNewCatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') confirmNewCat();
                  if (e.key === 'Escape') cancelNewCat();
                }}
                style={{
                  flex:1, padding:'10px 12px', borderRadius:8,
                  border:'2px solid #059669', fontSize:13, fontFamily:'inherit',
                  outline:'none', background:'#f0fdf4',
                }}
              />
              <button
                onClick={confirmNewCat}
                style={{ padding:'10px 14px', borderRadius:8, border:'none', background:'#059669', color:'white', fontWeight:800, cursor:'pointer', fontSize:13 }}
              >✓</button>
              <button
                onClick={cancelNewCat}
                style={{ padding:'10px 12px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', color:'#64748b', cursor:'pointer', fontSize:13 }}
              >✕</button>
            </div>
          ) : (
            <select className="form-select" value={form.categoria} onChange={handleCatChange}>

              <optgroup label="— Categorías Base —">
                {CATEGORIAS_BASE.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="Otro">Otro</option>
              </optgroup>

              {/* Categorías personalizadas del usuario */}
              {customCats.filter(n => !CATEGORIAS_BASE.map(b => b.toLowerCase()).includes(n.toLowerCase())).length > 0 && (
                <optgroup label="★ Nuevas Categorías">
                  {customCats
                    .filter(n => !CATEGORIAS_BASE.map(b => b.toLowerCase()).includes(n.toLowerCase()))
                    .map(n => <option key={n} value={n}>★ {n}</option>)
                  }
                </optgroup>
              )}

              {/* Opción para agregar nueva categoría directamente */}
              <optgroup label="────────────────">
                <option value={MAGIC_VALUE}>➕ Agregar nueva categoría...</option>
              </optgroup>

            </select>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Gravable (IVA)</label>
          <select className="form-select" value={String(form.gravable)} onChange={setBool('gravable')}>
            <option value="false">Exento (sin IVA)</option>
            <option value="true">Gravado (16% IVA)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Tipo Embalaje</label>
          <select className="form-select" value={form.embalaje} onChange={set('embalaje')}>
            {EMBALAJES.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Unidades por Embalaje</label>
          <input className="form-input" type="number" min="1" value={form.unidadesEmbalaje} onChange={setNum('unidadesEmbalaje')} />
        </div>

        <div className="form-group">
          <label className="form-label">Precio de Costo ($) *</label>
          <input className="form-input" type="number" min="0" step="0.01" value={form.precioCosto} onChange={setNum('precioCosto')} />
        </div>

        <div className="form-group">
          <label className="form-label">Precio con 20% margen ($)</label>
          <input className="form-input" type="text" readOnly value={U.fmt(form.precioCosto * 1.20)}
            style={{ background: 'rgba(16,185,129,0.05)', color: 'var(--accent-green)' }} />
        </div>
      </div>

      <div style={{ display:'flex', justifyContent:'flex-end', gap:'12px', marginTop:'20px', paddingTop:'20px', borderTop:'1px solid var(--border-color)' }}>
        <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" onClick={handleSave} style={{ background:'var(--gradient-blue)', color:'white' }}>
          {producto ? '💾 Actualizar Producto' : '✅ Registrar Producto'}
        </button>
      </div>
    </div>
  );
};

export default ProductoForm;
