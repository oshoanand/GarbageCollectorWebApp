import { useMutation } from "@tanstack/react-query";
import { apiRequest, ApiError } from "@/services/http/api-client";

// --- Existing Types ---
export enum UserRole {
  VISITOR = "VISITOR",
  COLLECTOR = "COLLECTOR",
}

export interface RegisterRequest {
  name: string;
  mobile: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface RegisterResponse {
  id: string;
  token: string;
}

export interface UpdateProfileNameRequest {
  name: string;
  mobile: string;
}

export interface UpdateProfileNameResponse {
  message: string;
  name: string;
}

export interface UpdateProfileImageRequest {
  file: File;
  mobile: string;
}
export interface UpdateProfileImageResponse {
  message: string;
  imageUrl?: string;
}

// --- API Functions ---

const registerUser = async (
  data: RegisterRequest,
): Promise<RegisterResponse> => {
  return apiRequest<RegisterResponse, RegisterRequest>({
    url: "/auth/register",
    method: "POST",
    data,
  });
};
const updateProfileImage = async ({
  file,
  mobile,
}: UpdateProfileImageRequest): Promise<UpdateProfileImageResponse> => {
  const formData = new FormData();
  formData.append("profile_image", file);
  formData.append("mobile", mobile);
  return apiRequest<UpdateProfileImageResponse, FormData>({
    url: "/api/user/update-profile-image",
    method: "PUT",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

const updateProfileName = async (
  data: UpdateProfileNameRequest,
): Promise<UpdateProfileNameResponse> => {
  return apiRequest<UpdateProfileNameResponse, UpdateProfileNameRequest>({
    url: "/api/user/update-profile",
    method: "PUT",
    data,
    // No specific Content-Type header needed; axios defaults to application/json
  });
};

// NEW: Use Update Profile Name Hook
export const useUpdateProfileName = (
  onSuccess?: (data: UpdateProfileNameResponse) => void,
  onError?: (error: ApiError) => void,
) => {
  return useMutation<
    UpdateProfileNameResponse,
    ApiError,
    UpdateProfileNameRequest
  >({
    mutationFn: updateProfileName,
    onSuccess,
    onError,
  });
};

// --- React Query Hooks ---

export const useRegister = (onSuccess: (data: RegisterResponse) => void) => {
  return useMutation<RegisterResponse, ApiError, RegisterRequest>({
    mutationFn: registerUser,
    onSuccess: (data) => {
      onSuccess(data);
    },
    onError: (error) => {
      console.error("Registration failed:", error.message);
    },
  });
};

export const useUpdateProfileImage = (
  onSuccess?: (data: UpdateProfileImageResponse) => void,
  onError?: (error: ApiError) => void,
) => {
  // Generics: <Response, Error, RequestType>
  return useMutation<
    UpdateProfileImageResponse,
    ApiError,
    UpdateProfileImageRequest
  >({
    mutationFn: updateProfileImage,
    onSuccess,
    onError,
  });
};
