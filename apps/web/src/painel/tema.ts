export const CORES = [
  '#b8891f',
  '#1f4e79',
  '#0f7a5a',
  '#b4522a',
  '#6b4c9a',
  '#a8324a',
  '#3f7d3a',
  '#c2803f',
  '#2d6b8a',
  '#7a6a5c',
]

export const CORES_CONSCIENCIA: Record<string, string> = {
  inconsciente: '#a8324a',
  consciente_do_problema: '#b4522a',
  consciente_da_solucao: '#b8891f',
  consciente_do_produto: '#0f7a5a',
}

export function corDoCluster(indice: number) {
  return CORES[indice % CORES.length]
}

const FORMATO_DATA = new Intl.DateTimeFormat('pt-PT', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const FORMATO_HORA = new Intl.DateTimeFormat('pt-PT', {
  hour: '2-digit',
  minute: '2-digit',
})

export function data(iso: string) {
  return FORMATO_DATA.format(new Date(iso))
}

export function dataHora(iso: string) {
  const momento = new Date(iso)
  return `${FORMATO_DATA.format(momento)}, ${FORMATO_HORA.format(momento)}`
}

export function haQuanto(iso: string) {
  const segundos = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (segundos < 60) return 'agora mesmo'
  const minutos = Math.floor(segundos / 60)
  if (minutos < 60) return `há ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `há ${horas} h`
  const dias = Math.floor(horas / 24)
  if (dias < 31) return `há ${dias} d`
  const meses = Math.floor(dias / 30)
  return `há ${meses} m`
}

export function duracao(inicio: string, fim: string | null) {
  if (!fim) return '—'
  const ms = new Date(fim).getTime() - new Date(inicio).getTime()
  if (ms < 1000) return `${ms} ms`
  return `${(ms / 1000).toFixed(1)} s`
}

export function numero(valor: number) {
  return new Intl.NumberFormat('pt-PT').format(valor)
}

export function encurtar(texto: string, limite: number) {
  if (texto.length <= limite) return texto
  return texto.slice(0, limite).trimEnd() + '…'
}
