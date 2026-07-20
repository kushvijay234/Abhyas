import React from 'react';
import { Search } from 'lucide-react';
import './SearchBar.css';

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search...',
  maxWidth = '400px',
  showButton = true,
  buttonText = 'Search',
  style = {},
  children
}) {
  const handleFormSubmit = (e) => {
    if (onSubmit) {
      onSubmit(e);
    } else {
      e.preventDefault();
    }
  };

  return (
    <form 
      onSubmit={handleFormSubmit} 
      className="search-form" 
      style={{ 
        maxWidth: maxWidth,
        ...style 
      }}
    >
      <div className="search-input-wrapper">
        <Search 
          size={18} 
          className="search-icon" 
        />
        <input
          type="text"
          className="form-control search-input"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
      </div>
      {children}
      {showButton && (
        <button type="submit" className="btn btn-primary">
          {buttonText}
        </button>
      )}
    </form>
  );
}
