import React, { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  formatter?: (val: number) => string;
  className?: string;
  style?: React.CSSProperties;
  refreshKey?: any;
}

/**
 * Component hiển thị số với hiệu ứng nhảy số mượt mà từ 0 -> số hiện tại
 * Kích hoạt khi load trang hoặc khi refresh / làm mới dữ liệu
 */
export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1000,
  formatter,
  className,
  style,
  refreshKey
}) => {
  const [displayValue, setDisplayValue] = useState<number>(0);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (value === undefined || isNaN(value)) {
      setDisplayValue(0);
      return;
    }

    let startTimestamp: number | null = null;
    const startValue = 0; // Luôn bắt đầu nhảy từ 0 như yêu cầu

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Hiệu ứng giảm tốc mượt mà (ease-out quart)
      const ease = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(startValue + (value - startValue) * ease);

      setDisplayValue(current);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    // Bắt đầu animation
    setDisplayValue(0);
    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [value, duration, refreshKey]);

  const formatted = formatter
    ? formatter(displayValue)
    : new Intl.NumberFormat('vi-VN').format(displayValue);

  return (
    <span className={className} style={{ fontVariantNumeric: 'tabular-nums', ...style }}>
      {formatted}
    </span>
  );
};

export default AnimatedCounter;
