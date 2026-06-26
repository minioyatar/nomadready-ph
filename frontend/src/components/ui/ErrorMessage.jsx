import React from 'react';

export default function ErrorMessage({ message }) {
  return (
    <div style={{
      background: '#FFF1F2',
      border: '1px solid #FBC8D4',
      borderRadius: 14,
      padding: '18px 20px',
      color: '#B91C1C',
      fontSize: 14,
      lineHeight: 1.6,
    }}>
      <strong style={{ display: 'block', marginBottom: 6 }}>Something went wrong</strong>
      <span>{message || 'An unexpected error occurred.'}</span>
    </div>
  );
}
