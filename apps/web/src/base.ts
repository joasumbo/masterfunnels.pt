const definida = import.meta.env.VITE_API_URL

export const BASE_API =
  definida !== undefined && definida !== ''
    ? definida
    : import.meta.env.DEV
      ? `${window.location.protocol}//${window.location.hostname}:3001`
      : ''
