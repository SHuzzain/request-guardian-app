export const ACCESS_TOKEN = {
  get: () => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("access_token");
  },
  set: (token: string) => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem("access_token", token);
  },
  clear: () => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem("access_token");
  },
};
