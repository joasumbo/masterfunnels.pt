const definida = import.meta.env.VITE_API_URL

export const BASE_API =
  definida && definida.length > 0
    ? definida
    : `${window.location.protocol}//${window.location.hostname}:3001`
