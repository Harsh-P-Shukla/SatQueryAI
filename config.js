const trimTrailingSlash = (value) => value?.replace(/\/+$/, "");

export const translateLink = trimTrailingSlash(process.env.TRANSLATE_URL) || "http://localhost:5001";
export const frontendLink = trimTrailingSlash(process.env.FRONTEND_URL) || "http://localhost:5173";
export const backendLink = trimTrailingSlash(process.env.BACKEND_URL) || "http://localhost:5000";
export const modelLink = trimTrailingSlash(process.env.INFERENCE_SERVICE_URL) || "http://localhost:8000";
