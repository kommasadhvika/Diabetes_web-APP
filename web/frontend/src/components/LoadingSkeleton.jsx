import React from 'react';

const LoadingSkeleton = ({ count = 3, className = '', height = 'h-6' }) => {
  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`bg-slate-200 dark:bg-slate-800 rounded-xl w-full ${height}`}
        />
      ))}
    </div>
  );
};

export default LoadingSkeleton;
