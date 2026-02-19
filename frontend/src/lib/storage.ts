const KEY_TOKEN = "bf_token";
const KEY_USER = "bf_user";

// cambia aqui: sessionStorage para demo PVP
const storage = window.sessionStorage;

export function getToken() {
  return storage.getItem(KEY_TOKEN);
}

export function setToken(token: string) {
  storage.setItem(KEY_TOKEN, token);
}

export function clearToken() {
  storage.removeItem(KEY_TOKEN);
}

export function getUserRaw() {
  return storage.getItem(KEY_USER);
}

export function setUserRaw(userJson: string) {
  storage.setItem(KEY_USER, userJson);
}

export function clearUserRaw() {
  storage.removeItem(KEY_USER);
}

export function clearAllAuth() {
  clearToken();
  clearUserRaw();
}