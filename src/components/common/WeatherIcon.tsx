import React from 'react';
import {
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
} from 'lucide-react';
import { getWeatherInterpretation } from '@/lib/weather';

interface WeatherIconProps {
  weatherCode: number;
  className?: string;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({ weatherCode, className = 'w-6 h-6' }) => {
  const { iconName } = getWeatherInterpretation(weatherCode);

  switch (iconName) {
    case 'sun':
      return <Sun className={`${className} text-amber-500`} />;
    case 'cloud-sun':
      return <CloudSun className={`${className} text-amber-400`} />;
    case 'cloud':
      return <Cloud className={`${className} text-slate-400`} />;
    case 'cloud-rain':
      return <CloudRain className={`${className} text-sky-500`} />;
    case 'cloud-snow':
      return <CloudSnow className={`${className} text-blue-300`} />;
    case 'cloud-lightning':
      return <CloudLightning className={`${className} text-purple-500`} />;
    case 'cloud-fog':
      return <CloudFog className={`${className} text-slate-300`} />;
    default:
      return <Cloud className={`${className} text-slate-400`} />;
  }
};
