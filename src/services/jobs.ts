"use client";

import { useQuery, useMutation, keepPreviousData } from "@tanstack/react-query";
import { apiRequest, ApiError } from "@/services/http/api-client";

// --- Types ---
export interface Job {
  id: number;
  description: string | null;
  category: string | null;
  location: string;
  paymentStatus: string;
  status: string;
  cost: string;
  jobPhoto: string;
  jobPhotoDone: string | null;
  createdAt: string;
  postedBy: {
    name: string | null;
    mobile: string;
    image: string | null;
  };
}

// Request Object for Completion
export interface CompleteJobRequest {
  jobId: number;
  mobile: string; // Logged-in user's mobile
  file: File; // The photo proof
}

export interface CreateJobRequest {
  description: string;
  location: string; // Maps to 'address'
  cost: string;
  mobile: string; // User's mobile from session
  image: File;
}

// --- API Functions ---

export type JobHistoryResponse = Job[];
const getJobHistory = async (mobile: string): Promise<JobHistoryResponse> => {
  return apiRequest<JobHistoryResponse>({
    method: "get",
    // Pass mobile as a query parameter
    url: `/api/jobs/collector-list?mobile=${encodeURIComponent(mobile)}`,
  });
};

const getActiveJobs = async (): Promise<Job[]> => {
  return apiRequest<Job[]>({
    method: "get",
    url: "/api/jobs/open",
  });
};

const completeJob = async ({ jobId, mobile, file }: CompleteJobRequest) => {
  const formData = new FormData();
  formData.append("job_id", jobId.toString());
  formData.append("mobile", mobile);
  formData.append("proof", file); // Field name specified as "proof"

  return apiRequest({
    url: "/api/jobs/complete", // The route you specified
    method: "POST",
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// --- Hooks ---

export function useActiveJobsQuery() {
  return useQuery({
    queryKey: ["activeJobs"],
    queryFn: getActiveJobs,
    placeholderData: keepPreviousData,
  });
}

export function useCompleteJob(
  onSuccess?: () => void,
  onError?: (error: ApiError) => void,
) {
  return useMutation<any, ApiError, CompleteJobRequest>({
    mutationFn: completeJob,
    onSuccess,
    onError,
  });
}

export function useJobHistoryQuery(mobile?: string) {
  return useQuery({
    queryKey: ["jobHistory", mobile], // Include mobile in cache key
    queryFn: () => getJobHistory(mobile!), // The '!' asserts mobile is defined (safeguarded by 'enabled' below)
    enabled: !!mobile, // CRITICAL: Don't run the fetch until 'mobile' is available from the session
    placeholderData: keepPreviousData,
  });
}

const createJob = async ({
  description,
  location,
  cost,
  mobile,
  image,
}: CreateJobRequest) => {
  const formData = new FormData();
  formData.append("description", description);
  formData.append("address", location);
  formData.append("cost", cost);
  formData.append("mobile", mobile);
  formData.append("image", image); // Field name must match backend (e.g., "image" or "file")

  return apiRequest({
    url: "/api/jobs/create", // Adjust to your actual endpoint
    method: "POST",
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
  });
};

//  Hook ---
export function useCreateJob(
  onSuccess?: () => void,
  onError?: (error: ApiError) => void,
) {
  return useMutation<any, ApiError, CreateJobRequest>({
    mutationFn: createJob,
    onSuccess,
    onError,
  });
}

const getVisitorJobs = async (mobile: string): Promise<Job[]> => {
  return apiRequest<Job[]>({
    method: "get",
    url: `/api/jobs/list?mobile=${encodeURIComponent(mobile)}`,
  });
};

// 2. Delete Job
const deleteJob = async (jobId: number) => {
  return apiRequest({
    method: "delete",
    url: `/api/jobs/${jobId}`,
  });
};
export function useVisitorJobsQuery(mobile?: string) {
  return useQuery({
    queryKey: ["visitorJobs", mobile],
    queryFn: () => getVisitorJobs(mobile!),
    enabled: !!mobile,
    placeholderData: keepPreviousData,
  });
}

export function useDeleteJob(onSuccess?: () => void) {
  return useMutation({
    mutationFn: deleteJob,
    onSuccess,
    onError: (error: ApiError) => console.error("Delete failed", error),
  });
}
