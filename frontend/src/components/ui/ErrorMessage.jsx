import React from 'react';
import PropTypes from 'prop-types';

export default function ErrorMessage({ message = 'Something went wrong.' }) {
  return (
    <div className="card" style={{ padding: 14, background: '#FFEFE8', borderColor: 'var(--red-light)', color: 'var(--text-dark)' }}>
      <strong style={{ color: 'var(--red)' }}>Error</strong>
      <div style={{ marginTop: 6 }}>{message}</div>
    </div>
  );
}

ErrorMessage.propTypes = {
  message: PropTypes.string,
};
