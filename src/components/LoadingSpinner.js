import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="loading-spinner">
      <div className="spinner"></div>
      <p>Анализируем текст...</p>
    </div>
  );
};

export default LoadingSpinner;