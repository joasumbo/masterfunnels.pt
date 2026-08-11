import type { Origem, RespostaPublica } from '@mf/shared'

export type PayloadResposta = RespostaPublica & { origem: Origem }

export async function enviarResposta(payload: PayloadResposta): Promise<void> {
  const resposta = await fetch(`${import.meta.env.VITE_API_URL}/api/respostas`, {
    method: 'POST',
    credentials: 'omit',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!resposta.ok) {
    throw new Error(`resposta do servidor: ${resposta.status}`)
  }
}
