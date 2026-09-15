export type Role = "OWNER" | "ADMIN";
export type AccountType = "LOCAL" | "FOREIGNER";
export type CarType =
  | "SEDAN"
  | "SUV"
  | "VAN"
  | "TUK"
  | "MINIVAN"
  | "JEEP"
  | "BUS"
  | "OTHER";
export type Transmission = "MANUAL" | "AUTOMATIC";
export type FuelType = "PETROL" | "DIESEL" | "HYBRID" | "ELECTRIC" | "LPG" | "CNG";
export type CarStatus = "DRAFT" | "ACTIVE" | "HIDDEN";
export type BookingStatus = "PENDING" | "CONFIRMED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
export type PaymentStatus = "NONE" | "PENDING" | "PAID" | "REFUNDED";
export type IdType = "NIC" | "PASSPORT";

export interface User {
  id: number;
  email: string;
  fullName: string;
  businessName: string | null;
  phone: string;
  role: Role;
  accountType: AccountType;
  nic: string | null;
  passportNo: string | null;
  nationality: string | null;
  avatarUrl: string | null;
  enabled: boolean;
}

export interface AdminStats {
  totalUsers: number;
  totalOwners: number;
  totalCars: number;
  activeCars: number;
  hiddenCars: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
}

export interface AdminReview {
  id: number;
  bookingId: number;
  carId: number;
  carMake: string;
  carModel: string;
  reviewerName: string | null;
  rating: number;
  comment: string | null;
  createdAt: string | null;
}

export interface CarList {
  id: number;
  ownerId: number;
  ownerName: string;
  make: string;
  model: string;
  year: number;
  type: CarType;
  transmission: Transmission;
  seats: number;
  fuel: FuelType;
  dailyPrice: number;
  withDriver: boolean;
  driverDailyPrice: number | null;
  city: string;
  lat: number | null;
  lng: number | null;
  status: CarStatus;
  imageUrls: string[];
  averageRating: number | null;
  ratingCount: number;
}

export interface Car extends CarList {
  description: string | null;
  imageIds: number[];
}

export interface Booking {
  id: number;
  carId: number;
  carMake: string;
  carModel: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestIdType: IdType;
  guestIdNumber: string;
  startDate: string;
  endDate: string;
  withDriver: boolean;
  pickupLocation: string | null;
  totalPrice: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  createdAt: string | null;
}

export interface Review {
  id: number;
  bookingId: number;
  carId: number;
  reviewerName: string;
  rating: number;
  comment: string | null;
  createdAt: string | null;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  user: User;
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  businessName: string;
  phone: string;
  accountType: AccountType;
  nic?: string;
  passportNo?: string;
  nationality?: string;
}

export interface CarInput {
  make: string;
  model: string;
  year: number;
  type: CarType;
  transmission: Transmission;
  seats: number;
  fuel: FuelType;
  dailyPrice: number;
  withDriver: boolean;
  driverDailyPrice?: number;
  city: string;
  lat?: number;
  lng?: number;
  description?: string;
  status?: CarStatus;
}

export interface BookingInput {
  carId: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestIdType: IdType;
  guestIdNumber: string;
  startDate: string;
  endDate: string;
  withDriver: boolean;
  pickupLocation?: string;
}

export interface ReviewInput {
  bookingId: number;
  rating: number;
  comment?: string;
}

export interface CarFilters {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  type?: CarType;
  seats?: number;
  transmission?: Transmission;
  withDriver?: boolean;
}

export interface ApiErrorJson {
  status: number;
  message: string;
  timestamp?: string;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export const CITIES = [
  "Colombo",
  "Kandy",
  "Galle",
  "Negombo",
  "Bentota",
  "Ella",
  "Sigiriya",
  "Mirissa",
  "Jaffna",
  "Trincomalee",
];

export const CAR_TYPES: CarType[] = ["SEDAN", "SUV", "VAN", "TUK", "MINIVAN", "JEEP", "BUS", "OTHER"];

export const FUEL_TYPES: FuelType[] = ["PETROL", "DIESEL", "HYBRID", "ELECTRIC", "LPG", "CNG"];