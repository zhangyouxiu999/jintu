export * from "@/lib/schemas/auth";

// Add other shared types here
export type ApiResponse<T = any> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: any;
};
