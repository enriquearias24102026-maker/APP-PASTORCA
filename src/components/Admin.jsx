import React, { useState, useRef } from 'react';
import { useAppData } from '../context/AppDataContext';
import { U } from '../utils';

/* ─────────────────────────────────────────────
   PANEL DE ADMINISTRACIÓN
   - Configuración de empresa (logo, nombre, RIF, admin)
   - Gestión de vendedores (CRUD)
───────────────────────────────────────────── */
const Admin = () => {
  const { config, setConfig, data, addItem, updateItem, removeItem, setCurrentView } = useAppData();
  const fileInputRef = useRef(null);

  // ── Company form ──
  const [companyForm, setCompanyForm] = useState({
    nombreEmpresa:    config.nombreEmpresa    || 'UPACA',
    rif:              config.rif              || 'J-07001900-0',
    direccion:        config.direccion        || 'Maturín, Monagas, Venezuela',
    telefono:         config.telefono         || '0412',
    adminNombre:      config.adminNombre      || 'MARCOS MANUEL BARCO GUEVARA',
    adminCedula:      config.adminCedula      || 'V-132498396',
    adminCargo:       config.adminCargo       || 'Representante de Ventas',
    adminEmail:       config.adminEmail       || '',
    logoUrl:          config.logoUrl          || '/logo-upaca.png',
  });
  const [companySaved, setCompanySaved] = useState(false);

  // ── Vendedor form ──
  const emptyVendedor = { codigo: '', nombre: '', cedula: '', telefono: '', email: '', cargo: '', fechaIngreso: '', fechaEgreso: '' };
  const [vendedorForm, setVendedorForm] = useState(emptyVendedor);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState('empresa'); // 'empresa' | 'vendedores' | 'posiciones'

  // ── Posiciones Vacantes ──
  const POSICIONES_DEFAULT = [
    { id: 'p1', titulo: 'Gerente de Ventas',         estatus: 'Vacante' },
    { id: 'p2', titulo: 'Gerente de Finanzas',        estatus: 'Vacante' },
    { id: 'p3', titulo: 'Administrador de Ventas',    estatus: 'Vacante' },
    { id: 'p4', titulo: 'Administrador de Compras',   estatus: 'Vacante' },
    { id: 'p5', titulo: 'Vendedor Zona A',            estatus: 'Vacante' },
    { id: 'p6', titulo: 'Vendedor Zona B',            estatus: 'Vacante' },
    { id: 'p7', titulo: 'Vendedor Zona C',            estatus: 'Vacante' },
  ];
  const [posiciones, setPosiciones] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ag_posiciones')) || POSICIONES_DEFAULT; } catch { return POSICIONES_DEFAULT; }
  });
  const savePosiciones = (list) => {
    setPosiciones(list);
    localStorage.setItem('ag_posiciones', JSON.stringify(list));
  };
  const emptyPos = { titulo: '', estatus: 'Vacante', zona: '', requisitos: '' };
  const [posForm, setPosForm] = useState(emptyPos);
  const [editingPosId, setEditingPosId] = useState(null);

  const handlePosSave = () => {
    if (!posForm.titulo.trim()) { alert('El título es obligatorio.'); return; }
    if (editingPosId) {
      savePosiciones(posiciones.map(p => p.id === editingPosId ? { ...posForm, id: editingPosId } : p));
    } else {
      savePosiciones([...posiciones, { ...posForm, id: String(Date.now()) }]);
    }
    setPosForm(emptyPos); setEditingPosId(null);
  };
  const handlePosEdit = (p) => { setPosForm({ titulo: p.titulo, estatus: p.estatus, zona: p.zona || '', requisitos: p.requisitos || '' }); setEditingPosId(p.id); };
  const handlePosDelete = (id) => { if (window.confirm('¿Eliminar esta posición?')) savePosiciones(posiciones.filter(p => p.id !== id)); };
  const handlePosCancelEdit = () => { setPosForm(emptyPos); setEditingPosId(null); };

  const vendedores = data.vendedores || [];

  // ── Logo upload ──
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setCompanyForm(f => ({ ...f, logoUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // ── Save company config ──
  const handleSaveCompany = () => {
    setConfig(companyForm);
    setCompanySaved(true);
    setTimeout(() => setCompanySaved(false), 2500);
  };

  // ── Vendedor CRUD ──
  const handleVendedorSave = () => {
    if (!vendedorForm.nombre.trim()) { alert('El nombre es obligatorio.'); return; }
    if (!vendedorForm.codigo.trim()) { alert('El código es obligatorio.'); return; }
    if (editingId) {
      updateItem('vendedores', { ...vendedorForm, id: editingId });
    } else {
      addItem('vendedores', vendedorForm);
    }
    setVendedorForm(emptyVendedor);
    setEditingId(null);
  };

  const handleVendedorEdit = (v) => {
    setVendedorForm({ codigo: v.codigo, nombre: v.nombre, cedula: v.cedula, telefono: v.telefono, email: v.email, cargo: v.cargo, fechaIngreso: v.fechaIngreso || '', fechaEgreso: v.fechaEgreso || '' });
    setEditingId(v.id);
    setActiveTab('vendedores');
  };

  const handleVendedorDelete = (id) => {
    if (!window.confirm('¿Eliminar este vendedor?')) return;
    removeItem('vendedores', id);
  };

  const handleVendedorCancel = () => {
    setVendedorForm(emptyVendedor);
    setEditingId(null);
  };

  // ─── Styles ───
  const tabStyle = (active, color='#1e40af') => ({
    padding: '11px 24px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
    borderRadius: '12px 12px 0 0', border: 'none', outline: 'none',
    background: active ? 'white' : 'transparent',
    color: active ? color : 'rgba(255,255,255,0.65)',
    borderBottom: active ? `3px solid ${color}` : '3px solid transparent',
    transition: 'all 0.2s',
  });

  // Campo con color propio
  const fld = (color) => ({
    width: '100%', padding: '12px 16px', borderRadius: 12,
    border: `2px solid ${color}55`,
    background: `${color}10`,
    color: '#0f172a', fontSize: '13px', fontWeight: 600,
    fontFamily: 'Inter,sans-serif', boxSizing: 'border-box',
    outline: 'none', transition: 'all 0.2s',
  });

  const lbl = (color) => ({
    fontSize: '11px', fontWeight: 800, color: color,
    textTransform: 'uppercase', letterSpacing: '0.9px',
    marginBottom: '6px', display: 'block',
  });

  // Alias por compatibilidad con tabs de vendedores/posiciones
  const inputStyle = fld('#6366f1');
  const labelStyle = lbl('#6366f1');

  return (
    <div className="view-container" style={{ fontFamily:'Inter,sans-serif' }}>

      {/* HERO HEADER */}
      <div style={{
        background:'linear-gradient(135deg,#0f172a,#1e1b4b,#1e40af)',
        borderRadius:20, padding:'26px 32px', marginBottom:24,
        boxShadow:'0 10px 36px rgba(99,102,241,0.4)',
        border:'1px solid rgba(99,102,241,0.35)',
        display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16,
      }}>
        <div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:2, marginBottom:6 }}>
            {'PASTORCA · Panel de Configuracion'}
          </div>
          <h2 style={{ margin:0, fontSize:24, fontWeight:900, color:'white', letterSpacing:'-0.5px' }}>
            {'Administracion del Sistema'}
          </h2>
          <div style={{ fontSize:12, color:'#a5b4fc', marginTop:6 }}>
            {'Empresa · Vendedores · Posiciones Vacantes'}
          </div>
        </div>
        <button onClick={() => setCurrentView('dashboard')} style={{
          background:'rgba(255,255,255,0.1)', border:'1.5px solid rgba(255,255,255,0.3)',
          color:'white', borderRadius:12, padding:'11px 22px',
          fontSize:13, fontWeight:700, cursor:'pointer',
        }}>{'<- Panel Principal'}</button>
      </div>

      {/* TABS */}
      <div style={{ display:'flex', gap:4, background:'linear-gradient(135deg,#1e1b4b,#1e40af)', borderRadius:'14px 14px 0 0', padding:'10px 12px 0' }}>
        <button style={tabStyle(activeTab==='empresa','#6366f1')}   onClick={()=>setActiveTab('empresa')}>{'Empresa y Admin'}</button>
        <button style={tabStyle(activeTab==='vendedores','#10b981')} onClick={()=>setActiveTab('vendedores')}>
          {'Vendedores'}
          {vendedores.length>0 && <span style={{ marginLeft:8, background:'#10b981', color:'white', borderRadius:12, padding:'1px 8px', fontSize:11 }}>{vendedores.length}</span>}
        </button>
        <button style={tabStyle(activeTab==='posiciones','#f59e0b')} onClick={()=>setActiveTab('posiciones')}>
          {'Posiciones Vacantes'}
          <span style={{ marginLeft:8, background:'#f59e0b', color:'white', borderRadius:12, padding:'1px 8px', fontSize:11 }}>{posiciones.filter(p=>p.estatus==='Vacante').length}</span>
        </button>
      </div>

      <div style={{ background:'white', borderRadius:'0 0 18px 18px', padding:28, border:'1px solid rgba(99,102,241,0.2)', borderTop:'none', boxShadow:'0 8px 28px rgba(99,102,241,0.1)' }}>

        {/* TAB: EMPRESA */}
        {activeTab === 'empresa' && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:32, alignItems:'start' }}>

              {/* Logo */}
              <div style={{ textAlign:'center' }}>
                <div style={{ marginBottom:12, padding:12, background:'linear-gradient(135deg,#ede9fe,#ddd6fe)', borderRadius:16, border:'2px dashed #a78bfa' }}>
                  <img src={companyForm.logoUrl} alt="Logo"
                    style={{ width:130, height:130, objectFit:'contain', borderRadius:12 }}
                    onError={e=>{e.target.src='/logo-upaca.png';}}
                  />
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} style={{ display:'none' }} />
                <button onClick={()=>fileInputRef.current.click()} style={{
                  background:'linear-gradient(135deg,#7c3aed,#8b5cf6)', border:'none', color:'white',
                  borderRadius:10, padding:'10px 16px', fontSize:12, fontWeight:700, cursor:'pointer', width:'100%',
                  boxShadow:'0 4px 12px rgba(124,58,237,0.4)',
                }}>{'Cambiar Logo'}</button>
                <div style={{ fontSize:10, color:'#94a3b8', marginTop:6 }}>{'PNG, JPG o SVG'}</div>
              </div>

              {/* Campos empresa - cada uno con su color */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

                <div style={{ gridColumn:'1 / -1' }}>
                  <label style={lbl('#2563eb')}>{'Nombre de la Empresa'}</label>
                  <input style={fld('#2563eb')} value={companyForm.nombreEmpresa}
                    onChange={e=>setCompanyForm(f=>({...f,nombreEmpresa:e.target.value}))}
                    placeholder="Ej: UPACA" />
                </div>

                <div>
                  <label style={lbl('#7c3aed')}>{'RIF'}</label>
                  <input style={fld('#7c3aed')} value={companyForm.rif}
                    onChange={e=>setCompanyForm(f=>({...f,rif:e.target.value}))}
                    placeholder="J-XXXXXXXX-X" />
                </div>

                <div>
                  <label style={lbl('#0891b2')}>{'Telefono'}</label>
                  <input style={fld('#0891b2')} value={companyForm.telefono}
                    onChange={e=>setCompanyForm(f=>({...f,telefono:e.target.value}))}
                    placeholder="0412-XXXXXXX" />
                </div>

                <div style={{ gridColumn:'1 / -1' }}>
                  <label style={lbl('#059669')}>{'Direccion'}</label>
                  <input style={fld('#059669')} value={companyForm.direccion}
                    onChange={e=>setCompanyForm(f=>({...f,direccion:e.target.value}))}
                    placeholder="Ciudad, Estado, Pais" />
                </div>

                {/* Separador Admin */}
                <div style={{ gridColumn:'1 / -1', borderTop:'2px dashed #e0e7ff', paddingTop:16, marginTop:4 }}>
                  <div style={{ fontSize:13, fontWeight:800, color:'#6366f1', marginBottom:14, textTransform:'uppercase', letterSpacing:1 }}>
                    {'Datos del Administrador'}
                  </div>
                </div>

                <div style={{ gridColumn:'1 / -1' }}>
                  <label style={lbl('#dc2626')}>{'Nombre Completo'}</label>
                  <input style={fld('#dc2626')} value={companyForm.adminNombre}
                    onChange={e=>setCompanyForm(f=>({...f,adminNombre:e.target.value}))}
                    placeholder="Nombre y Apellido" />
                </div>

                <div>
                  <label style={lbl('#d97706')}>{'Cedula / RIF Personal'}</label>
                  <input style={fld('#d97706')} value={companyForm.adminCedula}
                    onChange={e=>setCompanyForm(f=>({...f,adminCedula:e.target.value}))}
                    placeholder="V-XXXXXXXX" />
                </div>

                <div>
                  <label style={lbl('#059669')}>{'Cargo'}</label>
                  <input style={fld('#059669')} value={companyForm.adminCargo}
                    onChange={e=>setCompanyForm(f=>({...f,adminCargo:e.target.value}))}
                    placeholder="Ej: Representante de Ventas" />
                </div>

                <div style={{ gridColumn:'1 / -1' }}>
                  <label style={lbl('#0891b2')}>{'Correo Electronico'}</label>
                  <input style={fld('#0891b2')} type="email" value={companyForm.adminEmail}
                    onChange={e=>setCompanyForm(f=>({...f,adminEmail:e.target.value}))}
                    placeholder="correo@empresa.com" />
                </div>

              </div>
            </div>

            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:24, paddingTop:20, borderTop:'2px solid #e0e7ff', gap:12, alignItems:'center' }}>
              {companySaved && (
                <span style={{ fontSize:13, color:'#10b981', fontWeight:700 }}>{'Configuracion guardada!'}</span>
              )}
              <button onClick={handleSaveCompany} style={{
                background:'linear-gradient(135deg,#059669,#10b981)', border:'none', color:'white',
                borderRadius:12, padding:'13px 32px', fontSize:14, fontWeight:800, cursor:'pointer',
                boxShadow:'0 6px 20px rgba(16,185,129,0.4)',
              }}>{'Guardar Configuracion'}</button>
            </div>
          </div>
        )}

        {/* ══ TAB: VENDEDORES ══ */}
        {activeTab === 'vendedores' && (
          <div>
            {/* Form */}
            <div style={{ background: editingId ? 'rgba(139,92,246,0.06)' : 'rgba(59,130,246,0.06)', border: `1px solid ${editingId ? 'rgba(139,92,246,0.3)' : 'rgba(59,130,246,0.3)'}`, borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 16px', fontSize: '13px', fontWeight: 700, color: editingId ? '#8b5cf6' : 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {editingId ? '✏️ Modificar Vendedor' : '➕ Registrar Nuevo Vendedor'}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '0.5fr 1fr 0.8fr', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Código</label>
                  <input style={inputStyle} value={vendedorForm.codigo} onChange={e => setVendedorForm(f => ({ ...f, codigo: e.target.value.toUpperCase() }))} placeholder="VEN-001" />
                </div>
                <div>
                  <label style={labelStyle}>Nombre Completo</label>
                  <input style={inputStyle} value={vendedorForm.nombre} onChange={e => setVendedorForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre y Apellido" />
                </div>
                <div>
                  <label style={labelStyle}>Cargo</label>
                  <input style={inputStyle} value={vendedorForm.cargo} onChange={e => setVendedorForm(f => ({ ...f, cargo: e.target.value }))} placeholder="Ej: Vendedor, Supervisor" />
                </div>
                <div>
                  <label style={labelStyle}>Cédula</label>
                  <input style={inputStyle} value={vendedorForm.cedula} onChange={e => setVendedorForm(f => ({ ...f, cedula: e.target.value }))} placeholder="V-XXXXXXXX" />
                </div>
                <div>
                  <label style={labelStyle}>Teléfono</label>
                  <input style={inputStyle} value={vendedorForm.telefono} onChange={e => setVendedorForm(f => ({ ...f, telefono: e.target.value }))} placeholder="0412-XXXXXXX" />
                </div>
                <div>
                  <label style={labelStyle}>Correo Electrónico</label>
                  <input style={inputStyle} type="email" value={vendedorForm.email} onChange={e => setVendedorForm(f => ({ ...f, email: e.target.value }))} placeholder="correo@empresa.com" />
                </div>
                <div>
                  <label style={labelStyle}>📅 Fecha de Ingreso</label>
                  <input style={inputStyle} type="date" value={vendedorForm.fechaIngreso} onChange={e => setVendedorForm(f => ({ ...f, fechaIngreso: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>📅 Fecha de Egreso</label>
                  <input style={inputStyle} type="date" value={vendedorForm.fechaEgreso} onChange={e => setVendedorForm(f => ({ ...f, fechaEgreso: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '2px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Dejar Egreso vacío si sigue activo</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                {editingId && (
                  <button onClick={handleVendedorCancel} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: '10px', padding: '9px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                    Cancelar
                  </button>
                )}
                <button onClick={handleVendedorSave} style={{ background: editingId ? 'linear-gradient(135deg,#7c3aed,#8b5cf6)' : 'linear-gradient(135deg,#1e40af,#3b82f6)', border: 'none', color: 'white', borderRadius: '10px', padding: '9px 22px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                  {editingId ? '💾 Guardar Cambios' : '✅ Registrar Vendedor'}
                </button>
              </div>
            </div>

            {/* Vendedores table */}
            {vendedores.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>👤</div>
                <div style={{ fontWeight: 600 }}>No hay vendedores registrados</div>
                <div style={{ fontSize: '12px', marginTop: '6px' }}>Usa el formulario de arriba para agregar el primer vendedor</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Nombre</th>
                      <th>Cargo</th>
                      <th>Cédula</th>
                      <th>Teléfono</th>
                      <th>Email</th>
                      <th>F. Ingreso</th>
                      <th>F. Egreso</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendedores.map(v => (
                      <tr key={v.id} style={{ background: editingId === v.id ? 'rgba(139,92,246,0.06)' : v.fechaEgreso ? 'rgba(239,68,68,0.04)' : undefined }}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-blue)', fontSize: '12px' }}>{v.codigo}</td>
                        <td style={{ fontWeight: 600 }}>{v.nombre}</td>
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{v.cargo || '—'}</td>
                        <td style={{ fontSize: '12px' }}>{v.cedula || '—'}</td>
                        <td style={{ fontSize: '12px' }}>{v.telefono || '—'}</td>
                        <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{v.email || '—'}</td>
                        <td style={{ fontSize: '11px', color: '#10b981' }}>{v.fechaIngreso ? U.fmtDate(v.fechaIngreso) : '—'}</td>
                        <td style={{ fontSize: '11px', color: v.fechaEgreso ? '#ef4444' : 'var(--text-muted)' }}>{v.fechaEgreso ? U.fmtDate(v.fechaEgreso) : <span style={{ color: '#10b981', fontWeight: 600 }}>Activo</span>}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => handleVendedorEdit(v)} style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', color: '#8b5cf6', borderRadius: '8px', cursor: 'pointer', padding: '6px 10px', fontSize: '12px', fontWeight: 600 }}>✏️ Editar</button>
                            <button onClick={() => handleVendedorDelete(v.id)} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--accent-red)', borderRadius: '8px', cursor: 'pointer', padding: '6px 10px', fontSize: '12px', fontWeight: 600 }}>🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══ TAB: POSICIONES VACANTES ══ */}
        {activeTab === 'posiciones' && (
          <div>
            {/* Form */}
            <div style={{ background: editingPosId ? 'rgba(245,158,11,0.06)' : 'rgba(16,185,129,0.06)', border: `1px solid ${editingPosId ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}`, borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 16px', fontSize: '13px', fontWeight: 700, color: editingPosId ? '#f59e0b' : '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {editingPosId ? '✏️ Modificar Posición' : '➕ Agregar Posición Vacante'}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.6fr 0.8fr', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Título del Cargo</label>
                  <input style={inputStyle} value={posForm.titulo} onChange={e => setPosForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ej: Gerente de Ventas" />
                </div>
                <div>
                  <label style={labelStyle}>Estatus</label>
                  <select style={inputStyle} value={posForm.estatus} onChange={e => setPosForm(f => ({ ...f, estatus: e.target.value }))}>
                    <option value="Vacante">🟡 Vacante</option>
                    <option value="Ocupado">🟢 Ocupado</option>
                    <option value="Suspendido">🔴 Suspendido</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Zona / Área</label>
                  <input style={inputStyle} value={posForm.zona} onChange={e => setPosForm(f => ({ ...f, zona: e.target.value }))} placeholder="Ej: Zona Norte, Finanzas" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Requisitos / Descripción</label>
                  <input style={inputStyle} value={posForm.requisitos} onChange={e => setPosForm(f => ({ ...f, requisitos: e.target.value }))} placeholder="Ej: Experiencia en ventas, bachiller..." />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                {editingPosId && (
                  <button onClick={handlePosCancelEdit} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: '10px', padding: '9px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                )}
                <button onClick={handlePosSave} style={{ background: editingPosId ? 'linear-gradient(135deg,#d97706,#f59e0b)' : 'linear-gradient(135deg,#059669,#10b981)', border: 'none', color: 'white', borderRadius: '10px', padding: '9px 22px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                  {editingPosId ? '💾 Guardar Cambios' : '✅ Agregar Posición'}
                </button>
              </div>
            </div>

            {/* Posiciones table */}
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Cargo / Posición</th>
                    <th>Zona / Área</th>
                    <th>Estatus</th>
                    <th>Requisitos</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {posiciones.map(p => (
                    <tr key={p.id} style={{ background: editingPosId === p.id ? 'rgba(245,158,11,0.06)' : undefined }}>
                      <td style={{ fontWeight: 700 }}>{p.titulo}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{p.zona || '—'}</td>
                      <td>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                          background: p.estatus === 'Vacante' ? 'rgba(245,158,11,0.15)' : p.estatus === 'Ocupado' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)',
                          color: p.estatus === 'Vacante' ? '#f59e0b' : p.estatus === 'Ocupado' ? '#10b981' : '#ef4444',
                          border: `1px solid ${p.estatus === 'Vacante' ? 'rgba(245,158,11,0.4)' : p.estatus === 'Ocupado' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.3)'}`,
                        }}>
                          {p.estatus === 'Vacante' ? '🟡' : p.estatus === 'Ocupado' ? '🟢' : '🔴'} {p.estatus}
                        </span>
                      </td>
                      <td style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '260px' }}>{p.requisitos || '—'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => handlePosEdit(p)} style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', borderRadius: '8px', cursor: 'pointer', padding: '6px 10px', fontSize: '12px', fontWeight: 600 }}>✏️ Editar</button>
                          <button onClick={() => handlePosDelete(p.id)} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--accent-red)', borderRadius: '8px', cursor: 'pointer', padding: '6px 10px', fontSize: '12px', fontWeight: 600 }}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
