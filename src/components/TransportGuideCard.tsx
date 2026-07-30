import React from "react";
import { Car, Navigation, ShieldCheck, DollarSign, Smartphone, Clock } from "lucide-react";
import { TransportationGuide } from "../firebase";

interface TransportGuideCardProps {
  transport?: TransportationGuide;
  destination: string;
}

export default function TransportGuideCard({ transport, destination }: TransportGuideCardProps) {
  if (!transport) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#DCD7CC] shadow-sm p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E1D8] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="bg-[#E9EDC9] text-[#5A5A40] p-2.5 rounded-xl">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg text-[#33332D]">
              Cab, Taxi & Transit Guide
            </h3>
            <p className="text-xs text-[#7D7667]">
              Getting around <span className="font-semibold text-[#5A5A40]">{destination}</span> conveniently & safely
            </p>
          </div>
        </div>

        {transport.preferredMode && (
          <span className="self-start sm:self-auto bg-[#F5F2ED] text-[#5A5A40] border border-[#E5E1D8] text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Mode: {transport.preferredMode}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Apps & Cab Services */}
        <div className="bg-[#F9F8F6] border border-[#E5E1D8] rounded-xl p-4 space-y-2.5">
          <span className="text-[10px] font-extrabold text-[#7D7667] uppercase tracking-wider flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-[#D4A373]" /> Popular Local Cab Apps
          </span>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {transport.popularApps && transport.popularApps.length > 0 ? (
              transport.popularApps.map((app, idx) => (
                <span
                  key={idx}
                  className="bg-white border border-[#DCD7CC] text-[#33332D] font-bold text-xs px-2.5 py-1 rounded-lg shadow-2xs"
                >
                  🚕 {app}
                </span>
              ))
            ) : (
              <span className="text-xs text-[#7D7667]">Uber & Local Metered Taxis</span>
            )}
          </div>
          {transport.avgTravelTimePerSpot && (
            <p className="text-[11px] text-[#7D7667] flex items-center gap-1 pt-1 font-semibold">
              <Clock className="w-3.5 h-3.5 text-[#5A5A40]" />
              <span>Avg spot travel time: {transport.avgTravelTimePerSpot}</span>
            </p>
          )}
        </div>

        {/* Daily Cab Budget */}
        <div className="bg-[#F9F8F6] border border-[#E5E1D8] rounded-xl p-4 space-y-2">
          <span className="text-[10px] font-extrabold text-[#7D7667] uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-[#5A5A40]" /> Est. Daily Cab Expense
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono font-bold text-2xl text-[#5A5A40]">
              ${transport.estimatedDailyCabCost || 30}
            </span>
            <span className="text-xs text-[#7D7667] font-semibold">/ day</span>
          </div>
          <p className="text-xs text-[#7D7667] leading-relaxed">
            Covers 3–4 city rides or rideshares between top attractions.
          </p>
        </div>

        {/* Cab Tips */}
        <div className="bg-[#F9F8F6] border border-[#E5E1D8] rounded-xl p-4 space-y-2">
          <span className="text-[10px] font-extrabold text-[#7D7667] uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Fare & Safety Tips
          </span>
          <p className="text-xs text-[#33332D] leading-relaxed pt-0.5">
            {transport.cabFareTips || "Always ensure meters are running or set prices in rideshare apps beforehand."}
          </p>
        </div>
      </div>
    </div>
  );
}
