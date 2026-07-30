import React from "react";
import { CloudSun, Thermometer, CloudRain, Calendar, Shirt, Check } from "lucide-react";
import { WeatherForecast } from "../firebase";

interface WeatherGuideCardProps {
  weather?: WeatherForecast;
  destination: string;
}

export default function WeatherGuideCard({ weather, destination }: WeatherGuideCardProps) {
  if (!weather) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#DCD7CC] shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2.5 border-b border-[#E5E1D8] pb-3">
        <div className="bg-[#FAEED1] text-[#D4A373] p-2.5 rounded-xl">
          <CloudSun className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-serif font-bold text-lg text-[#33332D]">
            Weather Forecast & Packing Guide
          </h3>
          <p className="text-xs text-[#7D7667]">
            Seasonal insights & packing advice for <span className="font-semibold text-[#5A5A40]">{destination}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Temp & Condition */}
        <div className="bg-[#F9F8F6] border border-[#E5E1D8] rounded-xl p-3.5 space-y-2">
          <span className="text-[10px] font-extrabold text-[#7D7667] uppercase tracking-wider flex items-center gap-1">
            <Thermometer className="w-3.5 h-3.5 text-[#D4A373]" /> Expected Temp
          </span>
          <p className="font-mono font-bold text-lg text-[#33332D]">
            {weather.temperatureRange || "Pleasant seasonal temps"}
          </p>
          <p className="text-xs text-[#7D7667] font-medium leading-relaxed">
            {weather.condition}
          </p>
        </div>

        {/* Rain & Season */}
        <div className="bg-[#F9F8F6] border border-[#E5E1D8] rounded-xl p-3.5 space-y-2">
          <span className="text-[10px] font-extrabold text-[#7D7667] uppercase tracking-wider flex items-center gap-1">
            <CloudRain className="w-3.5 h-3.5 text-blue-500" /> Precipitation & Best Season
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200/50">
              {weather.rainChance || "Low rain risk"}
            </span>
          </div>
          <p className="text-xs text-[#7D7667] font-medium leading-relaxed flex items-start gap-1 pt-0.5">
            <Calendar className="w-3.5 h-3.5 text-[#5A5A40] shrink-0 mt-0.5" />
            <span>{weather.bestTimeToVisit}</span>
          </p>
        </div>

        {/* Packing Checklist */}
        <div className="bg-[#F9F8F6] border border-[#E5E1D8] rounded-xl p-3.5 space-y-2">
          <span className="text-[10px] font-extrabold text-[#7D7667] uppercase tracking-wider flex items-center gap-1">
            <Shirt className="w-3.5 h-3.5 text-[#5A5A40]" /> Essential Packing Checklist
          </span>
          <ul className="space-y-1.5 pt-1">
            {weather.packingTips && weather.packingTips.length > 0 ? (
              weather.packingTips.map((tip, i) => (
                <li key={i} className="text-xs text-[#33332D] font-medium flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#5A5A40] shrink-0" />
                  <span>{tip}</span>
                </li>
              ))
            ) : (
              <li className="text-xs text-[#7D7667]">Comfortable walking shoes & weather-layered clothing.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
