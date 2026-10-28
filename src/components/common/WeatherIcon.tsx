'use client';

import React from 'react';
import { AnimatedWeatherIcon } from '@/components/AnimatedWeatherIcon';

interface WeatherIconProps {
  weatherCode: number;
  className?: string;
  isDay?: boolean;
  size?: number;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({
  weatherCode,
  className = 'w-6 h-6',
  isDay,
  size,
}) => {
  return (
    <AnimatedWeatherIcon
      weatherCode={weatherCode}
      className={className}
      isDay={isDay}
      size={size}
    />
  );
};
