import { useCallback, useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Download, RefreshCw } from 'lucide-react'
import type { Resumo, Utilizador } from '@mf/shared/api'
import { api, NaoAutenticado } from './api'
import { Botao, Carregando, Erro, Ligacao } from './ui'
import { Estrutura } from './Estrutura'
import Entrada from './Entrada'
import VisaoGeral from './VisaoGeral'
import Respostas from './Respostas'
import Clusters from './Clusters'
import Cluster from './Cluster'
import Agente from './Agente'

const CABECALHOS: { padrao: RegExp; titulo: string; nota: string }[] = [
  {
    padrao: /^\/painel\/respostas/,
    titulo: 'Respostas',
    nota: 'Todas as respostas recebidas, com o que a classificação lhes atribuiu',
  },
  {
    padrao: /^\/painel\/clusters\/.+/,
    titulo: 'Cluster de dor',
    nota: 'As respostas que caíram aqui e os ângulos gerados a partir delas',
  },
  {
    padrao: /^\/painel\/clusters/,
    titulo: 'Clusters de dor',
    nota: 'Os dez grupos que emergiram do texto livre',
  },
  {
    padrao: /^\/painel\/agente/,
    titulo: 'Agente de ângulos',
    nota: 'O que consultou, quantas iterações levou e porque parou',
  },
]

function cabecalho(caminho: string) {
  const encontrado = CABECALHOS.find((c) => c.padrao.test(caminho))
  return (
    encontrado ?? {
      titulo: 'Visão geral',
      nota: 'Curso de finanças pessoais e investimento para iniciantes',
    }
  )
}

export default function Painel() {
  const [utilizador, setUtilizador] = useState<Utilizador | null>(null)
  const [aVerificar, setAVerificar] = useState(true)
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [erro, setErro] = useState('')
  const [aActualizar, setAActualizar] = useState(false)
  const local = useLocation()

  const carregar = useCallback(async () => {
    try {
      const { utilizador } = await api.eu()
      setUtilizador(utilizador)
      setResumo(await api.resumo())
    } catch (e) {
      if (e instanceof NaoAutenticado) setUtilizador(null)
      else setErro(e instanceof Error ? e.message : 'Erro a contactar a API')
    } finally {
      setAVerificar(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const refrescar = useCallback(async () => {
    setAActualizar(true)
    try {
      setResumo(await api.resumo())
    } catch {
      /* mantém o que já está no ecrã */
    } finally {
      setAActualizar(false)
    }
  }, [])

  async function sair() {
    await api.sair().catch(() => {})
    setUtilizador(null)
    setResumo(null)
  }

  if (aVerificar) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-papel">
        <Carregando />
      </main>
    )
  }

  if (!utilizador) {
    return (
      <Entrada
        aoEntrar={() => {
          setAVerificar(true)
          carregar()
        }}
      />
    )
  }

  const { titulo, nota } = cabecalho(local.pathname)
  const clustersSimples = resumo?.clusters.map((c) => ({ slug: c.slug, nome: c.nome })) ?? []

  return (
    <Estrutura
      utilizador={utilizador}
      aoSair={sair}
      titulo={titulo}
      nota={nota}
      accoes={
        <>
          <Botao pequeno tom="fantasma" onClick={refrescar} disabled={aActualizar}>
            <RefreshCw className={`h-3.5 w-3.5 ${aActualizar ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </Botao>
          <Ligacao pequeno href={api.urlExportacaoTotal()}>
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </Ligacao>
        </>
      }
    >
      {erro ? <Erro mensagem={erro} /> : null}
      {!resumo && !erro ? <Carregando /> : null}

      {resumo ? (
        <Routes>
          <Route path="/" element={<VisaoGeral resumo={resumo} />} />
          <Route path="respostas" element={<Respostas clusters={clustersSimples} />} />
          <Route path="clusters" element={<Clusters resumo={resumo} />} />
          <Route
            path="clusters/:slug"
            element={<Cluster clusters={clustersSimples} aoMudar={refrescar} />}
          />
          <Route path="agente" element={<Agente />} />
          <Route path="*" element={<VisaoGeral resumo={resumo} />} />
        </Routes>
      ) : null}
    </Estrutura>
  )
}
