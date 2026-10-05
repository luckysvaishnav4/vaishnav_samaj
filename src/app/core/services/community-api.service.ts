import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

interface ApiRuntimeConfig {
  apiBaseUrl: string;
}

@Injectable({ providedIn: 'root' })
export class CommunityApiService {
  private apiBaseUrl = '';
  private initialized = false;
  private configErrorMessage: string | null = null;
  private readonly tokenKey = 'vaishnav-samaj-session';

  constructor(private readonly http: HttpClient) {}

  get isConfigured(): boolean {
    return Boolean(this.apiBaseUrl);
  }

  get configurationError(): string | null {
    return this.configErrorMessage;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    try {
      const config = await firstValueFrom(this.http.get<ApiRuntimeConfig>('/assets/api-config.json'));
      const baseUrl = config.apiBaseUrl.trim().replace(/\/+$/, '');
      if (!baseUrl) {
        this.initialized = true;
        return;
      }
      if (baseUrl.startsWith('/')) {
        if (baseUrl.startsWith('//')) throw new Error('API base URL must be a same-origin path or HTTP(S) URL.');
      } else {
        const parsed = new URL(baseUrl);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          throw new Error('API base URL must use HTTP or HTTPS.');
        }
      }
      this.apiBaseUrl = baseUrl;
    } catch (error: unknown) {
      this.configErrorMessage = error instanceof Error
        ? error.message
        : 'The API configuration could not be loaded.';
    } finally {
      this.initialized = true;
    }
  }

  setSessionToken(token: string): void {
    if (typeof window !== 'undefined') window.sessionStorage.setItem(this.tokenKey, token);
  }

  clearSessionToken(): void {
    if (typeof window !== 'undefined') window.sessionStorage.removeItem(this.tokenKey);
  }

  get hasSessionToken(): boolean {
    return typeof window !== 'undefined' && Boolean(window.sessionStorage.getItem(this.tokenKey));
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }

  delete(path: string): Promise<void> {
    return this.request<void>('DELETE', path);
  }

  upload<T>(path: string, fieldName: string, file: File): Promise<T> {
    const body = new FormData();
    body.append(fieldName, file);
    return this.request<T>('POST', path, body);
  }

  async getProtectedImage(path: string): Promise<string> {
    const blob = await this.request<Blob>('GET', path, undefined, 'blob');
    return URL.createObjectURL(blob);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    responseType: 'json' | 'blob' = 'json'
  ): Promise<T> {
    if (!this.apiBaseUrl) {
      throw new Error(this.configErrorMessage ?? 'The PostgreSQL API is not configured.');
    }
    const token = typeof window !== 'undefined' ? window.sessionStorage.getItem(this.tokenKey) : null;
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    const url = `${this.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    try {
      if (responseType === 'blob') {
        return await firstValueFrom(this.http.request(method, url, {
          body,
          headers,
          responseType: 'blob'
        })) as T;
      }
      return await firstValueFrom(this.http.request<T>(method, url, {
        body,
        headers,
        responseType: 'json'
      }));
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) this.clearSessionToken();
        const message = typeof error.error === 'object' && error.error && 'error' in error.error
          ? String(error.error.error)
          : error.status === 0
            ? 'Cannot reach the PostgreSQL API. Start the API server and check the API URL.'
            : `API request failed (${error.status}).`;
        throw new Error(message);
      }
      throw error;
    }
  }
}
