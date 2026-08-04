import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc, 
  deleteDoc 
} from "firebase/firestore";

// Config parsed from the automatically created file
import config from "../firebase-applet-config.json";

const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || config.apiKey,
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || config.authDomain,
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || config.projectId,
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || config.storageBucket,
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || config.messagingSenderId,
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || config.appId
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use custom database ID if configured (e.g. named Firestore databases in AI Studio)
const databaseId = (import.meta as any).env?.VITE_FIREBASE_DATABASE_ID || (config as any).firestoreDatabaseId || (config as any).databaseId;
export const db = databaseId && databaseId !== "(default)" ? getFirestore(app, databaseId) : getFirestore(app);

// Simple anonymous sign-in to establish user identity
export async function authenticateUser(): Promise<{ uid: string; isFallback?: boolean }> {
  try {
    if (auth.currentUser) {
      return { uid: auth.currentUser.uid };
    }
    const credential = await signInAnonymously(auth);
    return { uid: credential.user.uid };
  } catch (error) {
    console.warn("Firebase Auth error (e.g. anonymous signup disabled), falling back to local storage identity:", error);
    // Retrieve or generate a local guest ID
    let localId = localStorage.getItem("wanderai_local_user_id");
    if (!localId) {
      localId = "guest_" + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("wanderai_local_user_id", localId);
    }
    return { uid: localId, isFallback: true };
  }
}

// Sign in with Google Popup
export async function loginWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  return credential.user;
}

// Continue as guest
export async function continueAsGuest(): Promise<{ uid: string }> {
  const authRes = await authenticateUser();
  return { uid: authRes.uid };
}

// Register a new user with Email and Password
export async function registerWithEmailPassword(email: string, password: string): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  return credential.user;
}

// Sign in user with Email and Password
export async function loginWithEmailPassword(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

// Sign out user
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// Send Password Reset Email
export async function resetPasswordEmail(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export interface HotelOption {
  name: string;
  category: string;
  estimatedPricePerNight: number;
  currencySymbol: string;
  locationArea: string;
  highlights: string;
  bookingTip: string;
}

export interface WeatherForecast {
  temperatureRange: string;
  condition: string;
  rainChance: string;
  bestTimeToVisit: string;
  packingTips: string[];
}

export interface TransportationGuide {
  preferredMode: string;
  estimatedDailyCabCost: number;
  popularApps: string[];
  cabFareTips: string;
  avgTravelTimePerSpot: string;
}

export interface RealisticBudgetBreakdown {
  currencyCode: string;
  currencySymbol: string;
  estimatedFlightCost: number;
  hotelCostPerNight: number;
  hotelCostTotal: number;
  foodAndDiningPerDay: number;
  foodAndDiningTotal: number;
  cabAndTransitPerDay: number;
  cabAndTransitTotal: number;
  attractionsAndActivitiesTotal: number;
  miscellaneousTotal: number;
  grandTotalEstimated: number;
  budgetLevel: string;
  moneySavingTip: string;
}

export interface SavedItinerary {
  id?: string;
  userId: string;
  createdAt: number;
  destination: string;
  duration?: number;
  currency?: string;
  lat?: number;
  lng?: number;
  summary?: string;
  hotelPreference?: string;
  transportPreference?: string;
  hotels?: HotelOption[];
  weatherForecast?: WeatherForecast;
  transportation?: TransportationGuide;
  budgetBreakdown?: RealisticBudgetBreakdown;
  days?: Array<{
    dayNumber: number;
    foodTip: string;
    morning: {
      title: string;
      description: string;
      locationName: string;
      latitude: number;
      longitude: number;
    };
    afternoon: {
      title: string;
      description: string;
      locationName: string;
      latitude: number;
      longitude: number;
    };
    evening: {
      title: string;
      description: string;
      locationName: string;
      latitude: number;
      longitude: number;
    };
  }>;
  totalBudget?: number;
  budgetLimit?: number;
  currencyCode?: string;
  currencySymbol?: string;
  packingChecklist?: any[];
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Local storage helper functions
function getLocalItineraries(): SavedItinerary[] {
  const data = localStorage.getItem("wanderai_local_itineraries");
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function saveLocalItineraries(itineraries: SavedItinerary[]) {
  localStorage.setItem("wanderai_local_itineraries", JSON.stringify(itineraries));
}

// Helper to check if we should fall back to local storage
function isGuestId(userId: string): boolean {
  return userId.startsWith("guest_") || !auth.currentUser;
}

// Helper to recursively strip out any undefined properties from an object so Firestore doesn't reject it
function cleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined) as any;
  }
  if (typeof obj === "object") {
    const cleaned: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (val !== undefined) {
          cleaned[key] = cleanUndefined(val);
        }
      }
    }
    return cleaned;
  }
  return obj;
}

// Save an itinerary
export async function saveItinerary(userId: string, itinerary: Omit<SavedItinerary, "userId" | "createdAt">): Promise<string> {
  const duration = itinerary.duration || itinerary.days?.length || 3;
  const currency = itinerary.currency || itinerary.currencyCode || "USD";
  const destination = itinerary.destination;

  if (isGuestId(userId)) {
    const localItineraries = getLocalItineraries();
    const newId = "local_" + Math.random().toString(36).substring(2, 15);
    const savedItem: SavedItinerary = {
      ...itinerary,
      id: newId,
      userId,
      createdAt: Date.now(),
      duration,
      currency
    };
    localItineraries.push(savedItem);
    saveLocalItineraries(localItineraries);
    return newId;
  }

  const path = `users/${userId}/itineraries`;
  try {
    const docData = cleanUndefined({
      ...itinerary,
      userId,
      createdAt: Date.now(),
      destination,
      duration,
      currency
    });
    const docRef = await addDoc(collection(db, "users", userId, "itineraries"), docData);
    return docRef.id;
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.CREATE, path);
    } catch (e) {
      // Caught the thrown FirestoreErrorInfo to proceed with local fallback
    }
    console.warn("Firestore save failed, falling back to local storage:", err);
    const localItineraries = getLocalItineraries();
    const newId = "local_" + Math.random().toString(36).substring(2, 15);
    const savedItem: SavedItinerary = {
      ...itinerary,
      id: newId,
      userId,
      createdAt: Date.now(),
      duration,
      currency
    };
    localItineraries.push(savedItem);
    saveLocalItineraries(localItineraries);
    return newId;
  }
}

// Get user's saved itineraries
export async function getSavedItineraries(userId: string): Promise<SavedItinerary[]> {
  if (isGuestId(userId)) {
    return getLocalItineraries().filter(it => it.userId === userId).sort((a, b) => b.createdAt - a.createdAt);
  }

  // 1. Check and automatically migrate any guest/local itineraries to their Firestore account
  try {
    const localItineraries = getLocalItineraries();
    if (localItineraries.length > 0) {
      for (const localIt of localItineraries) {
        const duration = localIt.duration || localIt.days?.length || 3;
        const currency = localIt.currency || localIt.currencyCode || "USD";
        const { id, ...cleanLocalIt } = localIt;
        await addDoc(collection(db, "users", userId, "itineraries"), {
          ...cleanLocalIt,
          userId,
          createdAt: localIt.createdAt || Date.now(),
          duration,
          currency
        });
      }
      localStorage.removeItem("wanderai_local_itineraries");
      console.log("Successfully migrated local guest itineraries to authenticated Firestore profile.");
    }
  } catch (err) {
    console.error("Failed to migrate local itineraries to Firestore:", err);
  }

  // 2. Check and automatically migrate any legacy root itineraries to their new subcollection
  try {
    const legacyQuery = query(
      collection(db, "itineraries"),
      where("userId", "==", userId)
    );
    const legacySnapshot = await getDocs(legacyQuery);
    if (!legacySnapshot.empty) {
      for (const legacyDoc of legacySnapshot.docs) {
        const legacyData = legacyDoc.data();
        const duration = legacyData.duration || legacyData.days?.length || 3;
        const currency = legacyData.currency || legacyData.currencyCode || "USD";
        
        await addDoc(collection(db, "users", userId, "itineraries"), {
          ...legacyData,
          userId,
          createdAt: legacyData.createdAt || Date.now(),
          duration,
          currency
        });
        
        await deleteDoc(doc(db, "itineraries", legacyDoc.id));
        console.log(`Successfully migrated legacy itinerary ${legacyDoc.id} to user subcollection`);
      }
    }
  } catch (err) {
    console.warn("Legacy itineraries query or migration failed (likely permission or already done):", err);
  }

  const path = `users/${userId}/itineraries`;
  try {
    const q = collection(db, "users", userId, "itineraries");
    const snapshot = await getDocs(q);
    const results: SavedItinerary[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      results.push({
        id: doc.id,
        userId: data.userId,
        createdAt: data.createdAt,
        destination: data.destination,
        duration: Number(data.duration) || Number(data.days?.length) || 3,
        currency: data.currency || data.currencyCode || "USD",
        lat: data.lat,
        lng: data.lng,
        summary: data.summary,
        days: data.days,
        totalBudget: data.totalBudget,
        budgetLimit: data.budgetLimit,
        currencyCode: data.currencyCode,
        currencySymbol: data.currencySymbol,
        hotels: data.hotels,
        weatherForecast: data.weatherForecast,
        transportation: data.transportation,
        budgetBreakdown: data.budgetBreakdown,
        packingChecklist: data.packingChecklist,
        hotelPreference: data.hotelPreference,
        transportPreference: data.transportPreference
      } as SavedItinerary);
    });
    return results.sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.LIST, path);
    } catch (e) {
      // Caught the thrown FirestoreErrorInfo to proceed with local fallback
    }
    console.warn("Firestore load failed, returning local storage itineraries:", err);
    return getLocalItineraries().filter(it => it.userId === userId).sort((a, b) => b.createdAt - a.createdAt);
  }
}

// Delete a saved itinerary
export async function deleteSavedItinerary(userId: string, id: string): Promise<void> {
  if (id.startsWith("local_")) {
    const localItineraries = getLocalItineraries();
    const updated = localItineraries.filter(it => it.id !== id);
    saveLocalItineraries(updated);
    return;
  }

  const path = `users/${userId}/itineraries/${id}`;
  try {
    await deleteDoc(doc(db, "users", userId, "itineraries", id));
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.DELETE, path);
    } catch (e) {
      // Caught the thrown FirestoreErrorInfo to proceed with local fallback
    }
    console.warn("Firestore delete failed, removing from local storage if present:", err);
    const localItineraries = getLocalItineraries();
    const updated = localItineraries.filter(it => it.id !== id);
    saveLocalItineraries(updated);
  }
}
