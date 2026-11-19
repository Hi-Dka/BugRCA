export interface HttpClientConfig {
    baseUrl: string;
    timeout?: number | undefined;
    getToken?: (() => string | undefined) | undefined;
}

export interface RequestOptions {
    params?: Record<string, string | number | boolean | undefined | null>;
    data?: unknown;
    headers?: Record<string, string>;
    timeout?: number;
    auth?: boolean;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
