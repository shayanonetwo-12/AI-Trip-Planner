import React from "react";
import { Hotel, ExternalLink, Sparkles, MapPin, CheckCircle2, Info } from "lucide-react";
import { HotelOption } from "../firebase";

interface HotelOptionsCardProps {
  hotels?: HotelOption[];
  hotelPreference?: string;
  destination: string;
}

export default function HotelOptionsCard({ hotels, hotelPreference, destination }: HotelOptionsCardProps) {
  if (!hotels || hotels.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#DCD7CC] shadow-sm p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E1D8] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="bg-[#E9EDC9] text-[#5A5A40] p-2.5 rounded-xl">
            <Hotel className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg text-[#33332D] flex items-center gap-2">
              Hotel & Stay Recommendations
            </h3>
            <p className="text-xs text-[#7D7667]">
              Curated accommodations in <span className="font-semibold text-[#5A5A40]">{destination}</span>
            </p>
          </div>
        </div>

        {hotelPreference && (
          <span className="self-start sm:self-auto bg-[#F5F2ED] text-[#5A5A40] border border-[#E5E1D8] text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            {hotelPreference} Tier
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {hotels.map((hotel, idx) => (
          <div
            key={idx}
            className="bg-[#F9F8F6] border border-[#E5E1D8] rounded-xl p-4 flex flex-col justify-between gap-3 hover:border-[#D4A373]/50 hover:shadow-md transition-all group"
          >
            <div className="space-y-2">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="text-[10px] font-extrabold text-[#7D7667] uppercase tracking-wider block">
                    {hotel.category || "Recommended Stay"}
                  </span>
                  <h4 className="font-serif font-bold text-base text-[#33332D] group-hover:text-[#D4A373] transition-colors leading-tight">
                    {hotel.name}
                  </h4>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-extrabold text-[#5A5A40] font-mono block">
                    {hotel.currencySymbol || "$"}{hotel.estimatedPricePerNight}
                  </span>
                  <span className="text-[9px] text-[#7D7667] font-semibold">/ night</span>
                </div>
              </div>

              {hotel.locationArea && (
                <p className="text-xs text-[#7D7667] font-medium flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#D4A373] shrink-0" />
                  <span>{hotel.locationArea}</span>
                </p>
              )}

              {hotel.highlights && (
                <div className="bg-white/80 p-2.5 rounded-lg border border-[#E5E1D8]/60 text-xs text-[#5A5A40]">
                  <p className="font-semibold flex items-center gap-1 mb-1 text-[11px] text-[#7D7667]">
                    <Sparkles className="w-3 h-3 text-[#D4A373]" /> Highlights
                  </p>
                  <p className="text-[#33332D]/90 text-[11px] leading-relaxed">
                    {hotel.highlights}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2.5 pt-1">
              {hotel.bookingTip && (
                <div className="bg-[#FAEED1]/50 border border-[#CCD5AE]/40 p-2 rounded-lg text-[11px] text-[#7D7667] flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#D4A373] shrink-0 mt-0.5" />
                  <span className="leading-snug"><strong className="text-[#5A5A40]">Tip:</strong> {hotel.bookingTip}</span>
                </div>
              )}

              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(hotel.name + " " + destination + " hotel booking")}`}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-white hover:bg-[#5A5A40] hover:text-white text-[#5A5A40] border border-[#5A5A40]/30 font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <span>Check Rates & Reserve</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
