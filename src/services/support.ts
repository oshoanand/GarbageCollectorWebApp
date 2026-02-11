// src/services/support.ts
import { useMutation } from "@tanstack/react-query";
import { apiRequest, ApiError } from "@/services/http/api-client";

export interface CreateSupportTicketRequest {
  mobile: string;
  support_type: string; // "BUG", "FEATURE", "OTHER"
  description: string;
  proof?: File | null;
}

const createSupportTicket = async ({
  mobile,
  support_type,
  description,
  proof,
}: CreateSupportTicketRequest) => {
  const formData = new FormData();
  formData.append("mobile", mobile);
  formData.append("support_type", support_type);
  formData.append("description", description);

  if (proof) {
    formData.append("proof", proof);
  }

  return apiRequest({
    url: "/api/support/create",
    method: "POST",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const useCreateSupportTicket = (
  onSuccess?: () => void,
  onError?: (error: ApiError) => void,
) => {
  return useMutation({
    mutationFn: createSupportTicket,
    onSuccess,
    onError,
  });
};
