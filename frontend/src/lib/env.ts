export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
};

console.log("API BASE URL:", env.apiBaseUrl);
