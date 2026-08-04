import React, { useState, useEffect } from "react";
import { DollarSign, Plane, Hotel, Utensils, HelpCircle, TrendingUp, Sparkles, Info } from "lucide-react";

interface BudgetTrackerProps {
  destinationName?: string;
  durationDays?: number;
  selectedCurrency?: string;
}

interface Currency {
  code: string;
  symbol: string;
  label: string;
  rateFromUSD: number;
}

const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", label: "USD", rateFromUSD: 1.0 },
  { code: "PKR", symbol: "Rs", label: "PKR", rateFromUSD: 278.5 },
  { code: "EUR", symbol: "€", label: "EURO", rateFromUSD: 0.92 },
  { code: "GBP", symbol: "£", label: "POUNDS", rateFromUSD: 0.78 },
  { code: "INR", symbol: "₹", label: "INR", rateFromUSD: 83.5 },
  { code: "JPY", symbol: "¥", label: "YEN", rateFromUSD: 155.0 },
  { code: "CAD", symbol: "C$", label: "CAD", rateFromUSD: 1.38 },
  { code: "AUD", symbol: "A$", label: "AUD", rateFromUSD: 1.52 },
  { code: "AED", symbol: "AED", label: "AED", rateFromUSD: 3.67 },
  { code: "SGD", symbol: "S$", label: "SGD", rateFromUSD: 1.35 },
  { code: "CHF", symbol: "CHF", label: "CHF", rateFromUSD: 0.88 },
];

export default function BudgetTracker({ destinationName = "Your Trip", durationDays = 3, selectedCurrency }: BudgetTrackerProps) {
  // Budget categories state (stored in the active currency)
  const [flights, setFlights] = useState<number>(0);
  const [hotelPerNight, setHotelPerNight] = useState<number>(0);
  const [foodPerDay, setFoodPerDay] = useState<number>(0);
  const [activities, setActivities] = useState<number>(0);
  const [other, setOther] = useState<number>(0);
  
  // Total budget limit (stored in the active currency)
  const [budgetLimit, setBudgetLimit] = useState<number>(1500);

  // Active currency
  const [activeCurrency, setActiveCurrency] = useState<string>("USD");

  // Synchronize currency when selectedCurrency prop changes globally
  useEffect(() => {
    if (selectedCurrency && selectedCurrency !== activeCurrency) {
      handleCurrencyChange(selectedCurrency);
    }
  }, [selectedCurrency]);

  // Load from localStorage on mount or when destination changes
  useEffect(() => {
    const key = `wanderai_budget_${destinationName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFlights(parsed.flights || 0);
        setHotelPerNight(parsed.hotelPerNight || 0);
        setFoodPerDay(parsed.foodPerDay || 0);
        setActivities(parsed.activities || 0);
        setOther(parsed.other || 0);
        setBudgetLimit(parsed.budgetLimit || 1500);
        setActiveCurrency(parsed.currency || "USD");
      } catch (e) {
        console.error("Failed to load saved budget:", e);
      }
    } else {
      // Set defaults based on duration (all in USD initially)
      setFlights(450);
      setHotelPerNight(120);
      setFoodPerDay(50);
      setActivities(150);
      setOther(50);
      setBudgetLimit(1200);
      setActiveCurrency("USD");
    }
  }, [destinationName]);

  // Persist values to localStorage
  const saveBudget = (
    f: number,
    hpn: number,
    fpd: number,
    act: number,
    oth: number,
    limit: number,
    curr: string = activeCurrency
  ) => {
    const key = `wanderai_budget_${destinationName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`;
    localStorage.setItem(
      key,
      JSON.stringify({
        flights: f,
        hotelPerNight: hpn,
        foodPerDay: fpd,
        activities: act,
        other: oth,
        budgetLimit: limit,
        currency: curr,
      })
    );
  };

  const totalHotels = hotelPerNight * durationDays;
  const totalFood = foodPerDay * durationDays;
  const totalEstimated = flights + totalHotels + totalFood + activities + other;

  // Percentage of budget limit used
  const limitPercentage = budgetLimit > 0 ? Math.min(Math.round((totalEstimated / budgetLimit) * 100), 100) : 0;
  const isOverBudget = totalEstimated > budgetLimit;

  // Change handlers with saving
  const handleFlightsChange = (val: number) => {
    setFlights(val);
    saveBudget(val, hotelPerNight, foodPerDay, activities, other, budgetLimit);
  };

  const handleHotelChange = (val: number) => {
    setHotelPerNight(val);
    saveBudget(flights, val, foodPerDay, activities, other, budgetLimit);
  };

  const handleFoodChange = (val: number) => {
    setFoodPerDay(val);
    saveBudget(flights, hotelPerNight, val, activities, other, budgetLimit);
  };

  const handleActivitiesChange = (val: number) => {
    setActivities(val);
    saveBudget(flights, hotelPerNight, foodPerDay, val, other, budgetLimit);
  };

  const handleOtherChange = (val: number) => {
    setOther(val);
    saveBudget(flights, hotelPerNight, foodPerDay, activities, val, budgetLimit);
  };

  const handleLimitChange = (val: number) => {
    setBudgetLimit(val);
    saveBudget(flights, hotelPerNight, foodPerDay, activities, other, val);
  };

  // Switch between currencies and convert values on the fly
  const handleCurrencyChange = (newCode: string) => {
    if (newCode === activeCurrency) return;
    
    const oldCurr = CURRENCIES.find(c => c.code === activeCurrency) || CURRENCIES[0];
    const newCurr = CURRENCIES.find(c => c.code === newCode) || CURRENCIES[0];
    
    // Multiplier = (Amount in USD * newRate) / (Amount in USD * oldRate) = newRate / oldRate
    const multiplier = newCurr.rateFromUSD / oldCurr.rateFromUSD;
    
    const f = Math.round(flights * multiplier);
    const hpn = Math.round(hotelPerNight * multiplier);
    const fpd = Math.round(foodPerDay * multiplier);
    const act = Math.round(activities * multiplier);
    const oth = Math.round(other * multiplier);
    const limit = Math.round(budgetLimit * multiplier);
    
    setFlights(f);
    setHotelPerNight(hpn);
    setFoodPerDay(fpd);
    setActivities(act);
    setOther(oth);
    setBudgetLimit(limit);
    setActiveCurrency(newCode);
    
    saveBudget(f, hpn, fpd, act, oth, limit, newCode);
  };

  // Get realistic estimations in active currency
  const getRealisticRates = () => {
    const destLower = destinationName.toLowerCase();
    let tier: "high" | "medium" | "low" = "medium";
    let tierLabel = "Moderate-Cost";
    let tierDescription = "Standard rates for typical hotspots.";

    const highCostKeywords = [
      "london", "paris", "tokyo", "york", "zurich", "sydney", "singapore", 
      "iceland", "reykjavik", "francisco", "geneva", "copenhagen", "oslo", 
      "stockholm", "amsterdam", "hawaii", "dubai", "boston", "chicago", 
      "los angeles", "vancouver", "toronto", "munich", "frankfurt", "venice",
      "swiss", "switzerland", "milano", "milan", "rome", "seoul", "hong kong"
    ];

    const lowCostKeywords = [
      "bangkok", "bali", "hanoi", "manila", "lahore", "karachi", "mumbai", 
      "delhi", "cairo", "marrakech", "medellin", "kathmandu", "vietnam", 
      "thailand", "indonesia", "pakistan", "india", "nepal", "egypt", 
      "colombia", "peru", "lima", "philippines", "budapest", "prague", 
      "istanbul", "turkey", "morocco", "bangladesh", "dhaka", "sri lanka",
      "colombo", "goa", "kuala lumpur", "malaysia", "cambodia", "phnom penh"
    ];

    if (highCostKeywords.some(keyword => destLower.includes(keyword))) {
      tier = "high";
      tierLabel = "Premium / High-Cost";
      tierDescription = "Reflects major global travel hubs & premium hotspots.";
    } else if (lowCostKeywords.some(keyword => destLower.includes(keyword))) {
      tier = "low";
      tierLabel = "Budget-Friendly";
      tierDescription = "Highly affordable accommodation, food, and sightseeing.";
    }

    const currentCurrencyObj = CURRENCIES.find(c => c.code === activeCurrency) || CURRENCIES[0];
    const rate = currentCurrencyObj.rateFromUSD;

    // Base rates in USD
    const ratesUSD = {
      high: {
        backpacker: { flights: 650, hotel: 45, food: 25, activities: 12, other: 8 },
        comfortable: { flights: 1100, hotel: 140, food: 60, activities: 40, other: 20 }
      },
      medium: {
        backpacker: { flights: 500, hotel: 30, food: 15, activities: 8, other: 5 },
        comfortable: { flights: 850, hotel: 85, food: 40, activities: 22, other: 12 }
      },
      low: {
        backpacker: { flights: 380, hotel: 12, food: 6, activities: 4, other: 3 },
        comfortable: { flights: 700, hotel: 40, food: 18, activities: 12, other: 7 }
      }
    };

    const selectedTierRates = ratesUSD[tier];

    // Convert to active currency
    const backpacker = {
      flights: Math.round(selectedTierRates.backpacker.flights * rate),
      hotelPerNight: Math.round(selectedTierRates.backpacker.hotel * rate),
      foodPerDay: Math.round(selectedTierRates.backpacker.food * rate),
      activities: Math.round(selectedTierRates.backpacker.activities * rate),
      other: Math.round(selectedTierRates.backpacker.other * rate),
    };

    const comfortable = {
      flights: Math.round(selectedTierRates.comfortable.flights * rate),
      hotelPerNight: Math.round(selectedTierRates.comfortable.hotel * rate),
      foodPerDay: Math.round(selectedTierRates.comfortable.food * rate),
      activities: Math.round(selectedTierRates.comfortable.activities * rate),
      other: Math.round(selectedTierRates.comfortable.other * rate),
    };

    const totalBackpacker = backpacker.flights + (backpacker.hotelPerNight * durationDays) + (backpacker.foodPerDay * durationDays) + backpacker.activities + backpacker.other;
    const totalComfortable = comfortable.flights + (comfortable.hotelPerNight * durationDays) + (comfortable.foodPerDay * durationDays) + comfortable.activities + comfortable.other;

    return {
      tier,
      tierLabel,
      tierDescription,
      backpacker: { ...backpacker, total: totalBackpacker },
      comfortable: { ...comfortable, total: totalComfortable }
    };
  };

  const handleApplyPreset = (preset: { flights: number, hotelPerNight: number, foodPerDay: number, activities: number, other: number, total: number }) => {
    setFlights(preset.flights);
    setHotelPerNight(preset.hotelPerNight);
    setFoodPerDay(preset.foodPerDay);
    setActivities(preset.activities);
    setOther(preset.other);
    const targetLimit = Math.ceil((preset.total * 1.1) / 50) * 50;
    setBudgetLimit(targetLimit);
    saveBudget(preset.flights, preset.hotelPerNight, preset.foodPerDay, preset.activities, preset.other, targetLimit);
  };

  const currentCurrencyObj = CURRENCIES.find(c => c.code === activeCurrency) || CURRENCIES[0];
  const symbol = currentCurrencyObj.symbol;

  return (
    <div className="bg-white rounded-2xl border border-[#DCD7CC] shadow-sm p-6 flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h3 className="font-serif font-bold text-lg text-[#33332D] flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#D4A373]" />
          Budget Tracker
        </h3>
        <p className="text-xs text-[#7D7667]">
          Estimate travel costs for <span className="font-semibold text-[#5A5A40]">{destinationName}</span> ({durationDays} days).
        </p>
      </div>

      {/* Synced Currency Indicator Banner */}
      <div className="bg-[#FAEED1]/50 border border-[#CCD5AE]/60 px-3.5 py-2 rounded-xl flex items-center justify-between">
        <span className="text-[10px] font-extrabold text-[#7D7667] uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#D4A373] animate-pulse"></span>
          Active Currency
        </span>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs font-bold text-[#5A5A40] bg-white px-2 py-0.5 rounded-md border border-[#DCD7CC]/60 shadow-2xs">
            {currentCurrencyObj.symbol} {currentCurrencyObj.code}
          </span>
          <span className="text-[10px] text-[#7D7667] font-semibold">
            (Synced app-wide)
          </span>
        </div>
      </div>

      {/* Progress Bar vs Budget Limit */}
      <div className="bg-[#F5F2ED] rounded-xl p-4 border border-[#E5E1D8]/80 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-[#7D7667] uppercase tracking-wide">Estimated Total</span>
          <span className="font-mono font-bold text-sm text-[#33332D]">{symbol}{totalEstimated.toLocaleString()}</span>
        </div>
        
        {/* Progress rail */}
        <div className="w-full h-2.5 bg-[#EAE7E0] rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${
              isOverBudget ? "bg-[#D4A373]" : "bg-[#5A5A40]"
            }`}
            style={{ width: `${limitPercentage}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[10px] text-[#7D7667] font-semibold">
          <span>{limitPercentage}% of target</span>
          <span className="flex items-center gap-1">
            Target ({symbol}): 
            <input 
              type="number" 
              value={budgetLimit} 
              onChange={(e) => handleLimitChange(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-16 text-right bg-transparent border-b border-[#DCD7CC] focus:outline-none focus:border-[#5A5A40] font-mono font-bold text-[#33332D] text-xs"
            />
          </span>
        </div>
      </div>

      {/* Dynamic Realistic Minimum Budget Estimates */}
      {(() => {
        const { tierLabel, tierDescription, backpacker, comfortable } = getRealisticRates();
        return (
          <div className="bg-[#FAEED1]/30 border border-[#CCD5AE]/40 rounded-2xl p-4 space-y-3">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-[#D4A373] mt-0.5 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-[#5A5A40] flex items-center gap-1.5">
                  WanderAI Budget Benchmarks
                </h4>
                <p className="text-[10px] text-[#7D7667] mt-0.5 leading-relaxed">
                  <span className="font-semibold text-[#5A5A40]">{destinationName}</span> matches a <strong className="text-[#5A5A40]">{tierLabel}</strong> profile. {tierDescription}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Backpacker Tier */}
              <div className="bg-white rounded-xl p-3 border border-[#DCD7CC]/60 flex flex-col justify-between gap-3 shadow-sm">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-[#7D7667] uppercase tracking-wider">Backpacker Min</span>
                    <span className="text-[11px] font-mono font-bold text-[#5A5A40] bg-[#E9EDC9]/60 px-1.5 py-0.5 rounded border border-[#CCD5AE]/30">
                      {symbol}{backpacker.total.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[9px] text-[#7D7667] mt-1 leading-relaxed">
                    Hostels, local transit, street food, and free/cheap sightseeing attractions.
                  </p>
                  
                  {/* Small breakdown grid */}
                  <div className="mt-2.5 pt-2 border-t border-[#F5F2ED] grid grid-cols-2 gap-x-2 gap-y-1.5 text-[8px] font-bold text-[#7D7667] uppercase tracking-tight font-mono">
                    <div className="flex items-center gap-1">🛫 Transit: <span className="font-mono font-extrabold text-[#33332D]">{symbol}{backpacker.flights}</span></div>
                    <div className="flex items-center gap-1">🏨 Stay: <span className="font-mono font-extrabold text-[#33332D]">{symbol}{backpacker.hotelPerNight}/nt</span></div>
                    <div className="flex items-center gap-1">🍽️ Food: <span className="font-mono font-extrabold text-[#33332D]">{symbol}{backpacker.foodPerDay}/d</span></div>
                    <div className="flex items-center gap-1">🎟️ Sights: <span className="font-mono font-extrabold text-[#33332D]">{symbol}{backpacker.activities}</span></div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleApplyPreset(backpacker)}
                  className="w-full text-center py-1.5 rounded-lg text-[9px] font-bold border border-[#5A5A40] text-[#5A5A40] hover:bg-[#5A5A40] hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  Apply Backpacker Preset
                </button>
              </div>

              {/* Comfortable Tier */}
              <div className="bg-white rounded-xl p-3 border border-[#DCD7CC]/60 flex flex-col justify-between gap-3 shadow-sm">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-[#D4A373] uppercase tracking-wider font-sans">Comfortable Min</span>
                    <span className="text-[11px] font-mono font-bold text-[#D4A373] bg-[#FAEED1] px-1.5 py-0.5 rounded border border-[#D4A373]/20">
                      {symbol}{comfortable.total.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[9px] text-[#7D7667] mt-1 leading-relaxed">
                    Cozy 3-star private rooms, casual dine-in meals, and major paid tours/sights.
                  </p>

                  {/* Small breakdown grid */}
                  <div className="mt-2.5 pt-2 border-t border-[#F5F2ED] grid grid-cols-2 gap-x-2 gap-y-1.5 text-[8px] font-bold text-[#7D7667] uppercase tracking-tight font-mono">
                    <div className="flex items-center gap-1">🛫 Transit: <span className="font-mono font-extrabold text-[#33332D]">{symbol}{comfortable.flights}</span></div>
                    <div className="flex items-center gap-1">🏨 Stay: <span className="font-mono font-extrabold text-[#33332D]">{symbol}{comfortable.hotelPerNight}/nt</span></div>
                    <div className="flex items-center gap-1">🍽️ Food: <span className="font-mono font-extrabold text-[#33332D]">{symbol}{comfortable.foodPerDay}/d</span></div>
                    <div className="flex items-center gap-1">🎟️ Sights: <span className="font-mono font-extrabold text-[#33332D]">{symbol}{comfortable.activities}</span></div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleApplyPreset(comfortable)}
                  className="w-full text-center py-1.5 rounded-lg text-[9px] font-bold bg-[#D4A373] text-white hover:bg-[#C29262] transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  Apply Comfortable Preset
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[8px] text-[#7D7667] font-semibold leading-relaxed border-t border-[#CCD5AE]/30 pt-2">
              <Info className="w-3.5 h-3.5 text-[#5A5A40] shrink-0" />
              <span>Real-time minimums are adjusted to {durationDays} days & converted instantly.</span>
            </div>
          </div>
        );
      })()}

      {/* Input Breakdown Fields */}
      <div className="space-y-3.5">
        {/* Flights Cost */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F5F2ED] border border-[#E5E1D8] flex items-center justify-center text-[#7D7667]">
              <Plane className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#33332D] block">Flights / Transit</span>
              <span className="text-[10px] text-[#7D7667] block">Round trip</span>
            </div>
          </div>
          <div className="relative w-28">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#7D7667] font-mono">{symbol}</span>
            <input 
              type="number"
              value={flights || ""}
              onChange={(e) => handleFlightsChange(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="0"
              className="w-full pl-7 pr-3 py-1.5 bg-[#F9F8F6] border border-[#E5E1D8] rounded-xl text-xs focus:outline-none focus:border-[#D4A373] text-right font-mono font-bold text-[#33332D]"
            />
          </div>
        </div>

        {/* Hotel per Night */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F5F2ED] border border-[#E5E1D8] flex items-center justify-center text-[#7D7667]">
              <Hotel className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#33332D] block">Hotel Accommodation</span>
              <span className="text-[10px] text-[#7D7667] block">{symbol}{hotelPerNight}/night × {durationDays} nights</span>
            </div>
          </div>
          <div className="relative w-28">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#7D7667] font-mono">{symbol}</span>
            <input 
              type="number"
              value={hotelPerNight || ""}
              onChange={(e) => handleHotelChange(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="0"
              className="w-full pl-7 pr-3 py-1.5 bg-[#F9F8F6] border border-[#E5E1D8] rounded-xl text-xs focus:outline-none focus:border-[#D4A373] text-right font-mono font-bold text-[#33332D]"
            />
          </div>
        </div>

        {/* Food & Dining per Day */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F5F2ED] border border-[#E5E1D8] flex items-center justify-center text-[#7D7667]">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#33332D] block">Food & Dining</span>
              <span className="text-[10px] text-[#7D7667] block">{symbol}{foodPerDay}/day × {durationDays} days</span>
            </div>
          </div>
          <div className="relative w-28">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#7D7667] font-mono">{symbol}</span>
            <input 
              type="number"
              value={foodPerDay || ""}
              onChange={(e) => handleFoodChange(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="0"
              className="w-full pl-7 pr-3 py-1.5 bg-[#F9F8F6] border border-[#E5E1D8] rounded-xl text-xs focus:outline-none focus:border-[#D4A373] text-right font-mono font-bold text-[#33332D]"
            />
          </div>
        </div>

        {/* Activities and sights */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F5F2ED] border border-[#E5E1D8] flex items-center justify-center text-[#7D7667]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#33332D] block">Activities & Sights</span>
              <span className="text-[10px] text-[#7D7667] block">Tours, museums, tickets</span>
            </div>
          </div>
          <div className="relative w-28">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#7D7667] font-mono">{symbol}</span>
            <input 
              type="number"
              value={activities || ""}
              onChange={(e) => handleActivitiesChange(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="0"
              className="w-full pl-7 pr-3 py-1.5 bg-[#F9F8F6] border border-[#E5E1D8] rounded-xl text-xs focus:outline-none focus:border-[#D4A373] text-right font-mono font-bold text-[#33332D]"
            />
          </div>
        </div>

        {/* Other costs */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F5F2ED] border border-[#E5E1D8] flex items-center justify-center text-[#7D7667]">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#33332D] block">Miscellaneous</span>
              <span className="text-[10px] text-[#7D7667] block">Souvenirs, shopping, emergency</span>
            </div>
          </div>
          <div className="relative w-28">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#7D7667] font-mono">{symbol}</span>
            <input 
              type="number"
              value={other || ""}
              onChange={(e) => handleOtherChange(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="0"
              className="w-full pl-7 pr-3 py-1.5 bg-[#F9F8F6] border border-[#E5E1D8] rounded-xl text-xs focus:outline-none focus:border-[#D4A373] text-right font-mono font-bold text-[#33332D]"
            />
          </div>
        </div>
      </div>

      {/* Alert if over budget */}
      {isOverBudget && (
        <div className="bg-[#FAEED1] text-[#D4A373] border border-[#D4A373]/30 p-3 rounded-xl text-xs font-bold flex items-center gap-1.5">
          ⚠️ Estimate is over target budget by {symbol}{(totalEstimated - budgetLimit).toLocaleString()}
        </div>
      )}
    </div>
  );
}
