export const BASE_API = import.meta.env.PROD
  ? ''
  : `${window.location.protocol}//${window.location.hostname}:3001`
