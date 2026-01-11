import React from 'react';
import "../assets/Loader.css";

function Loader() {
  return (
    <div className="loader-container">
      {/* Animated background particles */}
      <div className="bg-particles">
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
      </div>

      {/* Floating elements */}
      <div className="floating-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
      </div>

      {/* Main loader */}
      <div className="loader-content">
        {/* Spinning rings */}
        <div className="spinner-container">
          <div className="spinner-ring ring-1"></div>
          <div className="spinner-ring ring-2"></div>
          <div className="spinner-ring ring-3"></div>
          <div className="hourglass-icon">⏳</div>
        </div>

        {/* Text content */}
        <div className="loader-text">
          <h2 className="loading-title">Đang tải dữ liệu từ Firebase...</h2>
          
          {/* Loading dots */}
          <div className="loading-dots">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
          
          <p className="loading-subtitle">Vui lòng đợi trong giây lát</p>
        </div>

        {/* Progress bar */}
        <div className="progress-bar">
          <div className="progress-fill"></div>
        </div>
      </div>
    </div>
  );
}

export default Loader;