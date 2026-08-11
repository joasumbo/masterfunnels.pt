import 'dotenv/config'
import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import { rotasAutenticacao } from './rotas/autenticacao.js'
import { rotasClassificacoes } from './rotas/classificacoes.js'
import { rotasClusters } from './rotas/clusters.js'
import { rotasRespostas } from './rotas/respostas.js'
import { rotasResumo } from './rotas/resumo.js'

const servidor = Fastify({ logger: { level: 'warn' } })

const origens = ['http://localhost:5173']
if (process.env.FRONTEND_URL) origens.push(process.env.FRONTEND_URL)

await servidor.register(cors, { origin: origens, credentials: true })
await servidor.register(cookie)

servidor.get('/api/saude', async () => ({ ok: true }))

await servidor.register(rotasAutenticacao, { prefix: '/api' })
await servidor.register(rotasRespostas, { prefix: '/api' })
await servidor.register(rotasResumo, { prefix: '/api' })
await servidor.register(rotasClusters, { prefix: '/api' })
await servidor.register(rotasClassificacoes, { prefix: '/api' })

const porta = Number(process.env.PORT ?? 3001)

try {
  await servidor.listen({ port: porta, host: '0.0.0.0' })
  console.log(`API a ouvir em http://localhost:${porta}`)
} catch (erro) {
  servidor.log.error(erro)
  process.exit(1)
}
