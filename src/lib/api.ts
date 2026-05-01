import axios from "axios";

const STORAGE_KEY = "kassa.api_base";
const TOKEN_KEY = "kassa.token";
const ROLE_KEY = "kassa.role";

export type Role = "SUPER_ADMIN" | "ADMIN" | "CASHIER";

export const getApiBase = () =>
  localStorage.getItem(STORAGE_KEY) || "http://localhost:9000";
export const setApiBase = (url: string) => {
  localStorage.setItem(STORAGE_KEY, url.replace(/\/+$/, ""));
  api.defaults.baseURL = getApiBase();
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) => {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
};
export const getRole = (): Role | null =>
  (localStorage.getItem(ROLE_KEY) as Role | null) || null;
export const setRole = (r: Role | null) => {
  if (r) localStorage.setItem(ROLE_KEY, r);
  else localStorage.removeItem(ROLE_KEY);
};

export const api = axios.create({ baseURL: getApiBase() });

api.interceptors.request.use((cfg) => {
  const t = getToken();
  if (t) {
    cfg.headers = cfg.headers ?? {};
    cfg.headers["Authorization"] = `Bearer ${t}`;
    (cfg.headers as any)["access_token"] = t;
  }
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      setToken(null);
      setRole(null);
    }
    return Promise.reject(err);
  }
);

export const rolePathPrefix = (role: Role) =>
  role === "SUPER_ADMIN" ? "/super-admin" : role === "ADMIN" ? "/admin" : "/cashier";

export const dashboardPath = (role: Role) =>
  role === "SUPER_ADMIN" ? "/super-admin" : role === "ADMIN" ? "/admin" : "/cashier";
