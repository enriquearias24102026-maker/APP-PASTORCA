import React from 'react';

const PlaceholderView = ({ name }) => (
  <div className="view-container">
    <div className="card shadow-sm">
      <div className="card-body text-center" style={{ padding: '100px 20px' }}>
        <h2 style={{ color: 'var(--text-muted)' }}>La vista de {name} está en desarrollo</h2>
        <p style={{ marginTop: '10px' }}>Estamos migrando esta funcionalidad del sistema anterior.</p>
      </div>
    </div>
  </div>
);

export default PlaceholderView;
