import 'dotenv/config'

const CHAVE = process.env.GEMINI_API_KEY
if (!CHAVE) throw new Error('Falta GEMINI_API_KEY no ambiente')

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

export const MODELO_CLASSIFICACAO = process.env.MODELO_CLASSIFICACAO ?? 'gemini-2.5-flash'
export const MODELO_AGENTE = process.env.MODELO_AGENTE ?? 'gemini-2.5-pro'

export type Esquema = {
  type: 'STRING' | 'NUMBER' | 'INTEGER' | 'BOOLEAN' | 'ARRAY' | 'OBJECT'
  description?: string
  nullable?: boolean
  enum?: string[]
  items?: Esquema
  properties?: Record<string, Esquema>
  required?: string[]
  propertyOrdering?: string[]
}

export type Uso = { entrada: number; saida: number }

type Parte = { text?: string; functionCall?: { name: string; args: Record<string, unknown> } }

type RespostaGemini = {
  candidates?: { content?: { parts?: Parte[] }; finishReason?: string }[]
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number }
  error?: { message?: string; status?: string }
}

async function chamar(modelo: string, corpo: unknown, tentativa = 0): Promise<RespostaGemini> {
  const r = await fetch(`${BASE}/${modelo}:generateContent?key=${CHAVE}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(corpo),
  })

  const j = (await r.json()) as RespostaGemini

  if (!r.ok) {
    const recuperavel = r.status === 429 || r.status === 503 || r.status === 403
    if (recuperavel && tentativa < 6) {
      const indicado = /retry in ([\d.]+)s/i.exec(j.error?.message ?? '')
      const espera = indicado ? Math.ceil(Number(indicado[1]) * 1000) + 1500 : 4000 * (tentativa + 1)
      await new Promise((s) => setTimeout(s, espera))
      return chamar(modelo, corpo, tentativa + 1)
    }
    throw new Error(`Gemini ${r.status}: ${j.error?.message ?? 'erro desconhecido'}`)
  }

  return j
}

function uso(j: RespostaGemini): Uso {
  return {
    entrada: j.usageMetadata?.promptTokenCount ?? 0,
    saida: j.usageMetadata?.candidatesTokenCount ?? 0,
  }
}

export async function pedirJson<T>(opcoes: {
  modelo: string
  sistema: string
  utilizador: string
  esquema: Esquema
}): Promise<{ dados: T; uso: Uso }> {
  const j = await chamar(opcoes.modelo, {
    systemInstruction: { parts: [{ text: opcoes.sistema }] },
    contents: [{ role: 'user', parts: [{ text: opcoes.utilizador }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: opcoes.esquema,
      temperature: 0.3,
    },
  })

  const texto = j.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? ''
  if (!texto.trim()) throw new Error('O modelo devolveu resposta vazia')

  return { dados: JSON.parse(texto) as T, uso: uso(j) }
}

export type Ferramenta = {
  name: string
  description: string
  parameters: Esquema
}

export type Turno =
  | { role: 'user'; parts: { text: string }[] }
  | { role: 'model'; parts: Parte[] }
  | {
      role: 'user'
      parts: { functionResponse: { name: string; response: Record<string, unknown> } }[]
    }

export async function pedirComFerramentas(opcoes: {
  modelo: string
  sistema: string
  historico: Turno[]
  ferramentas: Ferramenta[]
}): Promise<{ partes: Parte[]; uso: Uso }> {
  const j = await chamar(opcoes.modelo, {
    systemInstruction: { parts: [{ text: opcoes.sistema }] },
    contents: opcoes.historico,
    tools: [{ functionDeclarations: opcoes.ferramentas }],
    toolConfig: { functionCallingConfig: { mode: 'AUTO' } },
    generationConfig: { temperature: 0.6 },
  })

  return { partes: j.candidates?.[0]?.content?.parts ?? [], uso: uso(j) }
}
