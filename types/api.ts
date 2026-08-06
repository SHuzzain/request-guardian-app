export type ApiResponse<T> = {
  data: T;
  message?: string;
  error?: string;
};

export type ApiRequestPageParams = {
  page: string;
  limit?: string;
};
