import React, { useState, useEffect } from "react";
import { 
  Compass, 
  MapPin, 
  Calendar, 
  Utensils, 
  History, 
  Trees, 
  Sparkles, 
  Trash2, 
  Save, 
  Moon, 
  Sun, 
  Sunrise, 
  Map, 
  Search, 
  Plus, 
  Loader2, 
  Share2, 
  Bookmark, 
  ChevronRight, 
  Info,
  X,
  Menu,
  Check,
  Download,
  Mail,
  Lock,
  LogOut,
  LogIn,
  User,
  Coins,
  DollarSign,
  Globe,
  ChevronDown
} from "lucide-react";
import { jsPDF } from "jspdf";
import { motion, AnimatePresence } from "motion/react";
import { onAuthStateChanged } from "firebase/auth";

import { 
  authenticateUser, 
  saveItinerary, 
  getSavedItineraries, 
  deleteSavedItinerary, 
  SavedItinerary,
  RealisticBudgetBreakdown,
  auth,
  registerWithEmailPassword,
  loginWithEmailPassword,
  loginWithGoogle,
  continueAsGuest,
  logoutUser
} from "./firebase";
import { generateItineraryApi } from "./lib/geminiClient";
import TripMap from "./components/TripMap";
import ChatBot from "./components/ChatBot";
import BudgetTracker from "./components/BudgetTracker";
import HotelOptionsCard from "./components/HotelOptionsCard";
import WeatherGuideCard from "./components/WeatherGuideCard";
import TransportGuideCard from "./components/TransportGuideCard";
import RealisticBudgetCard from "./components/RealisticBudgetCard";
import { Hotel, Car, CloudSun, Wallet } from "lucide-react";
import { SAMPLE_ITINERARIES } from "./data/samples";

// Supported Currencies List
const CURRENCY_OPTIONS = [
  { code: "USD", symbol: "$", label: "USD ($) - US Dollar" },
  { code: "PKR", symbol: "Rs", label: "PKR (Rs) - Pakistani Rupee" },
  { code: "EUR", symbol: "€", label: "EUR (€) - Euro" },
  { code: "GBP", symbol: "£", label: "GBP (£) - British Pound" },
  { code: "INR", symbol: "₹", label: "INR (₹) - Indian Rupee" },
  { code: "JPY", symbol: "¥", label: "JPY (¥) - Japanese Yen" },
  { code: "CAD", symbol: "C$", label: "CAD (C$) - Canadian Dollar" },
  { code: "AUD", symbol: "A$", label: "AUD (A$) - Australian Dollar" },
  { code: "AED", symbol: "AED", label: "AED - UAE Dirham" },
  { code: "SGD", symbol: "S$", label: "SGD (S$) - Singapore Dollar" },
  { code: "CHF", symbol: "CHF", label: "CHF - Swiss Franc" },
];

// Pre-defined popular interests with icons
const INTERESTS_PRESETS = [
  { id: "food", label: "Local Food", icon: "🍳", color: "bg-[#FAEED1] text-[#D4A373] border-[#D4A373]/30" },
  { id: "history", label: "History & Heritage", icon: "🏛️", color: "bg-[#F5F2ED] text-[#7D7667] border-[#E5E1D8]" },
  { id: "nature", label: "Nature & Outdoors", icon: "🌲", color: "bg-[#E9EDC9] text-[#5A5A40] border-[#CCD5AE]" },
  { id: "nightlife", label: "Nightlife & Pubs", icon: "🌙", color: "bg-[#F5F2ED] text-[#7D7667] border-[#E5E1D8]" },
  { id: "culture", label: "Art & Culture", icon: "🎨", color: "bg-[#F5F2ED] text-[#7D7667] border-[#E5E1D8]" },
  { id: "shopping", label: "Shopping & Markets", icon: "🛍️", color: "bg-[#F5F2ED] text-[#7D7667] border-[#E5E1D8]" },
  { id: "adventure", label: "Adventure Sports", icon: "🧗", color: "bg-[#F5F2ED] text-[#7D7667] border-[#E5E1D8]" },
  { id: "relaxation", label: "Relaxation & Spas", icon: "🧘", color: "bg-[#F5F2ED] text-[#7D7667] border-[#E5E1D8]" },
  { id: "family", label: "Family-Friendly", icon: "👪", color: "bg-[#F5F2ED] text-[#7D7667] border-[#E5E1D8]" },
];

export default function App() {
  // User Authentication State
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  // Email Password Auth Form States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Form States
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState("3");
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const [customBudget, setCustomBudget] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [hotelPreference, setHotelPreference] = useState("Mid-Range & Comfort");
  const [transportPreference, setTransportPreference] = useState("Cabs & Rideshares (Uber / Taxis)");
  
  // Custom suggestion click helper
  const SUGGESTED_DESTINATIONS = [
    { name: "Tokyo, Japan", lat: 35.6762, lng: 139.6503 },
    { name: "Rome, Italy", lat: 41.9028, lng: 12.4964 },
    { name: "New York, USA", lat: 40.7128, lng: -74.0060 },
    { name: "Paris, France", lat: 48.8566, lng: 2.3522 },
  ];

  // Itinerary Planning States
  const [activeItinerary, setActiveItinerary] = useState<SavedItinerary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Profile / Saved Trips list States
  const [savedTrips, setSavedTrips] = useState<SavedItinerary[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Map state
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 48.8566, lng: 2.3522 });

  // Initial Authentication Listener and load saved trips reactively
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsAuthenticating(true);
      if (user && !user.isAnonymous) {
        setUserId(user.uid);
        setUserEmail(user.email);
        setIsAnonymous(false);
        try {
          const trips = await getSavedItineraries(user.uid);
          setSavedTrips(trips);
        } catch (err) {
          console.error("Failed to load itineraries for authenticated user:", err);
        }
      } else if (user && user.isAnonymous) {
        setUserId(user.uid);
        setUserEmail("Guest Traveler");
        setIsAnonymous(true);
        try {
          const trips = await getSavedItineraries(user.uid);
          setSavedTrips(trips);
        } catch (err) {
          console.error("Failed to load guest itineraries:", err);
        }
      } else {
        // Automatically establish a guest session so user can immediately use app
        try {
          const res = await continueAsGuest();
          setUserId(res.uid);
          setUserEmail("Guest Traveler");
          setIsAnonymous(true);
          const trips = await getSavedItineraries(res.uid);
          setSavedTrips(trips);
        } catch (err) {
          console.error("Failed auto guest init:", err);
          let localId = localStorage.getItem("wanderai_local_user_id");
          if (!localId) {
            localId = "guest_" + Math.random().toString(36).substring(2, 10);
            localStorage.setItem("wanderai_local_user_id", localId);
          }
          setUserId(localId);
          setUserEmail("Guest Traveler");
          setIsAnonymous(true);
        }
      }
      setIsAuthenticating(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch updated list of saved trips
  const refreshSavedTrips = async (uid: string) => {
    try {
      const trips = await getSavedItineraries(uid);
      setSavedTrips(trips);
    } catch (err) {
      console.error("Failed to refresh saved trips:", err);
    }
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await loginWithGoogle();
      setIsAuthModalOpen(false);
    } catch (err: any) {
      console.error("Google sign in failed:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setAuthError("Sign-in popup was closed before completing.");
      } else if (err.code === "auth/operation-not-allowed" || (err.message && err.message.includes("operation-not-allowed"))) {
        setAuthError("Google Sign-In is disabled in the Firebase Console. You can click 'Continue as Guest' below to proceed immediately.");
      } else {
        setAuthError(err.message || "Failed to sign in with Google.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Guest Mode Continuation
  const handleGuestContinue = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await continueAsGuest();
      setUserId(res.uid);
      setUserEmail("Guest Traveler");
      setIsAnonymous(true);
      const trips = await getSavedItineraries(res.uid);
      setSavedTrips(trips);
      setIsAuthModalOpen(false);
    } catch (err) {
      console.error("Guest mode failed:", err);
      setAuthError("Failed to initialize guest session.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Email Password Registration or Login
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (isRegisterMode) {
        await registerWithEmailPassword(authEmail, authPassword);
      } else {
        await loginWithEmailPassword(authEmail, authPassword);
      }
      // Reset state and close modal
      setAuthEmail("");
      setAuthPassword("");
      setIsAuthModalOpen(false);
    } catch (err: any) {
      console.error("Authentication action failed:", err);
      let message = err.message || "An error occurred during authentication.";
      if (err.code === "auth/operation-not-allowed" || (err.message && err.message.includes("operation-not-allowed"))) {
        message = "Email & Password sign-in is not enabled on this Firebase project. Please sign in with Google or click 'Continue as Guest' below.";
      } else if (err.code === "auth/email-already-in-use" || (err.message && err.message.includes("email-already-in-use"))) {
        message = "This email is already in use.";
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found" || (err.message && err.message.includes("invalid-credential"))) {
        message = "Invalid email or password.";
      } else if (err.code === "auth/weak-password" || (err.message && err.message.includes("weak-password"))) {
        message = "Password should be at least 6 characters.";
      } else if (err.code === "auth/invalid-email" || (err.message && err.message.includes("invalid-email"))) {
        message = "Invalid email address format.";
      }
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setActiveItinerary(null);
    } catch (err) {
      console.error("Sign-out failed:", err);
    }
  };

  const toggleInterest = (interestId: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interestId)
        ? prev.filter((id) => id !== interestId)
        : [...prev, interestId]
    );
  };

  const getBudgetForDestination = (destinationName: string, durationDays: number) => {
    const key = `wanderai_budget_${destinationName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`;
    const saved = localStorage.getItem(key);
    
    const CURRENCIES = [
      { code: "USD", symbol: "$", label: "USD", rateFromUSD: 1.0 },
      { code: "EUR", symbol: "€", label: "EURO", rateFromUSD: 0.92 },
      { code: "GBP", symbol: "£", label: "POUNDS", rateFromUSD: 0.78 },
      { code: "INR", symbol: "₹", label: "INR", rateFromUSD: 83.5 },
      { code: "PKR", symbol: "Rs", label: "PKR", rateFromUSD: 278.5 },
    ];

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const flights = Number(parsed.flights) || 0;
        const hotelPerNight = Number(parsed.hotelPerNight) || 0;
        const foodPerDay = Number(parsed.foodPerDay) || 0;
        const activities = Number(parsed.activities) || 0;
        const other = Number(parsed.other) || 0;
        const budgetLimit = Number(parsed.budgetLimit) || 1200;
        const currencyCode = parsed.currency || "USD";
        
        const totalBudget = flights + (hotelPerNight * durationDays) + (foodPerDay * durationDays) + activities + other;
        const currencySymbol = CURRENCIES.find(c => c.code === currencyCode)?.symbol || "$";

        return {
          totalBudget,
          budgetLimit,
          currencyCode,
          currencySymbol
        };
      } catch (e) {
        console.error("Failed to parse saved budget:", e);
      }
    }

    // Fallback to default USD budget values
    const flights = 450;
    const hotelPerNight = 120;
    const foodPerDay = 50;
    const activities = 150;
    const other = 50;
    const budgetLimit = 1200;
    const currencyCode = "USD";
    const totalBudget = flights + (hotelPerNight * durationDays) + (foodPerDay * durationDays) + activities + other;
    
    return {
      totalBudget,
      budgetLimit,
      currencyCode,
      currencySymbol: "$"
    };
  };

  // Generate Itinerary using the Server proxy API
  const handlePlanTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) {
      setError("Please specify a destination city.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setActiveItinerary(null);
    setSaveSuccess(false);

    try {
      const interestsQuery = selectedInterests
        .map((id) => INTERESTS_PRESETS.find((i) => i.id === id)?.label)
        .filter(Boolean)
        .join(", ");

      const data = await generateItineraryApi(
        destination,
        parseInt(days, 10) || 3,
        interestsQuery,
        hotelPreference,
        transportPreference,
        selectedCurrency,
        customBudget
      );

      // Seed localStorage with realistic budget breakdown if available
      if (data.budgetBreakdown) {
        const key = `wanderai_budget_${data.destination.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`;
        const totalOther = (data.budgetBreakdown.cabAndTransitTotal || 0) + (data.budgetBreakdown.miscellaneousTotal || 0);
        const userLimit = customBudget && !isNaN(parseFloat(customBudget)) ? parseFloat(customBudget) : null;
        localStorage.setItem(
          key,
          JSON.stringify({
            flights: data.budgetBreakdown.estimatedFlightCost || 450,
            hotelPerNight: data.budgetBreakdown.hotelCostPerNight || 120,
            foodPerDay: data.budgetBreakdown.foodAndDiningPerDay || 50,
            activities: data.budgetBreakdown.attractionsAndActivitiesTotal || 150,
            other: totalOther,
            budgetLimit: userLimit || Math.ceil((data.budgetBreakdown.grandTotalEstimated * 1.1) / 50) * 50 || 1500,
            currency: data.budgetBreakdown.currencyCode || selectedCurrency,
          })
        );
      }

      const budgetInfo = getBudgetForDestination(data.destination, data.days.length);

      // Clean structure
      const itinerary: SavedItinerary = {
        userId: userId || "anonymous",
        createdAt: Date.now(),
        destination: data.destination,
        duration: parseInt(days, 10) || data.days.length,
        currency: data.budgetBreakdown?.currencyCode || selectedCurrency,
        lat: Number(data.lat) || 48.8566,
        lng: Number(data.lng) || 2.3522,
        summary: data.summary,
        days: data.days,
        hotelPreference,
        transportPreference,
        hotels: data.hotels,
        weatherForecast: data.weatherForecast,
        transportation: data.transportation,
        budgetBreakdown: data.budgetBreakdown,
        ...budgetInfo
      };

      setActiveItinerary(itinerary);
      setMapCenter({ lat: itinerary.lat, lng: itinerary.lng });
      setActiveDay(1);
    } catch (err: any) {
      console.error("Error planning trip:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Save trip to user profile in Firestore
  const handleSaveTrip = async () => {
    if (!userId || !activeItinerary) return;
    setSaving(true);
    try {
      const { id, ...itineraryData } = activeItinerary;
      const budgetInfo = getBudgetForDestination(activeItinerary.destination, activeItinerary.days.length);
      const mergedItineraryData = {
        ...itineraryData,
        ...budgetInfo
      };
      
      const docId = await saveItinerary(userId, mergedItineraryData);
      setSaveSuccess(true);
      
      // Add id to active and refresh list
      setActiveItinerary({ ...activeItinerary, id: docId, ...budgetInfo });
      await refreshSavedTrips(userId);

      // Auto clear alert banner after 4 seconds
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error("Error saving trip:", err);
      setError("Failed to save the trip to your profile.");
    } finally {
      setSaving(false);
    }
  };

  // Delete saved trip
  const handleDeleteTrip = async (itineraryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this itinerary?")) return;
    try {
      // Optimistically remove from state
      setSavedTrips((prev) => prev.filter((trip) => trip.id !== itineraryId));
      if (activeItinerary?.id === itineraryId) {
        setActiveItinerary(null);
      }
      
      await deleteSavedItinerary(userId || "guest", itineraryId);
      if (userId) {
        await refreshSavedTrips(userId);
      }
    } catch (err) {
      console.error("Failed to delete trip:", err);
      setError("Failed to delete the saved trip.");
      // Re-fetch to restore in case of failure
      if (userId) {
        await refreshSavedTrips(userId);
      }
    }
  };

  // Load a saved trip
  const handleLoadSavedTrip = async (itinerary: SavedItinerary) => {
    setIsSidebarOpen(false); // Close sidebar on mobile/desktop
    setSaveSuccess(false);

    if (itinerary.days && itinerary.days.length > 0) {
      setActiveItinerary(itinerary);
      if (itinerary.lat && itinerary.lng) {
        setMapCenter({ lat: itinerary.lat, lng: itinerary.lng });
      }
      setActiveDay(1);
    } else {
      // It's a simplified database itinerary. We'll automatically trigger planning/generation for them!
      setDestination(itinerary.destination);
      setDays(String(itinerary.duration || 3));
      
      // Update selected currency in budget tracker
      const key = `wanderai_budget_${itinerary.destination.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`;
      const savedBudget = localStorage.getItem(key);
      let parsedBudget: any = {};
      if (savedBudget) {
        try { parsedBudget = JSON.parse(savedBudget); } catch (e) {}
      }
      parsedBudget.currency = itinerary.currency || "USD";
      localStorage.setItem(key, JSON.stringify(parsedBudget));

      // Scroll to top where the loader/plan is displayed
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Trigger planning!
      setIsLoading(true);
      setError(null);
      try {
        const data = await generateItineraryApi(
          itinerary.destination,
          parseInt(String(itinerary.duration || 3), 10) || 3,
          ""
        );

        const budgetInfo = getBudgetForDestination(data.destination, data.days.length);

        const loadedItinerary: SavedItinerary = {
          id: itinerary.id, // preserve the firestore doc ID
          userId: userId || "anonymous",
          createdAt: itinerary.createdAt,
          destination: data.destination,
          lat: Number(data.lat) || 48.8566,
          lng: Number(data.lng) || 2.3522,
          summary: data.summary,
          days: data.days,
          duration: itinerary.duration || data.days.length,
          currency: itinerary.currency || "USD",
          ...budgetInfo
        };

        setActiveItinerary(loadedItinerary);
        setMapCenter({ lat: loadedItinerary.lat!, lng: loadedItinerary.lng! });
        setActiveDay(1);
      } catch (err: any) {
        console.error("Error loading saved trip:", err);
        setError(err.message || "Failed to generate itinerary. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Focus the map on a specific activity attraction coordinate
  const handleShowOnMap = (lat: number, lng: number) => {
    setMapCenter({ lat, lng });
  };

  // Download travel itinerary as a beautiful formatted PDF
  const handleDownloadPDF = () => {
    if (!activeItinerary) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const margin = 20;
    const pageHeight = 297;
    const pageWidth = 210;
    const contentWidth = pageWidth - (margin * 2);
    let y = 25;

    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - margin) {
        doc.addPage();
        y = 25;
        drawPageDecorations();
      }
    };

    const drawPageDecorations = () => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      
      // We only draw decorations if it's not the very first page or if we want it everywhere
      // Top header line
      doc.setDrawColor(220, 215, 204); // #DCD7CC
      doc.setLineWidth(0.3);
      doc.line(margin, 15, pageWidth - margin, 15);

      // Running Header text
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(125, 118, 103); // #7D7667
      doc.text("WANDERAI TRAVEL ITINERARY", margin, 12);
      doc.text(activeItinerary.destination.toUpperCase(), pageWidth - margin, 12, { align: "right" });

      // Footer line & page number
      doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
      doc.text(`Page ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: "right" });
      doc.text("Generated by WanderAI Trip Planner", margin, pageHeight - 10);
    };

    // --- PAGE 1 CONTENT ---
    // Brand Logo / Icon Box
    doc.setFillColor(90, 90, 64); // #5A5A40 Sage green
    doc.rect(margin, y, 10, 10, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.text("W", margin + 3.2, y + 6.8);

    doc.setTextColor(90, 90, 64); // #5A5A40
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.text("WanderAI", margin + 13, y + 7.5);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(125, 118, 103); // #7D7667
    doc.text("CUSTOM TRAVEL PLANNER", pageWidth - margin, y + 6.5, { align: "right" });

    y += 18;

    // Title
    doc.setTextColor(51, 51, 45); // #33332D
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    const titleText = `Explore ${activeItinerary.destination}`;
    doc.text(titleText, margin, y);
    y += 10;

    // Metadata block (e.g. Days & Date)
    doc.setDrawColor(220, 215, 204); // #DCD7CC
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(90, 90, 64); // #5A5A40
    doc.text(`${activeItinerary.days.length} DAYS PLAN`, margin, y);

    doc.setFont("Helvetica", "normal");
    doc.setTextColor(125, 118, 103); // #7D7667
    const dateStr = new Date(activeItinerary.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    doc.text(`Generated on ${dateStr}`, pageWidth - margin, y, { align: "right" });
    y += 10;

    // Summary Text
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(125, 118, 103); // #7D7667
    const summaryLines = doc.splitTextToSize(activeItinerary.summary, contentWidth);
    doc.text(summaryLines, margin, y);
    y += (summaryLines.length * 5) + 12;

    // Draw initial page decorations (for Page 1)
    drawPageDecorations();

    // 2. Day by Day Breakdown
    activeItinerary.days.forEach((dayPlan) => {
      checkPageBreak(35); // Check if enough room is available for starting a new Day heading

      // Day Heading Box
      doc.setFillColor(245, 242, 237); // #F5F2ED Background
      doc.rect(margin, y, contentWidth, 12, "F");
      
      doc.setDrawColor(220, 215, 204); // #DCD7CC Border
      doc.setLineWidth(0.3);
      doc.rect(margin, y, contentWidth, 12, "S");

      doc.setTextColor(90, 90, 64); // #5A5A40
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`DAY ${dayPlan.dayNumber}`, margin + 5, y + 7.5);
      
      y += 18;

      // Morning, Afternoon, Evening Activities
      const times = [
        { key: "morning", label: "Morning Activity", color: [90, 90, 64] as [number, number, number] }, // #5A5A40
        { key: "afternoon", label: "Afternoon Activity", color: [212, 163, 115] as [number, number, number] }, // #D4A373
        { key: "evening", label: "Evening Activity", color: [125, 118, 103] as [number, number, number] } // #7D7667
      ];

      times.forEach((time) => {
        const act = (dayPlan as any)[time.key];
        if (!act) return;

        // Calculate heights of title, location, description
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10);
        const actTitleLines = doc.splitTextToSize(act.title, contentWidth - 15);
        
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);
        const actLocLines = doc.splitTextToSize(`Location: ${act.locationName}`, contentWidth - 15);
        const actDescLines = doc.splitTextToSize(act.description, contentWidth - 15);

        const itemHeight = (actTitleLines.length * 5) + (actLocLines.length * 4.5) + (actDescLines.length * 4.5) + 12;
        checkPageBreak(itemHeight + 5);

        // Icon color indicator bullet/rect
        doc.setFillColor(time.color[0], time.color[1], time.color[2]);
        doc.rect(margin + 2, y + 1, 4, 4, "F");

        // Label and Title
        doc.setTextColor(time.color[0], time.color[1], time.color[2]);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8);
        doc.text(time.label.toUpperCase(), margin + 10, y + 4);
        y += 8;

        doc.setTextColor(51, 51, 45); // #33332D
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(11);
        doc.text(actTitleLines, margin + 10, y);
        y += (actTitleLines.length * 5) + 1;

        // Location
        doc.setTextColor(125, 118, 103); // #7D7667
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);
        doc.text(actLocLines, margin + 10, y);
        y += (actLocLines.length * 4.5) + 2;

        // Description
        doc.setTextColor(125, 118, 103); // #7D7667
        doc.text(actDescLines, margin + 10, y);
        y += (actDescLines.length * 4.5) + 8;
      });

      // Food tip of the day
      if (dayPlan.foodTip) {
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);
        const foodTipLines = doc.splitTextToSize(dayPlan.foodTip, contentWidth - 20);
        const boxHeight = (foodTipLines.length * 4.5) + 12;

        checkPageBreak(boxHeight + 10);

        // Colored light beige box for food tip
        doc.setFillColor(250, 238, 209); // #FAEED1 Light Sand
        doc.rect(margin, y, contentWidth, boxHeight, "F");
        doc.setDrawColor(212, 163, 115); // #D4A373 Sand Border
        doc.setLineWidth(0.3);
        doc.rect(margin, y, contentWidth, boxHeight, "S");

        doc.setTextColor(212, 163, 115); // #D4A373
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8);
        doc.text("LOCAL FOOD TIP", margin + 6, y + 5);

        doc.setTextColor(90, 90, 64); // #5A5A40 Sage Green text
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);
        doc.text(foodTipLines, margin + 6, y + 10);

        y += boxHeight + 12;
      }
    });

    // Save PDF file
    const fileName = `${activeItinerary.destination.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_itinerary.pdf`;
    doc.save(fileName);
  };

  // Helper to generate current day's map markers
  const getMapMarkers = () => {
    if (!activeItinerary) return [];
    
    // Add central city marker
    const markers: any[] = [
      {
        id: "city-center",
        lat: activeItinerary.lat,
        lng: activeItinerary.lng,
        title: activeItinerary.destination,
        type: "city",
        timeOfDay: "Destination Center",
        description: "Welcome to " + activeItinerary.destination,
      }
    ];

    const currentDayPlan = activeItinerary.days.find((d) => d.dayNumber === activeDay);
    if (currentDayPlan) {
      if (currentDayPlan.morning) {
        markers.push({
          id: `day-${activeDay}-morning`,
          lat: currentDayPlan.morning.latitude,
          lng: currentDayPlan.morning.longitude,
          title: currentDayPlan.morning.title,
          type: "morning",
          timeOfDay: "Morning",
          description: currentDayPlan.morning.locationName,
        });
      }
      if (currentDayPlan.afternoon) {
        markers.push({
          id: `day-${activeDay}-afternoon`,
          lat: currentDayPlan.afternoon.latitude,
          lng: currentDayPlan.afternoon.longitude,
          title: currentDayPlan.afternoon.title,
          type: "afternoon",
          timeOfDay: "Afternoon",
          description: currentDayPlan.afternoon.locationName,
        });
      }
      if (currentDayPlan.evening) {
        markers.push({
          id: `day-${activeDay}-evening`,
          lat: currentDayPlan.evening.latitude,
          lng: currentDayPlan.evening.longitude,
          title: currentDayPlan.evening.title,
          type: "evening",
          timeOfDay: "Evening",
          description: currentDayPlan.evening.locationName,
        });
      }
    }

    return markers;
  };

  if (isAuthenticating) {
    return (
      <div className="min-h-screen bg-[#F5F2ED] text-[#33332D] font-sans flex flex-col items-center justify-center antialiased">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-[#5A5A40] rounded-xl flex items-center justify-center text-white shadow-md animate-bounce">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <p className="font-serif font-semibold text-[#5A5A40] tracking-wide">Preparing Your Travel Compass...</p>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-[#D4A373] rounded-full animate-ping" />
            <div className="w-1.5 h-1.5 bg-[#D4A373] rounded-full animate-ping [animation-delay:0.2s]" />
            <div className="w-1.5 h-1.5 bg-[#D4A373] rounded-full animate-ping [animation-delay:0.4s]" />
          </div>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-[#F5F2ED] text-[#33332D] font-sans flex flex-col antialiased">
        {/* Simple Header */}
        <header className="bg-white/50 backdrop-blur-md border-b border-[#DCD7CC] px-4 py-3.5 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#5A5A40] rounded-lg flex items-center justify-center text-white shadow-sm">
                <Compass className="w-4.5 h-4.5 animate-spin-slow" />
              </div>
              <div>
                <h1 className="font-serif font-bold text-xl tracking-tight text-[#5A5A40] leading-none">
                  WanderAI
                </h1>
                <span className="text-[10px] text-[#7D7667] font-bold tracking-widest uppercase">AI Trip Planner</span>
              </div>
            </div>
          </div>
        </header>

        {/* Auth Gate Content */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-md bg-white rounded-3xl border border-[#DCD7CC] shadow-xl overflow-hidden flex flex-col"
          >
            {/* Elegant Header section */}
            <div className="p-6 sm:p-8 border-b border-[#DCD7CC]/60 bg-[#FAEED1]/25 text-center flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-[#5A5A40] rounded-2xl flex items-center justify-center text-white shadow-sm">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-2xl text-[#33332D]">
                  {isRegisterMode ? "Create Your Account" : "Sign In to Your Journey"}
                </h2>
                <p className="text-xs text-[#7D7667] mt-1 max-w-xs mx-auto font-medium leading-relaxed">
                  {isRegisterMode 
                    ? "Join WanderAI to design customized daily itineraries, explore maps, track travel budgets, and consult our AI guide."
                    : "Sign in to access your saved itineraries, budget logs, and custom AI-curated trips."}
                </p>
              </div>
            </div>

            {/* Auth Form */}
            <div className="p-6 sm:p-8 space-y-6">
              {authError && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-xs font-semibold leading-relaxed flex items-start gap-2">
                  <span className="text-sm">⚠️</span>
                  <div>{authError}</div>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#7D7667] uppercase tracking-wider block">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D7667] w-4 h-4" />
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="traveler@wanderai.com"
                      className="w-full pl-11 pr-4 py-3 bg-[#F9F8F6] border border-[#E5E1D8] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4A373]/30 focus:border-[#D4A373] text-sm placeholder-[#7D7667]/50 transition-all font-medium text-[#33332D]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#7D7667] uppercase tracking-wider block">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D7667] w-4 h-4" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-4 py-3 bg-[#F9F8F6] border border-[#E5E1D8] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4A373]/30 focus:border-[#D4A373] text-sm placeholder-[#7D7667]/50 transition-all font-medium text-[#33332D]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-[#5A5A40] hover:bg-[#4A4A33] text-white font-bold py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-75 cursor-pointer text-sm font-sans tracking-wide"
                >
                  {authLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isRegisterMode ? (
                    "Create Free Account"
                  ) : (
                    "Sign In to WanderAI"
                  )}
                </button>
              </form>

              {/* Alternative Auth options: Google & Guest Mode */}
              <div className="space-y-3 pt-4 border-t border-[#DCD7CC]/60">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={authLoading}
                  className="w-full bg-white hover:bg-[#F9F8F6] text-[#33332D] font-bold py-3 px-4 rounded-xl border border-[#DCD7CC] shadow-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer text-sm"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Sign in with Google</span>
                </button>

                <button
                  type="button"
                  onClick={handleGuestContinue}
                  disabled={authLoading}
                  className="w-full bg-[#F5F2ED] hover:bg-[#EAE7E0] text-[#5A5A40] font-bold py-3 px-4 rounded-xl border border-[#E5E1D8] flex items-center justify-center gap-2 transition-all cursor-pointer text-sm"
                >
                  <User className="w-4 h-4 shrink-0" />
                  <span>Continue as Guest (Instant Access)</span>
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  onClick={() => {
                    setIsRegisterMode(!isRegisterMode);
                    setAuthError(null);
                  }}
                  className="text-xs text-[#D4A373] hover:text-[#C29262] font-bold underline transition-colors cursor-pointer"
                >
                  {isRegisterMode ? "Already have an account? Sign In" : "New to WanderAI? Create a free account"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <footer className="border-t border-[#DCD7CC] bg-white/40 py-6 text-center text-xs text-[#7D7667]">
          <p>© 2026 WanderAI trip planner. Powered by Google Gemini-2.5-flash.</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#33332D] font-sans flex flex-col antialiased">
      {/* Header Banner / Navbar */}
      <header className="sticky top-0 z-[1001] bg-white/50 backdrop-blur-md border-b border-[#DCD7CC] px-4 py-3.5 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#5A5A40] rounded-lg flex items-center justify-center text-white shadow-sm">
              <Compass className="w-4.5 h-4.5 animate-spin-slow" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-xl tracking-tight text-[#5A5A40] leading-none">
                WanderAI
              </h1>
              <span className="text-[10px] text-[#7D7667] font-bold tracking-widest uppercase">AI Trip Planner</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            {/* Global Currency Selector Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCurrencyMenuOpen(!isCurrencyMenuOpen)}
                className="inline-flex items-center gap-1.5 bg-[#FAEED1] hover:bg-[#F5E6BE] text-[#5A5A40] font-bold px-3 py-1.5 rounded-xl text-xs border border-[#D4A373]/50 cursor-pointer transition-all duration-200 shadow-2xs"
                title="Set currency across all features"
              >
                <Globe className="w-3.5 h-3.5 text-[#D4A373]" />
                <span>Currency: <strong className="text-[#33332D]">{selectedCurrency}</strong></span>
                <span className="text-[10px] font-mono font-bold text-[#7D7667] bg-white/70 px-1 py-0.2 rounded">
                  {CURRENCY_OPTIONS.find((c) => c.code === selectedCurrency)?.symbol || "$"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#7D7667]" />
              </button>

              {isCurrencyMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-[#DCD7CC] rounded-2xl shadow-xl p-2 z-[2000] space-y-1 animate-in fade-in duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-extrabold text-[#7D7667] uppercase tracking-wider border-b border-[#E5E1D8] flex justify-between items-center">
                    <span>Select App Currency</span>
                    <span className="text-[#5A5A40] font-bold">11 Currencies</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-0.5 pt-1 pr-0.5">
                    {CURRENCY_OPTIONS.map((curr) => (
                      <button
                        key={curr.code}
                        type="button"
                        onClick={() => {
                          setSelectedCurrency(curr.code);
                          setIsCurrencyMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                          selectedCurrency === curr.code
                            ? "bg-[#E9EDC9] text-[#5A5A40] font-bold border border-[#CCD5AE]/60"
                            : "text-[#33332D] hover:bg-[#F5F2ED]"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="font-mono text-xs font-bold text-[#D4A373] min-w-[24px] text-center bg-[#FAEED1]/60 px-1.5 py-0.5 rounded-md">
                            {curr.symbol}
                          </span>
                          <span>{curr.code}</span>
                        </span>
                        <span className="text-[10px] text-[#7D7667]">
                          {curr.label.split("-")[1]?.trim() || curr.code}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Auth Indicator and Sign In / Out */}
            {isAnonymous ? (
              <button
                onClick={() => {
                  setIsRegisterMode(false);
                  setAuthError(null);
                  setIsAuthModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 bg-[#5A5A40] hover:bg-[#4A4A33] text-white font-bold px-3 py-1.5 rounded-xl text-xs uppercase tracking-tight shadow-sm transition-all duration-200 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-[#E9EDC9]/60 border border-[#CCD5AE]/40 px-2.5 py-1 rounded-xl">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-[8px] font-bold text-[#7D7667] uppercase tracking-wider">Signed In</span>
                  <span className="text-[10px] font-semibold text-[#5A5A40] truncate max-w-[100px]" title={userEmail || ""}>{userEmail}</span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="bg-white/85 hover:bg-[#FAEED1] text-[#7D7667] hover:text-[#D4A373] p-1.5 rounded-lg border border-[#DCD7CC] transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {userId && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="relative inline-flex items-center gap-2 bg-[#EAE7E0] hover:bg-[#DCD7CC] text-[#5A5A40] font-bold px-3 py-1.5 rounded-xl text-xs transition-all duration-200 border border-[#DCD7CC] cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>My Saved Trips</span>
                {savedTrips.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#D4A373] text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-[#F5F2ED] font-bold">
                    {savedTrips.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Side: Builder Form */}
        <section className="w-full lg:w-[380px] shrink-0 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-[#DCD7CC] shadow-sm p-6 flex flex-col gap-5">
            <div>
              <h2 className="font-serif font-bold text-xl text-[#33332D] mb-1 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D4A373]" />
                Design Your Journey
              </h2>
              <p className="text-xs text-[#7D7667]">
                Provide your preferences and let our AI create a custom daily itinerary.
              </p>
            </div>

            <form onSubmit={handlePlanTrip} className="space-y-5">
              {/* Destination Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#7D7667] uppercase tracking-wider block">
                  Where to go?
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D7667] w-5 h-5" />
                  <input
                    type="text"
                    required
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. Rome, Tokyo, New York..."
                    className="w-full pl-11 pr-4 py-3 bg-[#F9F8F6] border border-[#E5E1D8] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4A373]/30 focus:border-[#D4A373] text-sm placeholder-[#7D7667]/50 transition-all font-medium text-[#33332D]"
                  />
                </div>
                {/* Suggestions */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[11px] text-[#7D7667] self-center font-semibold">Try:</span>
                  {SUGGESTED_DESTINATIONS.map((dest) => (
                    <button
                      key={dest.name}
                      type="button"
                      onClick={() => {
                        setDestination(dest.name);
                        setMapCenter({ lat: dest.lat, lng: dest.lng });
                      }}
                      className="text-[11px] bg-[#F5F2ED] hover:bg-[#E5E1D8] text-[#7D7667] font-semibold px-2 py-0.5 rounded-lg transition-all"
                    >
                      {dest.name.split(",")[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trip Currency Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#7D7667] uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-[#5A5A40]" /> Preferred Trip Currency
                  </span>
                  <span className="text-[10px] text-[#5A5A40] font-bold bg-[#E9EDC9] px-2 py-0.5 rounded-md">
                    Synced App-wide
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCurrencyMenuOpen(!isCurrencyMenuOpen)}
                  className="w-full bg-[#F9F8F6] hover:bg-[#F5F2ED] border border-[#E5E1D8] text-[#33332D] text-xs font-bold rounded-xl px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition-all shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#D4A373]" />
                    <span>{CURRENCY_OPTIONS.find((c) => c.code === selectedCurrency)?.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold bg-[#E5E1D8]/60 text-[#5A5A40] px-2 py-0.5 rounded-lg font-mono">
                      {CURRENCY_OPTIONS.find((c) => c.code === selectedCurrency)?.symbol || "$"}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#7D7667]" />
                  </div>
                </button>
              </div>

              {/* Target Total Budget (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#7D7667] uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-[#5A5A40]" /> Target Total Trip Budget
                  </span>
                  <span className="text-[10px] text-[#7D7667]">
                    Optional Limit
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    placeholder={`e.g. 150000 (${CURRENCY_OPTIONS.find((c) => c.code === selectedCurrency)?.symbol || "$"})`}
                    value={customBudget}
                    onChange={(e) => setCustomBudget(e.target.value)}
                    className="w-full bg-[#F9F8F6] border border-[#E5E1D8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4A373]/30 focus:border-[#D4A373] text-[#33332D] text-xs font-bold rounded-xl pl-9 pr-14 py-2.5 transition-all"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5A40] font-bold text-xs">
                    {CURRENCY_OPTIONS.find((c) => c.code === selectedCurrency)?.symbol || "$"}
                  </div>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#7D7667] font-semibold">
                    {selectedCurrency}
                  </span>
                </div>
                <p className="text-[10px] text-[#7D7667]">
                  If set, WanderAI will tailor hotels, dining, and transit to stay within this limit.
                </p>
              </div>

              {/* Number of Days Selector */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-[#7D7667] uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#5A5A40]" /> Duration (Days)
                  </label>
                  <span className="text-xs text-[#5A5A40] font-bold">
                    {days ? `${days} ${parseInt(days, 10) === 1 ? 'day' : 'days'}` : 'Select days'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="grid grid-cols-5 gap-1 flex-1">
                    {["1", "3", "7", "14", "30"].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setDays(num)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all duration-150 cursor-pointer ${
                          days === num
                            ? "bg-[#5A5A40] border-[#5A5A40] text-white shadow-xs"
                            : "bg-[#F5F2ED] hover:bg-[#E5E1D8] border-[#E5E1D8] text-[#7D7667]"
                        }`}
                      >
                        {num}d
                      </button>
                    ))}
                  </div>
                  <div className="w-28 shrink-0 relative">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={days}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || (parseInt(val, 10) >= 1 && parseInt(val, 10) <= 31)) {
                          setDays(val);
                        }
                      }}
                      placeholder="Custom"
                      className="w-full bg-[#F9F8F6] border border-[#E5E1D8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4A373]/30 focus:border-[#D4A373] text-[#33332D] text-xs font-bold rounded-xl px-2.5 py-2 text-center transition-all"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#7D7667] font-semibold pointer-events-none">
                      days
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-[#7D7667]">
                  Select a preset or enter any custom duration (1 to 31 days).
                </p>
              </div>

              {/* Hotel Accommodation Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#7D7667] uppercase tracking-wider flex items-center gap-1">
                  <Hotel className="w-3.5 h-3.5 text-[#5A5A40]" /> Hotel Accommodation Tier
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: "Budget & Hostels ($)", value: "Budget & Hostels" },
                    { label: "Mid-Range & Comfort ($$)", value: "Mid-Range & Comfort" },
                    { label: "Boutique Stays ($$$)", value: "Boutique Stays" },
                    { label: "Luxury 5-Star ($$$$)", value: "Luxury 5-Star" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setHotelPreference(opt.value)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between cursor-pointer ${
                        hotelPreference === opt.value
                          ? "bg-[#5A5A40] border-[#5A5A40] text-white shadow-xs"
                          : "bg-[#F5F2ED] hover:bg-[#E5E1D8] border-[#E5E1D8] text-[#7D7667]"
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cab & Transport Mode Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#7D7667] uppercase tracking-wider flex items-center gap-1">
                  <Car className="w-3.5 h-3.5 text-[#5A5A40]" /> Preferred Local Transport
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: "Cabs & Rideshares 🚕", value: "Cabs & Rideshares (Uber / Taxis)" },
                    { label: "Public Transit 🚆", value: "Public Metro & Transit" },
                    { label: "Self-Drive Rental 🚗", value: "Self-Drive Rental Car" },
                    { label: "Private Driver 🚘", value: "Private Driver / Chauffeur" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTransportPreference(opt.value)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between cursor-pointer ${
                        transportPreference === opt.value
                          ? "bg-[#5A5A40] border-[#5A5A40] text-white shadow-xs"
                          : "bg-[#F5F2ED] hover:bg-[#E5E1D8] border-[#E5E1D8] text-[#7D7667]"
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Select Interests Chips */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#7D7667] uppercase tracking-wider block">
                  Select Your Interests
                </label>
                <div className="flex flex-wrap gap-2 max-h-[190px] overflow-y-auto pr-1">
                  {INTERESTS_PRESETS.map((interest) => {
                    const isSelected = selectedInterests.includes(interest.id);
                    return (
                      <button
                        key={interest.id}
                        type="button"
                        onClick={() => toggleInterest(interest.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all-300 cursor-pointer ${
                          isSelected
                            ? "bg-[#5A5A40] text-white border-[#5A5A40] shadow-sm"
                            : `${interest.color} hover:brightness-95`
                        }`}
                      >
                        <span>{interest.icon}</span>
                        <span>{interest.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#D4A373] hover:bg-[#C29262] text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-[#D4A373]/20 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analyzing Destination...</span>
                  </>
                ) : (
                  <>
                    <Compass className="w-5 h-5" />
                    <span>Plan my Trip</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick FAQ / Guide */}
          <div className="bg-[#E9EDC9]/25 rounded-2xl p-5 border border-[#CCD5AE]/40 text-xs text-[#7D7667] leading-relaxed space-y-2">
            <h4 className="font-semibold text-[#5A5A40] flex items-center gap-1">
              <Info className="w-4 h-4 text-[#5A5A40] shrink-0" />
              How it works
            </h4>
            <p>
              WanderAI cross-references millions of global landmark coordinates to plot real locations on our map. Changes in days will immediately sync coordinates.
            </p>
          </div>

          {/* Budget Tracker */}
          <BudgetTracker 
            destinationName={activeItinerary ? activeItinerary.destination : (destination || "Your Trip")}
            durationDays={activeItinerary ? activeItinerary.days.length : days}
            selectedCurrency={selectedCurrency}
          />
        </section>

        {/* Right Side: Output Itinerary & Interactive Map */}
        <section className="flex-1 flex flex-col gap-6 min-w-0">
          
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl text-sm font-medium flex items-start gap-2.5"
              >
                <div className="bg-red-100 text-red-800 p-1 rounded-lg">⚠️</div>
                <div className="flex-1">
                  <p className="font-semibold text-red-900">Itinerary Generation Error</p>
                  <p className="text-red-700 mt-0.5">{error}</p>
                </div>
              </motion.div>
            )}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-3xl border border-[#DCD7CC] shadow-sm p-12 flex flex-col items-center justify-center text-center gap-5 min-h-[450px]"
              >
                <div className="relative flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full border-4 border-[#E5E1D8] border-t-[#D4A373] animate-spin"></div>
                  <Compass className="absolute w-7 h-7 text-[#D4A373] animate-pulse" />
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h3 className="font-serif font-bold text-xl text-[#33332D]">Mapping Your Journey...</h3>
                  <p className="text-sm text-[#7D7667] leading-relaxed">
                    Consulting local travel experts and calculating real geographical coordinates for the activities.
                  </p>
                </div>
              </motion.div>
            )}

            {!isLoading && !activeItinerary && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-3xl border border-[#DCD7CC] shadow-sm p-12 flex flex-col items-center justify-center text-center gap-5 min-h-[450px]"
              >
                <div className="w-20 h-20 rounded-full bg-[#F5F2ED] flex items-center justify-center text-[#7D7667]">
                  <Map className="w-10 h-10 stroke-1" />
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h3 className="font-serif font-bold text-xl text-[#33332D]">No active plan yet</h3>
                  <p className="text-sm text-[#7D7667]">
                    Input a destination like "Kyoto" or "Rome", select duration, and click "Plan my Trip" to build your dynamic itinerary.
                  </p>
                </div>

                {/* Instant Launch Curated Samples */}
                <div className="w-full max-w-xl border-t border-[#DCD7CC]/60 mt-4 pt-6">
                  <span className="text-[10px] font-bold text-[#7D7667] uppercase tracking-wider block mb-4">
                    Or instantly launch a curated sample trip:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {SAMPLE_ITINERARIES.map((sample) => (
                      <button
                        key={sample.id}
                        onClick={() => {
                          setActiveItinerary(sample);
                          setMapCenter({ lat: sample.lat, lng: sample.lng });
                          setActiveDay(1);
                        }}
                        className="bg-[#F5F2ED] hover:bg-[#EAE7E0] border border-[#E5E1D8] hover:border-[#5A5A40]/30 p-3.5 rounded-2xl text-left transition-all group flex flex-col justify-between h-28 cursor-pointer"
                      >
                        <span className="text-[10px] font-bold text-[#D4A373] uppercase tracking-wider">
                          {sample.days.length} Days
                        </span>
                        <div>
                          <h4 className="font-serif font-bold text-sm text-[#33332D] group-hover:text-[#5A5A40] transition-colors leading-tight">
                            {sample.destination.split(",")[0]}
                          </h4>
                          <span className="text-[10px] text-[#7D7667] font-semibold mt-1 block">
                            Explore Now →
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {!isLoading && activeItinerary && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col gap-6"
              >
                {/* Destination & Title Header */}
                <div className="bg-white rounded-3xl border border-[#DCD7CC] shadow-sm p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-[#5A5A40] bg-[#E9EDC9] px-2.5 py-1 rounded-full uppercase tracking-wider">
                          Ready Itinerary
                        </span>
                        <span className="text-xs text-[#7D7667] font-semibold flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {activeItinerary.days.length} Days Plan
                        </span>
                        <span className="text-xs text-[#5A5A40] bg-[#E9EDC9] px-2 py-0.5 rounded-md font-bold flex items-center gap-1 border border-[#CCD5AE]">
                          <Coins className="w-3 h-3 text-[#5A5A40]" />
                          Currency: {activeItinerary.budgetBreakdown?.currencyCode || activeItinerary.currency || selectedCurrency} ({activeItinerary.budgetBreakdown?.currencySymbol || CURRENCY_OPTIONS.find(c => c.code === selectedCurrency)?.symbol || "$"})
                        </span>
                      </div>
                      <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#33332D]">
                        Explore {activeItinerary.destination}
                      </h2>
                      <p className="text-sm text-[#7D7667] leading-relaxed">
                        {activeItinerary.summary}
                      </p>
                    </div>

                    <div className="flex gap-2.5 shrink-0 self-start flex-wrap">
                      {/* Download PDF Button */}
                      <button
                        onClick={handleDownloadPDF}
                        className="inline-flex items-center gap-2 bg-[#D4A373] hover:bg-[#C29262] text-white font-bold px-4 py-2.5 rounded-full text-xs uppercase tracking-tighter hover:shadow-md transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </button>

                      {/* Save Trip Button */}
                      {!activeItinerary.id ? (
                        <button
                          onClick={handleSaveTrip}
                          disabled={saving}
                          className="inline-flex items-center gap-2 bg-white border border-[#DCD7CC] text-[#33332D] font-bold px-4 py-2.5 rounded-full text-xs uppercase tracking-tighter hover:bg-[#F5F2ED] shadow-sm transition-all cursor-pointer"
                        >
                          {saving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Save className="w-3.5 h-3.5" />
                          )}
                          <span>Save to Profile</span>
                        </button>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 bg-[#E9EDC9] text-[#5A5A40] font-bold px-4 py-2.5 rounded-full text-xs border border-[#CCD5AE]">
                          <Check className="w-3.5 h-3.5 text-[#5A5A40]" />
                          <span>Saved</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {saveSuccess && (
                    <div className="mt-4 bg-[#E9EDC9]/60 text-[#5A5A40] border border-[#CCD5AE] px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <span>🎉 Trip saved successfully to your profile. You can load it anytime!</span>
                    </div>
                  )}
                </div>

                {/* Ultra-Realistic Trip Budget Breakdown */}
                <RealisticBudgetCard
                  budget={activeItinerary.budgetBreakdown}
                  destination={activeItinerary.destination}
                  durationDays={activeItinerary.days.length}
                  onApplyToTracker={(b: RealisticBudgetBreakdown) => {
                    const key = `wanderai_budget_${activeItinerary.destination.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`;
                    const totalOther = (b.cabAndTransitTotal || 0) + (b.miscellaneousTotal || 0);
                    localStorage.setItem(
                      key,
                      JSON.stringify({
                        flights: b.estimatedFlightCost || 450,
                        hotelPerNight: b.hotelCostPerNight || 120,
                        foodPerDay: b.foodAndDiningPerDay || 50,
                        activities: b.attractionsAndActivitiesTotal || 150,
                        other: totalOther,
                        budgetLimit: Math.ceil((b.grandTotalEstimated * 1.1) / 50) * 50 || 1500,
                        currency: b.currencyCode || "USD",
                      })
                    );
                    window.dispatchEvent(new Event("storage"));
                  }}
                />

                {/* Hotel Recommendations */}
                <HotelOptionsCard
                  hotels={activeItinerary.hotels}
                  hotelPreference={activeItinerary.hotelPreference || hotelPreference}
                  destination={activeItinerary.destination}
                />

                {/* Weather Forecast & Packing Guide */}
                <WeatherGuideCard
                  weather={activeItinerary.weatherForecast}
                  destination={activeItinerary.destination}
                />

                {/* Cab, Taxi & Transport Guide */}
                <TransportGuideCard
                  transport={activeItinerary.transportation}
                  destination={activeItinerary.destination}
                  currencySymbol={activeItinerary.budgetBreakdown?.currencySymbol}
                  selectedCurrency={selectedCurrency}
                />

                {/* Day Tabs Selection */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {activeItinerary.days.map((dayPlan) => (
                    <button
                      key={dayPlan.dayNumber}
                      onClick={() => setActiveDay(dayPlan.dayNumber)}
                      className={`px-4.5 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all duration-150 cursor-pointer shrink-0 ${
                        activeDay === dayPlan.dayNumber
                          ? "bg-[#5A5A40] text-white border border-[#5A5A40] shadow-sm"
                          : "bg-white text-[#7D7667] hover:bg-[#F5F2ED] border border-[#E5E1D8]"
                      }`}
                    >
                      Day {dayPlan.dayNumber}
                    </button>
                  ))}
                </div>

                {/* Itinerary + Map Section Layout */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column (Day Plan Details) */}
                  <div className="xl:col-span-7 flex flex-col gap-4">
                    
                    {/* Food Tip of the Day */}
                    {activeItinerary.days.find((d) => d.dayNumber === activeDay)?.foodTip && (
                      <div className="bg-[#FAEED1] border border-[#D4A373]/30 rounded-2xl p-4.5 flex items-start gap-3">
                        <div className="bg-[#D4A373] text-white p-2.5 rounded-xl text-base shadow-sm">
                          🍳
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-[#D4A373] text-sm">Local Food Tip (Day {activeDay})</h4>
                          <p className="text-xs text-[#7D7667] leading-relaxed font-semibold">
                            {activeItinerary.days.find((d) => d.dayNumber === activeDay)?.foodTip}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Timeline Activities */}
                    <div className="space-y-4">
                      {["morning", "afternoon", "evening"].map((timeKey) => {
                        const dayPlan = activeItinerary.days.find((d) => d.dayNumber === activeDay) as any;
                        if (!dayPlan || !dayPlan[timeKey]) return null;

                        const activity = dayPlan[timeKey];
                        const iconColor = 
                          timeKey === "morning" ? "text-[#5A5A40] bg-[#E9EDC9]" : 
                          timeKey === "afternoon" ? "text-[#D4A373] bg-[#FAEED1]" : "text-[#7D7667] bg-[#F5F2ED]";
                        
                        const TimeIcon = 
                          timeKey === "morning" ? Sunrise : 
                          timeKey === "afternoon" ? Sun : Moon;

                        return (
                          <div 
                            key={timeKey}
                            className="bg-white rounded-2xl border border-[#DCD7CC] p-5 flex flex-col sm:flex-row gap-4 justify-between shadow-sm hover:shadow-md hover:border-[#D4A373]/30 transition-all duration-200"
                          >
                            <div className="flex gap-4 items-start">
                              <div className={`p-3 rounded-xl shrink-0 ${iconColor}`}>
                                <TimeIcon className="w-5 h-5" />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold tracking-wider uppercase text-[#7D7667] block">
                                  {timeKey} Activity
                                </span>
                                <h4 className="font-serif font-bold text-[#33332D] text-base leading-snug">
                                  {activity.title}
                                </h4>
                                <p className="text-xs font-semibold text-[#7D7667] flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-[#D4A373]" />
                                  {activity.locationName}
                                </p>
                                <p className="text-xs text-[#7D7667]/80 leading-relaxed pt-1.5">
                                  {activity.description}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleShowOnMap(activity.latitude, activity.longitude)}
                              className="self-end sm:self-start bg-[#F5F2ED] hover:bg-[#EAE7E0] text-[#7D7667] hover:text-[#5A5A40] border border-[#E5E1D8] hover:border-[#DCD7CC] p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap mt-2 sm:mt-0"
                            >
                              <Map className="w-3.5 h-3.5" />
                              <span>Show on Map</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>

                  </div>

                  {/* Right Column (Map) */}
                  <div className="xl:col-span-5 sticky top-24 h-[420px] xl:h-[520px]">
                    <TripMap 
                      centerLat={mapCenter.lat} 
                      centerLng={mapCenter.lng} 
                      markers={getMapMarkers()} 
                      activeDay={activeDay}
                    />
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </section>
      </main>

      {/* Profile Saved Trips Sidebar Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black z-[2000]"
            />

            {/* Content Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-sm bg-[#F5F2ED] shadow-2xl z-[2001] flex flex-col"
            >
              <div className="p-5 border-b border-[#DCD7CC] flex items-center justify-between bg-white/50">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-[#5A5A40]" />
                  <h3 className="font-serif font-bold text-[#33332D] text-base">Saved Itineraries</h3>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-[#EAE7E0] text-[#7D7667] hover:text-[#33332D] transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Saved Trips List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {savedTrips.length === 0 ? (
                  <div className="text-center py-12 text-[#7D7667] space-y-2">
                    <div className="text-4xl">🧳</div>
                    <p className="font-semibold text-sm">No saved trips yet</p>
                    <p className="text-xs">Your generated trips will show up here after saving them to your profile.</p>
                  </div>
                ) : (
                  savedTrips.map((trip, idx) => (
                    <div
                      key={trip.id || `trip-${idx}`}
                      onClick={() => handleLoadSavedTrip(trip)}
                      className="group relative bg-white hover:bg-[#F9F8F6] border border-[#DCD7CC] hover:border-[#5A5A40]/40 hover:shadow-md p-4 rounded-2xl cursor-pointer transition-all duration-200"
                    >
                      <div className="pr-6 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-[#D4A373] uppercase tracking-wider">
                            <Calendar className="w-3 h-3" />
                            {trip.duration || trip.days?.length || 3} Day Trip
                          </div>
                          <span className="text-[10px] font-mono font-bold text-[#5A5A40] bg-[#E9EDC9]/60 px-2 py-0.5 rounded border border-[#CCD5AE]/40">
                            Currency: {trip.currency || trip.currencyCode || "USD"}
                          </span>
                        </div>
                        <h4 className="font-serif font-bold text-[#33332D] text-sm group-hover:text-[#5A5A40] transition-colors">
                          {trip.destination}
                        </h4>
                        <p className="text-xs text-[#7D7667] line-clamp-2">
                          {trip.summary || `Saved custom itinerary for ${trip.destination}. Click to load and view the full details.`}
                        </p>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={(e) => handleDeleteTrip(trip.id!, e)}
                        className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-[#FAEED1] text-[#7D7667] hover:text-[#D4A373] transition-all opacity-100 md:opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Delete itinerary"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Drawer footer */}
              <div className="p-4 border-t border-[#DCD7CC] bg-[#EAE7E0] text-center text-[11px] text-[#7D7667]">
                User Identity Token: <span className="font-mono font-bold text-[#5A5A40] select-all">{userId?.substring(0, 10)}...</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-[#DCD7CC] bg-white/40 py-6 mt-12 text-center text-xs text-[#7D7667]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 WanderAI trip planner. Powered by Google Gemini-2.5-flash.</p>
          <div className="flex items-center gap-4 font-semibold text-[#7D7667]">
            <span className="hover:text-[#33332D] transition-all cursor-default">Privacy</span>
            <span>•</span>
            <span className="hover:text-[#33332D] transition-all cursor-default">Terms</span>
          </div>
        </div>
      </footer>

      {/* Floating Travel Companion Chatbot */}
      <ChatBot activeItinerary={activeItinerary} />

      {/* Sign In / Auth Modal */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-[2050] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute inset-0 bg-black"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white rounded-3xl border border-[#DCD7CC] shadow-2xl overflow-hidden z-10 flex flex-col"
            >
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 text-[#7D7667] hover:text-[#33332D] transition-all cursor-pointer z-20"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-6 sm:p-8 border-b border-[#DCD7CC]/60 bg-[#FAEED1]/25 text-center flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-[#5A5A40] rounded-2xl flex items-center justify-center text-white shadow-sm">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-serif font-bold text-2xl text-[#33332D]">
                    {isRegisterMode ? "Create Your Account" : "Sign In to WanderAI"}
                  </h2>
                  <p className="text-xs text-[#7D7667] mt-1 max-w-xs mx-auto font-medium leading-relaxed">
                    {isRegisterMode 
                      ? "Join WanderAI to save trips, track budgets across devices, and sync itineraries."
                      : "Sign in to access your saved trips and synchronized travel itineraries."}
                  </p>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-5">
                {authError && (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded-xl text-xs font-semibold leading-relaxed flex items-start gap-2">
                    <span className="text-sm">⚠️</span>
                    <div>{authError}</div>
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#7D7667] uppercase tracking-wider block">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D7667] w-4 h-4" />
                      <input
                        type="email"
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="traveler@wanderai.com"
                        className="w-full pl-11 pr-4 py-3 bg-[#F9F8F6] border border-[#E5E1D8] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4A373]/30 focus:border-[#D4A373] text-sm placeholder-[#7D7667]/50 transition-all font-medium text-[#33332D]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#7D7667] uppercase tracking-wider block">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D7667] w-4 h-4" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-11 pr-4 py-3 bg-[#F9F8F6] border border-[#E5E1D8] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4A373]/30 focus:border-[#D4A373] text-sm placeholder-[#7D7667]/50 transition-all font-medium text-[#33332D]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-[#5A5A40] hover:bg-[#4A4A33] text-white font-bold py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-75 cursor-pointer text-sm tracking-wide"
                  >
                    {authLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isRegisterMode ? (
                      "Create Free Account"
                    ) : (
                      "Sign In to WanderAI"
                    )}
                  </button>
                </form>

                <div className="space-y-2.5 pt-3 border-t border-[#DCD7CC]/60">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={authLoading}
                    className="w-full bg-white hover:bg-[#F9F8F6] text-[#33332D] font-bold py-2.5 px-4 rounded-xl border border-[#DCD7CC] shadow-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer text-sm"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Sign in with Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGuestContinue}
                    disabled={authLoading}
                    className="w-full bg-[#F5F2ED] hover:bg-[#EAE7E0] text-[#5A5A40] font-bold py-2.5 px-4 rounded-xl border border-[#E5E1D8] flex items-center justify-center gap-2 transition-all cursor-pointer text-sm"
                  >
                    <User className="w-4 h-4 shrink-0" />
                    <span>Continue as Guest</span>
                  </button>
                </div>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterMode(!isRegisterMode);
                      setAuthError(null);
                    }}
                    className="text-xs text-[#D4A373] hover:text-[#C29262] font-bold underline transition-colors cursor-pointer"
                  >
                    {isRegisterMode ? "Already have an account? Sign In" : "New to WanderAI? Create a free account"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
