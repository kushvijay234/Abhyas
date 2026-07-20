import React from 'react';
import './ErrorMessage.css';

export default function ErrorMessage({ message, style = {} }) {
  if (!message) return null;
  return (
    <div 
      className="badge badge-danger error-message" 
      style={style}
    >
      {message}
    </div>
  );
}
