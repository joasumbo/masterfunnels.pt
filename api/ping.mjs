export default function handler(_pedido, resposta) {
  resposta.setHeader('content-type', 'application/json; charset=utf-8')
  resposta.end(
    JSON.stringify({
      ok: true,
      node: process.version,
      temBaseDados: Boolean(process.env.DATABASE_URL),
      temGemini: Boolean(process.env.GEMINI_API_KEY),
      temSegredo: Boolean(process.env.JWT_SEGREDO),
    }),
  )
}
