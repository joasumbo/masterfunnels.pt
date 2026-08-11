import type { IncomingMessage, ServerResponse } from 'node:http'
import { construirApp } from './app.js'

type App = Awaited<ReturnType<typeof construirApp>>

let arranque: Promise<App> | undefined

function iniciar() {
  if (!arranque) {
    arranque = construirApp().then(async (app) => {
      await app.ready()
      return app
    })
  }
  return arranque
}

export default async function handler(pedido: IncomingMessage, resposta: ServerResponse) {
  try {
    const app = await iniciar()
    app.server.emit('request', pedido, resposta)
  } catch (erro) {
    arranque = undefined
    console.error('Falhou o arranque da API', erro)
    resposta.statusCode = 500
    resposta.setHeader('content-type', 'application/json; charset=utf-8')
    resposta.end(
      JSON.stringify({ erro: 'A API não arrancou', detalhe: (erro as Error)?.message ?? String(erro) }),
    )
  }
}
