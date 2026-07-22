import React from 'react';

const GlassCard = ({ children, className = '', hover = false, ...props }) => {
  return (
    <div
      className={`glass-panel p-6 ${hover ? 'glass-card-hover' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
