import React from 'react';
import '../assets/HeaderManagePerson.css';

function HeaderManagePerson({ openModal }: { openModal: () => void }) {
  return (
    <div className="header-container">
      <div className="header-title-wrapper">
        <div className="header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <h1 className="header-title">Quản lý Người</h1>
      </div>
      
      <button 
        className="add-button"
        onClick={openModal}
      >
        <span className="add-button-icon">+</span>
        <span className="add-button-text">Thêm người mới</span>
      </button>
    </div>
  );
}
export default HeaderManagePerson;