const trimTrailingSlash = (value) => value?.replace(/\/+$/, "");

export const backendLink = trimTrailingSlash(import.meta.env.VITE_BACKEND_URL) || "http://localhost:5000";
