const PLAYER_ID_KEY = "rift-clues-player-id";
const DISPLAY_NAME_KEY = "rift-clues-display-name";
const AVATAR_KEY = "rift-clues-avatar";

function canUseStorage() {
  return typeof window !== "undefined";
}

export function getOrCreateLocalPlayerId() {
  if (!canUseStorage()) {
    return "";
  }

  const existing = window.localStorage.getItem(PLAYER_ID_KEY);
  if (existing) {
    return existing;
  }

  const generated = crypto.randomUUID();
  window.localStorage.setItem(PLAYER_ID_KEY, generated);
  return generated;
}

export function getStoredDisplayName() {
  if (!canUseStorage()) {
    return "";
  }

  return window.localStorage.getItem(DISPLAY_NAME_KEY) ?? "";
}

export function setStoredDisplayName(name: string) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(DISPLAY_NAME_KEY, name);
}

export function getStoredAvatar() {
  if (!canUseStorage()) {
    return "";
  }

  return window.localStorage.getItem(AVATAR_KEY) ?? "";
}

export function setStoredAvatar(avatar: string) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(AVATAR_KEY, avatar);
}
