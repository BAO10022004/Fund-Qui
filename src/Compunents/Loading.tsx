import React from 'react';
import '../assets/Loader.css';

interface LoaderProps {
  title?: string;
  subtitle?: string;
}

const Loader: React.FC<LoaderProps> = ({
  title = 'Đang tải dữ liệu quỹ...',
  subtitle = 'Hệ thống đang đồng bộ thông tin thu chi mới nhất'
}) => {
  return (
    <div className="nasani-loader-container">
      {/* Vùng ánh sáng ambient tinh tế */}
      <div className="nasani-loader-ambient"></div>

      {/* Thẻ loading chính tông sáng Nasani */}
      <div className="nasani-loader-card">
        {/* Vòng quay hiệu ứng & Icon ví quỹ */}
        <div className="nasani-loader-visual">
          <div className="nasani-loader-spinner-outer"></div>
          <div className="nasani-loader-spinner-inner"></div>
          <div className="nasani-loader-icon-box">
            <svg
              className="nasani-loader-svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="5" width="20" height="14" rx="3" />
              <path d="M2 10h20" />
              <circle cx="16" cy="14" r="1.5" fill="currentColor" />
            </svg>
          </div>
        </div>

        {/* Nội dung thông báo */}
        <div className="nasani-loader-info">
          <h3 className="nasani-loader-title">{title}</h3>
          <p className="nasani-loader-sub">{subtitle}</p>
        </div>

        {/* Thanh tiến trình gradient trượt mượt mà */}
        <div className="nasani-loader-track">
          <div className="nasani-loader-bar"></div>
        </div>

        {/* Huy hiệu trạng thái kết nối */}
        <div className="nasani-loader-badge">
          <span className="nasani-loader-pulse-dot"></span>
          <span>Đang đồng bộ dữ liệu</span>
        </div>
      </div>
    </div>
  );
};

export default Loader;