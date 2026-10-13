import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "";

const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined" && config.url?.includes("api/admin")) {
    const adminToken = localStorage.getItem("admin_token");
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
  }
  return config;
});

export const get = async <T>(url: string, config?: AxiosRequestConfig) =>
  apiClient.get<T>(url, config);

export const post = async <T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
) => apiClient.post<T>(url, data, config);

export const put = async <T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
) => apiClient.put<T>(url, data, config);

export const del = async <T>(url: string, config?: AxiosRequestConfig) =>
  apiClient.delete<T>(url, config);

export const patch = async <T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
) => apiClient.patch<T>(url, data, config);

export default apiClient;
