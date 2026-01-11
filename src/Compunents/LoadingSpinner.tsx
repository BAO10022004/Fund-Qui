import React from 'react';
import '../assets/LoadingSpinner.css';

const LoadingSpinner = () => {
  return (
    <div className="loading-overlay">
      <div className="loading-container">
        <div className="loading-glow"></div>
        
        <div className="loading-content">
          <div className="spinner-wrapper">
            <div className="spinner-ring"></div>
            <div className="spinner-animated"></div>
            <div className="spinner-glow"></div>
          </div>
          
          <div className="loading-text-wrapper">
            <p className="loading-text">Đang xử lý</p>
            <div className="loading-dots">
              <span className="dot dot-1"></span>
              <span className="dot dot-2"></span>
              <span className="dot dot-3"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LoadingSpinner;