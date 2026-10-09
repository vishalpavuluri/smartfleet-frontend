import React from 'react';

export default function Loader({ text = 'Loading data...', size = 36 }) {
  return (
    <div className="loader-container">
      <div className="spinner" style={{ width: size, height: size }} />
      <span>{text}</span>
    </div>
  );
}

