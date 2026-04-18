export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  fullName: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}