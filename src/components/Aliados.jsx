import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import Modal from './Modal';

const Aliados = () => {
  const { data, addItem, removeItem, updateItem } = useAppData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAliado, setEditingAliado] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', correo: '', telefono: '', empresa: '' });

  const handleOpenModal = (aliado = null) => {
    if (aliado) {
      setEditingAliado(aliado);
      setFormData(aliado);
    } else {
      setEditingAliado(null);
      setFormData({ nombre: '', correo: '', telefono: '', empresa: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingAliado) {
      await updateItem('aliados', { ...formData, id: editingAliado.id });
    } else {
      await addItem('aliados', { ...formData, fechaRegistro: new Date().toISOString() });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="fade-in" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '42px', fontWeight: '900', color: '#1e3a8a', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '-1px' }}>
            🤝 Red de Aliados
          </h1>
          <p style={{ fontSize: '20px', color: '#64748b', fontWeight: '600' }}>
            Gestiona tus contactos estratégicos e invitados
          </p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          style={{ 
            padding: '18px 35px', borderRadius: '20px', border: 'none',
            background: 'linear-gradient(135deg, #1e40af, #2563eb)',
            color: 'white', fontSize: '22px', fontWeight: '900', cursor: 'pointer',
            boxShadow: '0 10px 20px rgba(37, 99, 235, 0.3)', transition: 'all 0.3s'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          ➕ NUEVO ALIADO
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '25px' }}>
        {data.aliados.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px 20px', background: 'white', borderRadius: '30px', border: '3px dashed #cbd5e1' }}>
            <span style={{ fontSize: '80px' }}>🤝</span>
            <h2 style={{ fontSize: '32px', color: '#1e3a8a', fontWeight: '900', marginTop: '20px' }}>¡Aún no tienes aliados!</h2>
            <p style={{ fontSize: '20px', color: '#64748b', marginTop: '10px' }}>Comienza a invitarlos desde el botón de "Compartir" en tus productos.</p>
          </div>
        ) : (
          data.aliados.map(aliado => (
            <div 
              key={aliado.id}
              style={{ 
                background: 'white', padding: '30px', borderRadius: '30px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0',
                position: 'relative', overflow: 'hidden'
              }}
            >
              <div style={{ 
                position: 'absolute', top: 0, left: 0, width: '8px', height: '100%', 
                background: 'linear-gradient(to bottom, #3b82f6, #1d4ed8)' 
              }} />
              
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '28px', fontWeight: '900', color: '#1e3a8a', marginBottom: '5px' }}>{aliado.nombre}</h3>
                {aliado.empresa && <div style={{ fontSize: '18px', fontWeight: '700', color: '#3b82f6' }}>🏢 {aliado.empresa}</div>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '25px' }}>
                <div style={{ fontSize: '18px', color: '#334155', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '22px' }}>📧</span> {aliado.correo}
                </div>
                {aliado.telefono && (
                  <div style={{ fontSize: '18px', color: '#334155', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '22px' }}>📞</span> {aliado.telefono}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => handleOpenModal(aliado)}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#f1f5f9', color: '#1e40af', fontWeight: '800', cursor: 'pointer' }}
                >
                  ✏️ EDITAR
                </button>
                <button 
                  onClick={() => { if(window.confirm('¿Eliminar aliado?')) removeItem('aliados', aliado.id); }}
                  style={{ padding: '12px', borderRadius: '12px', border: 'none', background: '#fee2e2', color: '#dc2626', fontWeight: '800', cursor: 'pointer' }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingAliado ? "Editar Aliado" : "Nuevo Aliado"}>
        <form onSubmit={handleSubmit} style={{ padding: '10px' }}>
          <div style={{ display: 'grid', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '18px', fontWeight: '800', color: '#1e3a8a', marginBottom: '8px' }}>NOMBRE COMPLETO</label>
              <input 
                style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '18px', fontWeight: '700' }}
                value={formData.nombre}
                onChange={e => setFormData({...formData, nombre: e.target.value})}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '18px', fontWeight: '800', color: '#1e3a8a', marginBottom: '8px' }}>CORREO ELECTRÓNICO</label>
              <input 
                type="email"
                style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '18px', fontWeight: '700' }}
                value={formData.correo}
                onChange={e => setFormData({...formData, correo: e.target.value})}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '18px', fontWeight: '800', color: '#1e3a8a', marginBottom: '8px' }}>TELÉFONO (OPCIONAL)</label>
              <input 
                style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '18px', fontWeight: '700' }}
                value={formData.telefono}
                onChange={e => setFormData({...formData, telefono: e.target.value})}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '18px', fontWeight: '800', color: '#1e3a8a', marginBottom: '8px' }}>EMPRESA / NEGOCIO</label>
              <input 
                style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '18px', fontWeight: '700' }}
                value={formData.empresa}
                onChange={e => setFormData({...formData, empresa: e.target.value})}
              />
            </div>
          </div>
          <button 
            type="submit"
            style={{ 
              width: '100%', marginTop: '30px', padding: '20px', borderRadius: '15px', border: 'none',
              background: '#1e40af', color: 'white', fontSize: '20px', fontWeight: '900', cursor: 'pointer'
            }}
          >
            {editingAliado ? 'GUARDAR CAMBIOS' : 'REGISTRAR ALIADO'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Aliados;
