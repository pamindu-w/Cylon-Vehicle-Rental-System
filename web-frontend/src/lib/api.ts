import {
  ApiError,
  type AdminReview,
  type AdminStats,
  type ApiErrorJson,
  type AuthResponse,
  type Booking,
  type BookingInput,
  type BookingStatus,
  type Car,
  type CarFilters,
  type CarInput,
  type CarList,
  type CarStatus,
  type RegisterInput,
  type Review,
  type ReviewInput,
  type User,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export const baseUrl = API_URL;

export function imageUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_URL}${url}`;
}

function toQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}

async function request<T>(
  path: string,
  init?: {
    method?: string;
    token?: string;
    body?: unknown;
    formData?: FormData;
  },
): Promise<T> {
  const headers: Record<string, string> = {};
  if (init?.token) headers.Authorization = `Bearer ${init.token}`;

  const options: RequestInit = { method: init?.method ?? "GET" };
  if (init?.body !== undefined) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(init.body);
  }
  if (init?.formData) {
    options.body = init.formData;
  }
  options.headers = headers;

  const res = await fetch(`${API_URL}${path}`, options);
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = (await res.json()) as ApiErrorJson;
      if (data?.message) message = data.message;
    } catch {
      // non-JSON error body; keep default message
    }
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const authApi = {
  register(input: RegisterInput): Promise<AuthResponse> {
    return request<AuthResponse>("/api/auth/register", { method: "POST", body: input });
  },
  login(email: string, password: string): Promise<AuthResponse> {
    return request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });
  },
  me(token: string): Promise<User> {
    return request<User>("/api/auth/me", { token });
  },
};

export const carsApi = {
  list(filters: CarFilters): Promise<CarList[]> {
    return request<CarList[]>(`/api/cars${toQuery(filters as Record<string, unknown>)}`);
  },
  get(id: number): Promise<Car> {
    return request<Car>(`/api/cars/${id}`);
  },
  mine(token: string): Promise<CarList[]> {
    return request<CarList[]>("/api/cars/mine", { token });
  },
  getForOwner(token: string, id: number): Promise<Car> {
    return request<Car>(`/api/cars/${id}/owner`, { token });
  },
  create(token: string, input: CarInput): Promise<Car> {
    return request<Car>("/api/cars", { method: "POST", token, body: input });
  },
  update(token: string, id: number, input: CarInput): Promise<Car> {
    return request<Car>(`/api/cars/${id}`, { method: "PUT", token, body: input });
  },
  setStatus(token: string, id: number, status: CarStatus): Promise<Car> {
    return request<Car>(`/api/cars/${id}/status?status=${status}`, { method: "PATCH", token });
  },
  uploadImages(token: string, id: number, files: File[]): Promise<Car> {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return request<Car>(`/api/cars/${id}/images`, { method: "POST", token, formData });
  },
  deleteImage(token: string, carId: number, imageId: number): Promise<unknown> {
    return request<unknown>(`/api/cars/${carId}/images/${imageId}`, { method: "DELETE", token });
  },
};

export const bookingsApi = {
  create(input: BookingInput): Promise<Booking> {
    return request<Booking>("/api/bookings", { method: "POST", body: input });
  },
  mine(token: string): Promise<Booking[]> {
    return request<Booking[]>("/api/bookings", { token });
  },
  get(token: string, id: number): Promise<Booking> {
    return request<Booking>(`/api/bookings/${id}`, { token });
  },
  setStatus(token: string, id: number, status: BookingStatus): Promise<Booking> {
    return request<Booking>(`/api/bookings/${id}/status?status=${status}`, {
      method: "PATCH",
      token,
    });
  },
};

export const reviewsApi = {
  create(input: ReviewInput): Promise<Review> {
    return request<Review>("/api/reviews", { method: "POST", body: input });
  },
  byCar(carId: number): Promise<Review[]> {
    return request<Review[]>(`/api/reviews/car/${carId}`);
  },
};

export const adminApi = {
  stats(token: string): Promise<AdminStats> {
    return request<AdminStats>("/api/admin/stats", { token });
  },
  users(token: string): Promise<User[]> {
    return request<User[]>("/api/admin/users", { token });
  },
  setUserEnabled(token: string, id: number, enabled: boolean): Promise<User> {
    return request<User>(`/api/admin/users/${id}/enabled?enabled=${enabled}`, {
      method: "PATCH",
      token,
    });
  },
  cars(token: string): Promise<CarList[]> {
    return request<CarList[]>("/api/admin/cars", { token });
  },
  setCarStatus(token: string, id: number, status: CarStatus): Promise<Car> {
    return request<Car>(`/api/admin/cars/${id}/status?status=${status}`, {
      method: "PATCH",
      token,
    });
  },
  deleteCar(token: string, id: number): Promise<unknown> {
    return request<unknown>(`/api/admin/cars/${id}`, { method: "DELETE", token });
  },
  bookings(token: string): Promise<Booking[]> {
    return request<Booking[]>("/api/admin/bookings", { token });
  },
  setBookingStatus(token: string, id: number, status: BookingStatus): Promise<Booking> {
    return request<Booking>(`/api/admin/bookings/${id}/status?status=${status}`, {
      method: "PATCH",
      token,
    });
  },
  reviews(token: string): Promise<AdminReview[]> {
    return request<AdminReview[]>("/api/admin/reviews", { token });
  },
  deleteReview(token: string, id: number): Promise<unknown> {
    return request<unknown>(`/api/admin/reviews/${id}`, { method: "DELETE", token });
  },
};