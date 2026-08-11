import type { FastifyReply, FastifyRequest } from 'fastify'
import { SignJWT, jwtVerify } from 'jose'
import type { Utilizador } from '@mf/shared/api'

declare module 'fastify' {
  interface FastifyRequest {
    utilizador?: Utilizador
  }
}

export const NOME_COOKIE = 'sessao'

const DURACAO_SESSAO = '8h'
const SEGUNDOS_SESSAO = 8 * 60 * 60

function segredo() {
  const valor = process.env.JWT_SEGREDO
  if (!valor) {
    throw new Error('Falta JWT_SEGREDO no ambiente')
  }
  return new TextEncoder().encode(valor)
}

export async function assinarSessao(utilizador: Utilizador) {
  return new SignJWT({ nome: utilizador.nome })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(utilizador.email)
    .setIssuedAt()
    .setExpirationTime(DURACAO_SESSAO)
    .sign(segredo())
}

export function guardarSessao(resposta: FastifyReply, token: string) {
  resposta.setCookie(NOME_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SEGUNDOS_SESSAO,
  })
}

export function apagarSessao(resposta: FastifyReply) {
  resposta.clearCookie(NOME_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
}

export async function autenticar(pedido: FastifyRequest, resposta: FastifyReply) {
  const token = pedido.cookies[NOME_COOKIE]
  if (!token) {
    return resposta.code(401).send({ erro: 'Sessão inválida ou expirada' })
  }
  try {
    const { payload } = await jwtVerify(token, segredo(), { algorithms: ['HS256'] })
    pedido.utilizador = {
      email: String(payload.sub ?? ''),
      nome: typeof payload.nome === 'string' ? payload.nome : '',
    }
  } catch {
    return resposta.code(401).send({ erro: 'Sessão inválida ou expirada' })
  }
}
