import React, { useState, useEffect } from "react";
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Luggage,
  Sparkles,
  ListFilter,
  RotateCcw,
  Shirt,
  Smartphone,
  FileText,
  Sparkle,
  Thermometer,
  Umbrella,
  CheckCircle2,
  PackageCheck
} from "lucide-react";
import { WeatherForecast } from "../firebase";

export interface PackingItem {
  id: string;
  name: string;
  category: "Clothing" | "Toiletries" | "Electronics" | "Documents" | "Essentials" | "Weather & Activity";
  packed: boolean;
  isCustom?: boolean;
}

interface PackingChecklistCardProps {
  key?: React.Key;
  destination: string;
  weatherForecast?: WeatherForecast;
  durationDays?: number;
  savedChecklist?: PackingItem[];
  onChecklistChange?: (items: PackingItem[]) => void;
}

// Generate contextual pre-populated items
export function generateDefaultPackingList(
  destination: string,
  weatherForecast?: WeatherForecast,
  durationDays: number = 3
): PackingItem[] {
  const destLower = destination.toLowerCase();
  const weatherCond = (weatherForecast?.condition || "").toLowerCase();
  const tempRange = (weatherForecast?.temperatureRange || "").toLowerCase();
  const rainChanceStr = weatherForecast?.rainChance || "0%";
  const rainNum = parseInt(rainChanceStr.replace(/[^0-9]/g, ""), 10) || 0;

  const isCold = tempRange.includes("cold") || tempRange.includes("snow") || tempRange.includes("sub-zero") || tempRange.includes("below") || tempRange.includes("5°") || tempRange.includes("10°c") || tempRange.includes("30°f") || tempRange.includes("40°f") || weatherCond.includes("snow") || weatherCond.includes("chilly");
  const isRainy = rainNum >= 30 || weatherCond.includes("rain") || weatherCond.includes("shower") || weatherCond.includes("drizzle") || weatherCond.includes("storm");
  const isBeachOrTropical = destLower.includes("beach") || destLower.includes("bali") || destLower.includes("hawaii") || destLower.includes("phuket") || destLower.includes("caribbean") || destLower.includes("maldives") || destLower.includes("cancun") || tempRange.includes("30°c") || tempRange.includes("85°f") || tempRange.includes("90°f");

  const clothingCount = Math.min(Math.max(durationDays + 1, 3), 10);

  const list: PackingItem[] = [
    // Essentials & Documents
    { id: "doc-1", name: "Passport / Government ID & Visa", category: "Documents", packed: true },
    { id: "doc-2", name: "Flight & Hotel Confirmation Vouchers", category: "Documents", packed: true },
    { id: "doc-3", name: "Travel Insurance Policy Details", category: "Documents", packed: false },
    { id: "doc-4", name: "Credit Cards & Local Cash", category: "Documents", packed: true },

    // Electronics & Tech
    { id: "tech-1", name: "Smartphone & Long Charging Cable", category: "Electronics", packed: true },
    { id: "tech-2", name: "High-Capacity Portable Power Bank", category: "Electronics", packed: false },
    { id: "tech-3", name: `Universal Plug Adapter (${destination.includes("Japan") || destination.includes("USA") ? "Type A/B" : destination.includes("Europe") || destination.includes("Italy") || destination.includes("France") ? "Type C/F" : destination.includes("UK") ? "Type G" : "Multi-country"})`, category: "Electronics", packed: false },
    { id: "tech-4", name: "Noise-Canceling Earphones / Headphones", category: "Electronics", packed: false },

    // Toiletries & Personal Care
    { id: "toil-1", name: "Travel-size Toothbrush & Toothpaste", category: "Toiletries", packed: false },
    { id: "toil-2", name: "Sunscreen (SPF 50+ Broad Spectrum)", category: "Toiletries", packed: false },
    { id: "toil-3", name: "Deodorant & Skincare Moisturizer", category: "Toiletries", packed: false },
    { id: "toil-4", name: "Personal Prescription Medications & First Aid Kit", category: "Toiletries", packed: false },

    // Clothing
    { id: "cloth-1", name: `${clothingCount}x Lightweight Tops / T-Shirts`, category: "Clothing", packed: false },
    { id: "cloth-2", name: `${Math.ceil(durationDays / 2)}x Pants / Jeans / Shorts`, category: "Clothing", packed: false },
    { id: "cloth-3", name: `${clothingCount}x Sets of Underwear & Moisture-Wicking Socks`, category: "Clothing", packed: false },
    { id: "cloth-4", name: "Ultra-Comfortable Walking Shoes / Sneakers", category: "Clothing", packed: false },
    { id: "cloth-5", name: "Sleepwear & Pajamas", category: "Clothing", packed: false },

    // General Essentials
    { id: "ess-1", name: "Reusable Insulated Water Bottle", category: "Essentials", packed: false },
    { id: "ess-2", name: "Lightweight Daypack / Crossbody Travel Bag", category: "Essentials", packed: false },
    { id: "ess-3", name: "Hand Sanitizer & Disinfectant Wipes", category: "Essentials", packed: false },
  ];

  // Weather & Activity Specific Additions
  if (isCold) {
    list.push(
      { id: "weath-1", name: "Heavy Insulated Coat / Down Jacket", category: "Weather & Activity", packed: false },
      { id: "weath-2", name: "Thermal Base Layers & Warm Sweater", category: "Weather & Activity", packed: false },
      { id: "weath-3", name: "Beanie Hat, Scarf & Touchscreen Gloves", category: "Weather & Activity", packed: false }
    );
  } else if (isBeachOrTropical) {
    list.push(
      { id: "weath-4", name: "Swimwear & Quick-Dry Beach Towel", category: "Weather & Activity", packed: false },
      { id: "weath-5", name: "UV Polarized Sunglasses & Wide-Brim Sun Hat", category: "Weather & Activity", packed: false },
      { id: "weath-6", name: "Insect / Mosquito Repellent Spray", category: "Weather & Activity", packed: false },
      { id: "weath-7", name: "Comfortable Beach Sandals / Flip-Flops", category: "Weather & Activity", packed: false }
    );
  } else {
    list.push(
      { id: "weath-8", name: "Light Layering Cardigan / Windbreaker Jacket", category: "Weather & Activity", packed: false },
      { id: "weath-9", name: "UV Polarized Sunglasses", category: "Weather & Activity", packed: false }
    );
  }

  if (isRainy) {
    list.push(
      { id: "weath-10", name: "Compact Windproof Travel Umbrella", category: "Weather & Activity", packed: false },
      { id: "weath-11", name: "Waterproof Rain Poncho or Jacket", category: "Weather & Activity", packed: false }
    );
  }

  return list;
}

export default function PackingChecklistCard({
  destination,
  weatherForecast,
  durationDays = 3,
  savedChecklist,
  onChecklistChange
}: PackingChecklistCardProps) {
  const localStorageKey = `wanderai_packing_${destination.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`;

  const [items, setItems] = useState<PackingItem[]>(() => {
    if (savedChecklist && savedChecklist.length > 0) {
      return savedChecklist;
    }
    const cached = localStorage.getItem(localStorageKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error("Failed to parse cached packing list:", e);
      }
    }
    return generateDefaultPackingList(destination, weatherForecast, durationDays);
  });

  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<"All" | "Unpacked" | "Packed">("All");
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<PackingItem["category"]>("Essentials");

  // Sync state changes with localStorage and parent handler
  useEffect(() => {
    localStorage.setItem(localStorageKey, JSON.stringify(items));
    if (onChecklistChange) {
      onChecklistChange(items);
    }
  }, [items, localStorageKey, onChecklistChange]);

  // Toggle item packed status
  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, packed: !item.packed } : item))
    );
  };

  // Add custom item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: PackingItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: newItemName.trim(),
      category: newItemCategory,
      packed: false,
      isCustom: true
    };

    setItems((prev) => [newItem, ...prev]);
    setNewItemName("");
  };

  // Delete custom or unwanted item
  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Reset checklist to smart defaults
  const resetToDefaults = () => {
    if (window.confirm("Reset checklist to original smart defaults for " + destination + "?")) {
      const defaults = generateDefaultPackingList(destination, weatherForecast, durationDays);
      setItems(defaults);
    }
  };

  const packedCount = items.filter((i) => i.packed).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((packedCount / totalCount) * 100) : 0;

  const CATEGORIES = [
    "All",
    "Documents",
    "Clothing",
    "Toiletries",
    "Electronics",
    "Essentials",
    "Weather & Activity"
  ];

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesCat = filterCategory === "All" || item.category === filterCategory;
    const matchesStatus =
      filterStatus === "All"
        ? true
        : filterStatus === "Packed"
        ? item.packed
        : !item.packed;
    return matchesCat && matchesStatus;
  });

  return (
    <div className="bg-white rounded-3xl border border-[#DCD7CC] shadow-sm p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCD7CC]/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#5A5A40] bg-[#E9EDC9] px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <Luggage className="w-3 h-3 text-[#5A5A40]" /> Smart Packing Guide
            </span>
            {weatherForecast && (
              <span className="text-[10px] font-semibold text-[#7D7667] bg-[#F5F2ED] px-2 py-0.5 rounded-md flex items-center gap-1 border border-[#E5E1D8]">
                <Thermometer className="w-3 h-3 text-[#D4A373]" /> {weatherForecast.temperatureRange}
              </span>
            )}
          </div>
          <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#33332D]">
            Packing Checklist for {destination}
          </h3>
          <p className="text-xs text-[#7D7667]">
            Tailored for {durationDays} days in {destination} based on expected weather and local travel standards.
          </p>
        </div>

        {/* Reset Action */}
        <button
          type="button"
          onClick={resetToDefaults}
          className="self-start sm:self-center text-xs font-bold text-[#7D7667] hover:text-[#5A5A40] bg-[#F5F2ED] hover:bg-[#EAE7E0] border border-[#E5E1D8] px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          title="Reset to default checklist"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Progress Bar Header */}
      <div className="bg-[#FAEED1]/30 border border-[#D4A373]/25 p-4 rounded-2xl space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-[#33332D]">
          <span className="flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-[#D4A373]" />
            <span>Packing Progress</span>
          </span>
          <span className="font-mono text-[#5A5A40] bg-white px-2 py-0.5 rounded-lg border border-[#DCD7CC] shadow-2xs">
            {packedCount} / {totalCount} Items ({progressPercent}%)
          </span>
        </div>
        <div className="w-full bg-[#E5E1D8] h-3 rounded-full overflow-hidden p-0.5">
          <div
            className="bg-gradient-to-r from-[#D4A373] to-[#5A5A40] h-full rounded-full transition-all duration-300 shadow-2xs"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {progressPercent === 100 && (
          <p className="text-[11px] font-bold text-[#5A5A40] flex items-center gap-1 mt-1 animate-in fade-in duration-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> All items packed! You're completely ready to explore {destination}.
          </p>
        )}
      </div>

      {/* Add Custom Item Form */}
      <form onSubmit={handleAddItem} className="flex flex-col sm:flex-row gap-2.5 bg-[#F9F8F6] p-3.5 rounded-2xl border border-[#E5E1D8]">
        <div className="flex-1 relative">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Add custom item (e.g. Camera tripod, prescription glasses)..."
            className="w-full bg-white border border-[#DCD7CC] rounded-xl px-3.5 py-2 text-xs text-[#33332D] placeholder-[#7D7667]/60 focus:outline-none focus:ring-2 focus:ring-[#D4A373]/30 font-medium"
          />
        </div>
        <select
          value={newItemCategory}
          onChange={(e) => setNewItemCategory(e.target.value as any)}
          className="bg-white border border-[#DCD7CC] text-xs font-bold text-[#5A5A40] rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
        >
          <option value="Essentials">Essentials</option>
          <option value="Clothing">Clothing</option>
          <option value="Toiletries">Toiletries</option>
          <option value="Electronics">Electronics</option>
          <option value="Documents">Documents</option>
          <option value="Weather & Activity">Weather & Activity</option>
        </select>
        <button
          type="submit"
          disabled={!newItemName.trim()}
          className="bg-[#5A5A40] hover:bg-[#4A4A33] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer shrink-0 shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Item</span>
        </button>
      </form>

      {/* Filter Category & Status Controls */}
      <div className="flex flex-col gap-3">
        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] font-bold text-[#7D7667] uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <ListFilter className="w-3 h-3 text-[#7D7667]" /> Category:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all shrink-0 cursor-pointer ${
                filterCategory === cat
                  ? "bg-[#5A5A40] text-white shadow-2xs"
                  : "bg-[#F5F2ED] text-[#7D7667] hover:bg-[#EAE7E0] border border-[#E5E1D8]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Status Filter Toggle */}
        <div className="flex items-center justify-between border-t border-[#DCD7CC]/40 pt-3 text-xs">
          <span className="text-[11px] font-bold text-[#7D7667]">
            Showing {filteredItems.length} {filterCategory !== "All" ? filterCategory : ""} items
          </span>
          <div className="flex items-center gap-1 bg-[#F5F2ED] p-1 rounded-xl border border-[#E5E1D8]">
            {(["All", "Unpacked", "Packed"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  filterStatus === st
                    ? "bg-white text-[#33332D] shadow-2xs border border-[#DCD7CC]"
                    : "text-[#7D7667] hover:text-[#33332D]"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Checklist Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
        {filteredItems.length === 0 ? (
          <div className="col-span-full py-8 text-center text-[#7D7667] space-y-1">
            <p className="font-semibold text-xs">No items match your filter.</p>
            <button
              type="button"
              onClick={() => {
                setFilterCategory("All");
                setFilterStatus("All");
              }}
              className="text-xs text-[#D4A373] font-bold underline cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`p-3 rounded-2xl border transition-all duration-150 flex items-start justify-between gap-3 cursor-pointer select-none group ${
                item.packed
                  ? "bg-[#F5F2ED]/60 border-[#E5E1D8] text-[#7D7667]/70"
                  : "bg-white hover:bg-[#F9F8F6] border-[#DCD7CC] text-[#33332D] shadow-2xs hover:border-[#D4A373]/40"
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleItem(item.id);
                  }}
                  className={`mt-0.5 shrink-0 transition-colors cursor-pointer ${
                    item.packed ? "text-[#5A5A40]" : "text-[#7D7667] group-hover:text-[#D4A373]"
                  }`}
                >
                  {item.packed ? (
                    <CheckSquare className="w-4 h-4 fill-[#E9EDC9]" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
                <div className="min-w-0">
                  <p
                    className={`text-xs font-semibold leading-snug transition-all ${
                      item.packed ? "line-through text-[#7D7667]/70" : "text-[#33332D]"
                    }`}
                  >
                    {item.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] font-bold text-[#7D7667] uppercase tracking-wider bg-[#F5F2ED] px-1.5 py-0.2 rounded border border-[#E5E1D8]">
                      {item.category}
                    </span>
                    {item.isCustom && (
                      <span className="text-[9px] font-bold text-[#D4A373] bg-[#FAEED1] px-1.5 py-0.2 rounded">
                        Custom
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Delete Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeItem(item.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-[#7D7667] hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer shrink-0"
                title="Remove item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
