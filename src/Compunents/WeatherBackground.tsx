import React, { useState, useEffect, useMemo } from 'react';
import {
  fetchCurrentWeather,
  getTimeOfDay,
  getTimeOfDayLabel,
  type TimeOfDay,
  type WeatherCondition,
  type WeatherData
} from '../services/WeatherService';

import bgMorning from '../assets/bg_morning.jpg';
import bgAfternoon from '../assets/bg_afternoon.jpg';
import bgSunset from '../assets/bg_sunset.gif';
import bgNight from '../assets/bg_night.jpg';

interface WeatherBackgroundProps {
  children?: React.ReactNode;
}

export const WeatherBackground: React.FC<WeatherBackgroundProps> = ({ children }) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isAuto, setIsAuto] = useState<boolean>(true);
  const [manualTime, setManualTime] = useState<TimeOfDay>('afternoon');
  const [manualCondition, setManualCondition] = useState<WeatherCondition>('clear');
  const [showControls, setShowControls] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  // Cập nhật đồng hồ thời gian thực mỗi giây
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        })
      );
      setCurrentDate(
        now.toLocaleDateString('vi-VN', {
          weekday: 'long',
          day: 'numeric',
          month: 'numeric'
        })
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Lấy dữ liệu thời tiết thực tế từ Open-Meteo
  useEffect(() => {
    const loadWeather = async () => {
      try {
        // Thử lấy vị trí qua Geolocation của trình duyệt
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const data = await fetchCurrentWeather(
                position.coords.latitude,
                position.coords.longitude,
                'Vị trí của bạn'
              );
              setWeatherData(data);
              if (isAuto) {
                setManualTime(data.timeOfDay);
                setManualCondition(data.condition);
              }
            },
            async () => {
              // Nếu người dùng từ chối quyền vị trí, dùng tọa độ mặc định TP.HCM
              const data = await fetchCurrentWeather();
              setWeatherData(data);
              if (isAuto) {
                setManualTime(data.timeOfDay);
                setManualCondition(data.condition);
              }
            },
            { timeout: 5000 }
          );
        } else {
          const data = await fetchCurrentWeather();
          setWeatherData(data);
          if (isAuto) {
            setManualTime(data.timeOfDay);
            setManualCondition(data.condition);
          }
        }
      } catch (err) {
        console.warn('Weather fetch error:', err);
      }
    };

    loadWeather();
    // Cập nhật thời tiết mỗi 15 phút
    const weatherInterval = setInterval(loadWeather, 15 * 60 * 1000);
    return () => clearInterval(weatherInterval);
  }, [isAuto]);

  // Xác định thời gian và thời tiết hiện hành (Auto hoặc Manual)
  const activeTime: TimeOfDay = isAuto ? (weatherData?.timeOfDay || getTimeOfDay()) : manualTime;
  const activeCondition: WeatherCondition = isAuto ? (weatherData?.condition || 'clear') : manualCondition;

  // Lựa chọn bức tranh phong cảnh nền tương ứng
  const currentBgImage = useMemo(() => {
    switch (activeTime) {
      case 'morning':
        return bgMorning;
      case 'afternoon':
        return bgAfternoon;
      case 'sunset':
        return bgSunset;
      case 'night':
        return bgNight;
      default:
        return bgAfternoon;
    }
  }, [activeTime]);

  // Tạo mảng giọt mưa ngẫu nhiên
  const raindrops = useMemo(() => {
    if (activeCondition !== 'rain' && activeCondition !== 'thunder') return [];
    return Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      left: `${(i * 2.3) % 100}%`,
      delay: `${(i * 0.07) % 1.5}s`,
      duration: `${0.65 + (i % 5) * 0.1}s`,
      opacity: 0.35 + (i % 4) * 0.15
    }));
  }, [activeCondition]);

  // Tạo mảng bông tuyết ngẫu nhiên
  const snowflakes = useMemo(() => {
    if (activeCondition !== 'snow') return [];
    return Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      left: `${(i * 2.9) % 100}%`,
      delay: `${(i * 0.15) % 4}s`,
      duration: `${3.5 + (i % 5) * 0.8}s`,
      size: `${3 + (i % 4) * 2}px`,
      opacity: 0.4 + (i % 4) * 0.15
    }));
  }, [activeCondition]);

  // Tạo mảng sao đêm nhấp nháy
  const stars = useMemo(() => {
    if (activeTime !== 'night') return [];
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      top: `${(i * 2.8) % 65}%`,
      left: `${(i * 3.4) % 100}%`,
      size: `${1.5 + (i % 3) * 1}px`,
      delay: `${(i * 0.2) % 3}s`,
      duration: `${1.8 + (i % 4) * 0.5}s`
    }));
  }, [activeTime]);

  return (
    <div className={`weather-bg-container time-${activeTime} condition-${activeCondition}`}>
      {/* 1. Bức tranh phong cảnh nền tương ứng với thời gian */}
      <div
        className="weather-art-canvas"
        style={{ backgroundImage: `url(${currentBgImage})` }}
      />

      {/* 2. Lớp hiệu ứng ánh sáng tự nhiên theo thời gian (Sunbeam / Sunset glow / Moonlight) */}
      <div className={`weather-light-overlay overlay-${activeTime}`} />

      {/* 3. Hiệu ứng Mưa rơi (nếu trời mưa hoặc giông bão) */}
      {(activeCondition === 'rain' || activeCondition === 'thunder') && (
        <div className="weather-rain-container">
          {raindrops.map((drop) => (
            <span
              key={drop.id}
              className="weather-raindrop"
              style={{
                left: drop.left,
                animationDelay: drop.delay,
                animationDuration: drop.duration,
                opacity: drop.opacity
              }}
            />
          ))}
        </div>
      )}

      {/* 4. Hiệu ứng Giông bão sấm chớp (Thunder Flash) */}
      {activeCondition === 'thunder' && (
        <div className="weather-lightning-flash" />
      )}

      {/* 5. Hiệu ứng Tuyết rơi */}
      {activeCondition === 'snow' && (
        <div className="weather-snow-container">
          {snowflakes.map((flake) => (
            <span
              key={flake.id}
              className="weather-snowflake"
              style={{
                left: flake.left,
                animationDelay: flake.delay,
                animationDuration: flake.duration,
                width: flake.size,
                height: flake.size,
                opacity: flake.opacity
              }}
            />
          ))}
        </div>
      )}

      {/* 6. Hiệu ứng Mây trôi bồng bềnh */}
      {(activeCondition === 'clouds' || activeCondition === 'rain') && (
        <div className="weather-clouds-layer">
          <div className="weather-cloud cloud-1" />
          <div className="weather-cloud cloud-2" />
        </div>
      )}

      {/* 7. Hiệu ứng Sao đêm & Sao băng lướt qua */}
      {activeTime === 'night' && (
        <div className="weather-stars-container">
          {stars.map((star) => (
            <span
              key={star.id}
              className="weather-twinkle-star"
              style={{
                top: star.top,
                left: star.left,
                width: star.size,
                height: star.size,
                animationDelay: star.delay,
                animationDuration: star.duration
              }}
            />
          ))}
          <div className="weather-shooting-star shooting-star-1" />
          <div className="weather-shooting-star shooting-star-2" />
        </div>
      )}

      {/* 8. Lớp phủ Vignette chuyển màu bảo vệ tương phản nội dung */}
      <div className="weather-vignette-overlay" />

      {/* 9. Weather & Time Pill Widget (Góc trên bên phải) */}
      <div className="weather-time-widget-wrapper">
        <div
          className="weather-time-pill"
          onClick={() => setShowControls(!showControls)}
          title="Bấm để tùy chỉnh phong cảnh và thời tiết"
        >
          <div className="pill-weather-icon">
            {activeCondition === 'rain'
              ? '🌧️'
              : activeCondition === 'thunder'
              ? '⛈️'
              : activeCondition === 'snow'
              ? '❄️'
              : activeCondition === 'clouds'
              ? '⛅'
              : activeTime === 'morning'
              ? '🌅'
              : activeTime === 'afternoon'
              ? '☀️'
              : activeTime === 'sunset'
              ? '🌇'
              : '🌙'}
          </div>

          <div className="pill-info-block">
            <div className="pill-time-row">
              <span className="pill-time-text">{currentTime || weatherData?.timeString || '12:00'}</span>
              <span className="pill-divider">•</span>
              <span className="pill-time-tag">{getTimeOfDayLabel(activeTime)}</span>
            </div>
            <div className="pill-weather-row">
              <span className="pill-temp">
                {weatherData ? `${weatherData.temperature}°C` : '31°C'}
              </span>
              <span className="pill-divider">•</span>
              <span className="pill-cond">
                {activeCondition === 'rain'
                  ? 'Mưa rào nhẹ'
                  : activeCondition === 'thunder'
                  ? 'Giông sấm chớp'
                  : activeCondition === 'snow'
                  ? 'Tuyết rơi'
                  : activeCondition === 'clouds'
                  ? 'Mây bồng bềnh'
                  : 'Trời quang đãng'}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="pill-toggle-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowControls(!showControls);
            }}
            aria-label="Tùy chỉnh phong cảnh"
          >
            ⚙️
          </button>
        </div>

        {/* Bảng điều khiển chuyển cảnh nhanh (Interactive Controller Dropdown) */}
        {showControls && (
          <div className="weather-controls-dropdown">
            <div className="dropdown-header">
              <h4>Bức tranh Phong cảnh & Thời tiết</h4>
              <button
                className="dropdown-close-btn"
                onClick={() => setShowControls(false)}
              >
                ✕
              </button>
            </div>

            {/* Chế độ Tự động theo thời gian thực */}
            <div className="dropdown-section">
              <label className="dropdown-auto-toggle">
                <input
                  type="checkbox"
                  checked={isAuto}
                  onChange={(e) => setIsAuto(e.target.checked)}
                />
                <span>Tự động theo thời gian & thời tiết thực tế</span>
              </label>
            </div>

            {/* Chọn mốc thời gian trong ngày */}
            <div className="dropdown-section">
              <div className="dropdown-section-title">Chọn khung cảnh (Thời gian):</div>
              <div className="dropdown-buttons-grid">
                <button
                  type="button"
                  className={`dropdown-btn ${!isAuto && manualTime === 'morning' ? 'active' : ''}`}
                  onClick={() => {
                    setIsAuto(false);
                    setManualTime('morning');
                  }}
                >
                  🌅 Sáng sớm
                </button>
                <button
                  type="button"
                  className={`dropdown-btn ${!isAuto && manualTime === 'afternoon' ? 'active' : ''}`}
                  onClick={() => {
                    setIsAuto(false);
                    setManualTime('afternoon');
                  }}
                >
                  ☀️ Ban ngày
                </button>
                <button
                  type="button"
                  className={`dropdown-btn ${!isAuto && manualTime === 'sunset' ? 'active' : ''}`}
                  onClick={() => {
                    setIsAuto(false);
                    setManualTime('sunset');
                  }}
                >
                  🌇 Hoàng hôn
                </button>
                <button
                  type="button"
                  className={`dropdown-btn ${!isAuto && manualTime === 'night' ? 'active' : ''}`}
                  onClick={() => {
                    setIsAuto(false);
                    setManualTime('night');
                  }}
                >
                  🌙 Ban đêm
                </button>
              </div>
            </div>

            {/* Chọn hiệu ứng thời tiết */}
            <div className="dropdown-section">
              <div className="dropdown-section-title">Chọn thời tiết:</div>
              <div className="dropdown-buttons-grid">
                <button
                  type="button"
                  className={`dropdown-btn ${!isAuto && manualCondition === 'clear' ? 'active' : ''}`}
                  onClick={() => {
                    setIsAuto(false);
                    setManualCondition('clear');
                  }}
                >
                  ☀️ Nắng ráo
                </button>
                <button
                  type="button"
                  className={`dropdown-btn ${!isAuto && manualCondition === 'rain' ? 'active' : ''}`}
                  onClick={() => {
                    setIsAuto(false);
                    setManualCondition('rain');
                  }}
                >
                  🌧️ Mưa rơi
                </button>
                <button
                  type="button"
                  className={`dropdown-btn ${!isAuto && manualCondition === 'clouds' ? 'active' : ''}`}
                  onClick={() => {
                    setIsAuto(false);
                    setManualCondition('clouds');
                  }}
                >
                  ☁️ Mây trôi
                </button>
                <button
                  type="button"
                  className={`dropdown-btn ${!isAuto && manualCondition === 'thunder' ? 'active' : ''}`}
                  onClick={() => {
                    setIsAuto(false);
                    setManualCondition('thunder');
                  }}
                >
                  ⛈️ Giông bão
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Nội dung trang login (khung đăng nhập kính) */}
      <div className="weather-content-wrapper">
        {children}
      </div>
    </div>
  );
};

export default WeatherBackground;
