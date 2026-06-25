import React from 'react';

export default function LoadingState({ message = 'Loading...' }) {
  return (
    <div style={{ padding: 20, textAlign: 'center', color: '#777' }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
      <div>{message}</div>
    </div>
  );
}
