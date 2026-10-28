export interface HourlyWeather {
  time: string[];
  temperature_2m: number[];
  apparent_temperature: number[];
  weather_code: number[];
}

export interface DailyWeather {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
}

export interface ForecastApiResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  hourly: HourlyWeather;
  daily: DailyWeather;
}

export type TargetTimeSlot = 'current' | '08:00' | '13:00' | '19:00';

export interface TimeSlotWeatherItem {
  slot: TargetTimeSlot;
  timeString: string;
  temperature: number;
  apparentTemperature: number;
  weatherCode: number;
  weatherLabel: string;
}

export interface DailyForecastItem {
  date: string;
  dayName: string;
  weatherCode: number;
  weatherLabel: string;
  tempMax: number;
  tempMin: number;
}

export interface ProcessedWeatherData {
  currentTemp: number;
  currentApparentTemp: number;
  currentWeatherCode: number;
  currentWeatherLabel: string;
  todayMax: number;
  todayMin: number;
  timeSlots: Record<TargetTimeSlot, TimeSlotWeatherItem>;
  dailyForecast: DailyForecastItem[];
}
