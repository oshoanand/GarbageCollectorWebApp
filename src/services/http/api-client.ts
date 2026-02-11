import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { getSession } from "next-auth/react";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const session = await getSession();
      const token = session?.accessToken;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
);

export class ApiError<T = unknown> extends Error {
  constructor(
    public message: string,
    public status?: number,
    public data?: T,
    public validationErrors?: Record<string, string>,
  ) {
    super(message);
  }
}

export const apiRequest = async <T, D = unknown>(
  config: AxiosRequestConfig<D>,
): Promise<T> => {
  try {
    const response = await apiClient(config);
    // console.log(response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const validationErrors = error.response?.data?.errors?.reduce(
        (
          acc: Record<string, string>,
          err: { path: string; message: string },
        ) => {
          acc[err.path] = err.message;
          return acc;
        },
        {},
      );
      throw new ApiError(
        error.response?.data?.message || error.message,
        error.response?.status,
        error.response?.data,
        validationErrors,
      );
    }
    throw new ApiError("Unknown error occurred");
  }
};
