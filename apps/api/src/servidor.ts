import 'dotenv/config'
import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import { rotasAutenticacao } from './rotas/autenticacao.js'
import { rotasClassificacoes } from './rotas/classificacoes.js'
import { rotasClusters } from './rotas/clusters.js'
import { rotasDados } from './rotas/dados.js'
import { rotasRespostas } from './rotas/respostas.js'
import { rotasResumo } from './rotas/resumo.js'

const servidor = Fastify({ logger: { level: 'warn' } })

const origens = ['http://localhost:5173']
if (process.env.FRONTEND_URL) origens.push(process.env.FRONTEND_URL)

const REDE_LOCAL = /^http:\/\/(localhost|127\.0\.0\.1|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)[\d.]*:\d+$/

await servidor.register(cors, {
  origin: (origem, feito) => {
    if (!origem || origens.includes(origem) || REDE_LOCAL.test(origem)) feito(null, true)
    else feito(null, false)
  },
  credentials: true,
})
await servidor.register(cookie)

servidor.get('/api/saude', async () => ({ ok: true }))

await servidor.register(rotasAutenticacao, { prefix: '/api' })
await servidor.register(rotasRespostas, { prefix: '/api' })
await servidor.register(rotasResumo, { prefix: '/api' })
await servidor.register(rotasClusters, { prefix: '/api' })
await servidor.register(rotasClassificacoes, { prefix: '/api' })
await servidor.register(rotasDados, { prefix: '/api' })

const porta = Number(process.env.PORT ?? 3001)

try {
  await servidor.listen({ port: porta, host: '0.0.0.0' })
  console.log(`API a ouvir em http://localhost:${porta}`)
} catch (erro) {
  servidor.log.error(erro)
  process.exit(1)
}
