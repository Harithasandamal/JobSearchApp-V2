import React from 'react';

const ProgressChecklist = ({ items }) => {
  const getIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'processing':
        return '🔄';
      case 'pending':
        return '⏳';
      default:
        return '⏳';
    }
  };

  const getIconClass = (status) => {
    switch (status) {
      case 'completed':
        return 'checklist-icon completed';
      case 'processing':
        return 'checklist-icon processing';
      case 'pending':
        return 'checklist-icon pending';
      default:
        return 'checklist-icon pending';
    }
  };

  const getItemClass = (status) => {
    switch (status) {
      case 'completed':
        return 'checklist-item completed';
      case 'processing':
        return 'checklist-item processing';
      case 'pending':
        return 'checklist-item pending';
      default:
        return 'checklist-item pending';
    }
  };

  return (
    <div className="progress-checklist">
      {items.map((item) => (
        <div key={item.id} className={getItemClass(item.status)}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span className={getIconClass(item.status)} style={{ marginTop: '2px' }}>
              {getIcon(item.status)}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ 
                color: item.status === 'completed' ? '#28a745' : 
                       item.status === 'processing' ? '#007bff' : '#6c757d',
                fontWeight: 'bold',
                fontSize: '14px',
                marginBottom: '2px'
              }}>
                {item.text}
              </div>
              {item.description && (
                <div style={{ 
                  color: '#6c757d',
                  fontSize: '12px',
                  fontStyle: 'italic',
                  lineHeight: '1.3'
                }}>
                  {item.description}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProgressChecklist; 