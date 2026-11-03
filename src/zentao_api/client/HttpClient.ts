import { type RequestOptions, type HttpMethod, type HttpClientConfig } from '../types/HttpTypes';
import { logger } from '../../utils/logger';
import { ZenTaoError } from '../errors/ZenTaoError';

const log = logger.tag('HttpClient');

const DefaultTimeout = 15000;

export class HttpClient {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly getToken: (() => string | undefined) | undefined;

  constructor(config: HttpClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.timeout = config.timeout ?? DefaultTimeout;
    this.getToken = config.getToken;

    if (!this.baseUrl) {
      throw new ZenTaoError('baseUrl is required');
    }
    if (this.timeout <= 0) {
      throw new ZenTaoError('timeout must be greater than 0');
    }

    log.info('HttpClient initialized');
  }

  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, options);
  }

  async post<T>(path: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, { ...options, data });
  }

  private async request<T>(method: HttpMethod, path: string, options?: RequestOptions): Promise<T> {
    const url = new URL(`${this.baseUrl}/${path.replace(/^\/+/, '')}`);

    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const headers = new Headers(options?.headers ?? {});
    headers.set('Accept', 'application/json');

    if (options?.auth !== false) {
      const token = this.getToken?.();
      if (token) {
        headers.set('Token', token);
      }
    }

    let body: BodyInit | undefined;
    if (options?.data !== undefined) {
      headers.set('Content-Type', 'application/json');
      body = JSON.stringify(options.data);
      log.info(`Request body: ${body}`);
    }

    const controller = new AbortController();

    const timeout = setTimeout(() => controller.abort(), options?.timeout ?? this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        signal: controller.signal,
        ...(body !== undefined && body !== null ? { body } : {}),
      });

      const contentType = response.headers.get('Content-Type') ?? '';
      let result: unknown;

      if (response.status === 204) {
        result = undefined;
      } else if (contentType.includes('application/json')) {
        result = await response.json();
      } else {
        result = await response.text();
      }

      if (!response.ok) {
        throw new ZenTaoError(
          `Request failed with status ${response.status}`,
          response.status,
          result,
        );
      }

      return result as T;
    } catch (error) {
      if (error instanceof ZenTaoError) {
        throw error;
      }

      if (controller.signal.aborted) {
        throw new ZenTaoError(`Request timeout after ${options?.timeout ?? this.timeout}ms`);
      }

      throw new ZenTaoError(error instanceof Error ? error.message : String(error));
    } finally {
      log.info(`Request to ${url} completed`);
      clearTimeout(timeout);
    }
  }
}
