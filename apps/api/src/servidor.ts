import { construirApp } from './app.js'

const servidor = await construirApp()
const porta = Number(process.env.PORT ?? 3001)

try {
  await servidor.listen({ port: porta, host: '0.0.0.0' })
  console.log(`API a ouvir em http://localhost:${porta}`)
} catch (erro) {
  servidor.log.error(erro)
  process.exit(1)
}
