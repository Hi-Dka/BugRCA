export interface HttpClientConfig {
  baseUrl: string;
  timeout?: number;
  getToken?: () => string | undefined;
}

export interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined | null>;
  data?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
  auth?: boolean;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type Response<T extends object = Record<string, unknown>> = {
  status: string;
} & T;
