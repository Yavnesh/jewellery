import config from './config';

export const apiClient = {
  baseUrl: config.apiBaseUrl,
  
  async request(endpoint: string, options: RequestInit = {}) {
    let base = "";
    if (typeof window !== "undefined") {
      base = window.location.origin;
    } else {
      base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
      if (base === "undefined") {
        base = "http://localhost:3000";
      }
    }
    const url = `${base}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };
    
    return fetch(url, { ...defaultOptions, ...options });
  },
  
  // Convenience methods
  get: (endpoint: string, options?: RequestInit) => 
    apiClient.request(endpoint, { ...options, method: 'GET' }),
    
  post: (endpoint: string, data?: any, options?: RequestInit) =>
    apiClient.request(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  put: (endpoint: string, data?: any, options?: RequestInit) =>
    apiClient.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  delete: (endpoint: string, options?: RequestInit) =>
    apiClient.request(endpoint, { ...options, method: 'DELETE' }),
};

export default apiClient;
