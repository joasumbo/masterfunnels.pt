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
  const app = await iniciar()
  app.server.emit('request', pedido, resposta)
}
