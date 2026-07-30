import React, { useState } from "react";
import { Wallet, Plane, Hotel, Utensils, Car, Ticket, ShieldAlert, Sparkles, Check, ArrowRight } from "lucide-react";
import { RealisticBudgetBreakdown } from "../firebase";

interface RealisticBudgetCardProps {
  budget?: RealisticBudgetBreakdown;
  destination: string;
  durationDays: number;
  onApplyToTracker?: (budget: RealisticBudgetBreakdown) => void;
}

export default function RealisticBudgetCard({
  budget,
  destination,
  durationDays,
  onApplyToTracker,
}: RealisticBudgetCardProps) {
  const [applied, setApplied] = useState(false);

  if (!budget) return null;

  const symbol = budget.currencySymbol || "$";

  const handleApply = () => {
    if (onApplyToTracker) {
      onApplyToTracker(budget);
      setApplied(true);
      setTimeout(() => setApplied(false), 2500);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#DCD7CC] shadow-sm p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E1D8] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="bg-[#FAEED1] text-[#D4A373] p-2.5 rounded-xl">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg text-[#33332D] flex items-center gap-2">
              Ultra-Realistic Estimated Trip Budget
            </h3>
            <p className="text-xs text-[#7D7667]">
              Accurate cost breakdown for <span className="font-semibold text-[#5A5A40]">{destination}</span> ({durationDays} days)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {budget.budgetLevel && (
            <span className="bg-[#E9EDC9] text-[#5A5A40] border border-[#CCD5AE] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {budget.budgetLevel}
            </span>
          )}

          {onApplyToTracker && (
            <button
              onClick={handleApply}
              className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                applied
                  ? "bg-emerald-600 text-white border border-emerald-600"
                  : "bg-[#D4A373] hover:bg-[#C29262] text-white"
              }`}
            >
              {applied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Applied to Tracker!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sync to Budget Tracker</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Itemized Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {/* Flights */}
        <div className="bg-[#F9F8F6] border border-[#E5E1D8] rounded-xl p-3 text-center space-y-1">
          <Plane className="w-4 h-4 text-[#D4A373] mx-auto" />
          <span className="text-[10px] font-bold text-[#7D7667] uppercase tracking-wider block">Roundtrip Flight</span>
          <p className="font-mono font-bold text-sm text-[#33332D]">
            {symbol}{budget.estimatedFlightCost || 0}
          </p>
          <span className="text-[9px] text-[#7D7667] block">per person</span>
        </div>

        {/* Hotel */}
        <div className="bg-[#F9F8F6] border border-[#E5E1D8] rounded-xl p-3 text-center space-y-1">
          <Hotel className="w-4 h-4 text-[#5A5A40] mx-auto" />
          <span className="text-[10px] font-bold text-[#7D7667] uppercase tracking-wider block">Hotel ({durationDays} nights)</span>
          <p className="font-mono font-bold text-sm text-[#33332D]">
            {symbol}{budget.hotelCostTotal || (budget.hotelCostPerNight * durationDays)}
          </p>
          <span className="text-[9px] text-[#7D7667] block">{symbol}{budget.hotelCostPerNight}/night</span>
        </div>

        {/* Food */}
        <div className="bg-[#F9F8F6] border border-[#E5E1D8] rounded-xl p-3 text-center space-y-1">
          <Utensils className="w-4 h-4 text-[#D4A373] mx-auto" />
          <span className="text-[10px] font-bold text-[#7D7667] uppercase tracking-wider block">Food & Dining</span>
          <p className="font-mono font-bold text-sm text-[#33332D]">
            {symbol}{budget.foodAndDiningTotal || (budget.foodAndDiningPerDay * durationDays)}
          </p>
          <span className="text-[9px] text-[#7D7667] block">{symbol}{budget.foodAndDiningPerDay}/day</span>
        </div>

        {/* Cab & Transit */}
        <div className="bg-[#F9F8F6] border border-[#E5E1D8] rounded-xl p-3 text-center space-y-1">
          <Car className="w-4 h-4 text-[#5A5A40] mx-auto" />
          <span className="text-[10px] font-bold text-[#7D7667] uppercase tracking-wider block">Cabs & Transit</span>
          <p className="font-mono font-bold text-sm text-[#33332D]">
            {symbol}{budget.cabAndTransitTotal || (budget.cabAndTransitPerDay * durationDays)}
          </p>
          <span className="text-[9px] text-[#7D7667] block">{symbol}{budget.cabAndTransitPerDay}/day</span>
        </div>

        {/* Attractions */}
        <div className="bg-[#F9F8F6] border border-[#E5E1D8] rounded-xl p-3 text-center space-y-1">
          <Ticket className="w-4 h-4 text-[#D4A373] mx-auto" />
          <span className="text-[10px] font-bold text-[#7D7667] uppercase tracking-wider block">Sightseeing & Fees</span>
          <p className="font-mono font-bold text-sm text-[#33332D]">
            {symbol}{budget.attractionsAndActivitiesTotal || 0}
          </p>
          <span className="text-[9px] text-[#7D7667] block">passes & entry</span>
        </div>

        {/* Misc */}
        <div className="bg-[#F9F8F6] border border-[#E5E1D8] rounded-xl p-3 text-center space-y-1">
          <ShieldAlert className="w-4 h-4 text-[#7D7667] mx-auto" />
          <span className="text-[10px] font-bold text-[#7D7667] uppercase tracking-wider block">SIM & Misc</span>
          <p className="font-mono font-bold text-sm text-[#33332D]">
            {symbol}{budget.miscellaneousTotal || 0}
          </p>
          <span className="text-[9px] text-[#7D7667] block">buffer & tips</span>
        </div>
      </div>

      {/* Grand Total Banner & Money Saving Tip */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
        <div className="md:col-span-5 bg-[#5A5A40] text-white rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#CCD5AE] block">
              Estimated Total Cost
            </span>
            <p className="text-2xl font-mono font-bold mt-0.5">
              {symbol}{budget.grandTotalEstimated?.toLocaleString() || 0}
            </p>
          </div>
          <div className="text-right text-[11px] text-[#CCD5AE] font-medium">
            <span>Tailored for {durationDays} days</span>
          </div>
        </div>

        {budget.moneySavingTip && (
          <div className="md:col-span-7 bg-[#FAEED1] border border-[#CCD5AE]/60 rounded-xl p-4 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-[#D4A373] shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <strong className="text-[#5A5A40] block font-bold">Local Money Saving Tip:</strong>
              <p className="text-[#33332D] leading-relaxed">{budget.moneySavingTip}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
