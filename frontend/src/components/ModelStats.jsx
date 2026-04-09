import React from 'react';

const ModelStats = () => {
  const categories = [
    { name: 'Acne', scientific: 'Acne Vulgaris' },
    { name: 'Mole', scientific: 'Melanocytic Nevi' },
    { name: 'Bullous', scientific: 'Bullous Disease' },
    { name: 'Candidiasis', scientific: 'Fungal Infection' },
    { name: 'Vitiligo', scientific: 'Depigmentation' },
    { name: 'Normal', scientific: 'Healthy Tissue' }
  ];

  return (
    <div className="stats-container" style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <div className="accuracy-header" style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ fontSize: '2.5rem', color: '#2c3e50' }}>86% Accuracy</h2>
        <p style={{ color: '#7f8c8d' }}>Validated on our diverse dermatological dataset.</p>
        <div style={{ width: '100%', background: '#eee', height: '10px', borderRadius: '5px' }}>
          <div style={{ width: '86%', background: '#4CAF50', height: '10px', borderRadius: '5px' }}></div>
        </div>
      </div>

      <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        {categories.map((item) => (
          <div key={item.name} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
            <h4 style={{ margin: '0', color: '#34495e' }}>{item.name}</h4>
            <small style={{ fontStyle: 'italic', color: '#95a5a6' }}>{item.scientific}</small>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModelStats;