// WeatherService.ts - Dịch vụ nhận diện Thời tiết & Thời gian thực tế

export type TimeOfDay = 'morning' | 'afternoon' | 'sunset' | 'night';
export type WeatherCondition = 'clear' | 'clouds' | 'rain' | 'thunder' | 'snow';

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  condition: WeatherCondition;
  conditionText: string;
  conditionIcon: string;
  isDay: boolean;
  timeOfDay: TimeOfDay;
  timeOfDayText: string;
  locationName: string;
  timeString: string;
  dateString: string;
}

// Xác định khung thời gian trong ngày dựa trên giờ thực tế
export const getTimeOfDay = (date: Date = new Date()): TimeOfDay => {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) {
    return 'morning'; // 05:00 - 10:59: Sáng sớm / Bình minh
  }
  if (hour >= 11 && hour < 17) {
    return 'afternoon'; // 11:00 - 16:59: Ban ngày / Buổi chiều
  }
  if (hour >= 17 && hour < 19) {
    return 'sunset'; // 17:00 - 18:59: Hoàng hôn / Chiều tà
  }
  return 'night'; // 19:00 - 04:59: Ban đêm / Khuya
};

export const getTimeOfDayLabel = (timeOfDay: TimeOfDay): string => {
  switch (timeOfDay) {
    case 'morning':
      return 'Bình minh rạng rỡ';
    case 'afternoon':
      return 'Ban ngày tươi sáng';
    case 'sunset':
      return 'Hoàng hôn thơ mộng';
    case 'night':
      return 'Đêm sao tĩnh lặng';
  }
};

// Chuyển mã WMO weather code sang phân loại thời tiết và mô tả tiếng Việt
export const parseWeatherCode = (code: number, isDay: boolean): { condition: WeatherCondition; text: string; icon: string } => {
  // 0: Clear sky
  if (code === 0) {
    return {
      condition: 'clear',
      text: isDay ? 'Trời trong xanh' : 'Đêm quang đãng',
      icon: isDay ? '☀️' : '🌙'
    };
  }

  // 1, 2, 3: Mainly clear, partly cloudy, overcast
  if (code <= 3) {
    return {
      condition: 'clouds',
      text: code === 1 ? 'Ít mây' : code === 2 ? 'Mây rải rác' : 'Nhiều mây u ám',
      icon: isDay ? '⛅' : '☁️'
    };
  }

  // 45, 48: Fog
  if (code === 45 || code === 48) {
    return {
      condition: 'clouds',
      text: 'Sương mù mờ ảo',
      icon: '🌫️'
    };
  }

  // 51-57: Drizzle; 61-67: Rain; 80-82: Rain showers
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    const isHeavy = code === 65 || code === 67 || code === 82;
    return {
      condition: 'rain',
      text: isHeavy ? 'Mưa rào nặng hạt' : 'Mưa rào nhẹ',
      icon: '🌧️'
    };
  }

  // 71-77, 85-86: Snow
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
    return {
      condition: 'snow',
      text: 'Có tuyết rơi',
      icon: '❄️'
    };
  }

  // 95-99: Thunderstorm
  if (code >= 95 && code <= 99) {
    return {
      condition: 'thunder',
      text: 'Giông bão sấm chớp',
      icon: '⛈️'
    };
  }

  return {
    condition: 'clear',
    text: isDay ? 'Trời nắng đẹp' : 'Trời quang mây',
    icon: isDay ? '🌤️' : '🌙'
  };
};

// Gọi Open-Meteo API để lấy thời tiết theo tọa độ
export const fetchCurrentWeather = async (
  latitude: number = 10.8231, // Mặc định TP. Hồ Chí Minh
  longitude: number = 106.6297,
  locationName: string = 'TP. Hồ Chí Minh'
): Promise<WeatherData> => {
  const now = new Date();
  const timeOfDay = getTimeOfDay(now);

  const timeString = now.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const dateString = now.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric'
  });

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,is_day`;
    const res = await fetch(url, { cache: 'no-store' });
    
    if (!res.ok) {
      throw new Error(`Weather API returned ${res.status}`);
    }

    const data = await res.json();
    const current = data.current;
    const isDay = current.is_day === 1;
    const weatherInfo = parseWeatherCode(current.weather_code, isDay);

    return {
      temperature: Math.round(current.temperature_2m),
      weatherCode: current.weather_code,
      condition: weatherInfo.condition,
      conditionText: weatherInfo.text,
      conditionIcon: weatherInfo.icon,
      isDay,
      timeOfDay,
      timeOfDayText: getTimeOfDayLabel(timeOfDay),
      locationName,
      timeString,
      dateString
    };
  } catch (error) {
    console.warn('Không thể tải thời tiết trực tuyến, sử dụng dữ liệu mặc định:', error);
    const isDay = timeOfDay === 'morning' || timeOfDay === 'afternoon';
    const fallbackWeather = parseWeatherCode(1, isDay);

    return {
      temperature: isDay ? 31 : 26,
      weatherCode: 1,
      condition: 'clouds',
      conditionText: fallbackWeather.text,
      conditionIcon: fallbackWeather.icon,
      isDay,
      timeOfDay,
      timeOfDayText: getTimeOfDayLabel(timeOfDay),
      locationName,
      timeString,
      dateString
    };
  }
};
