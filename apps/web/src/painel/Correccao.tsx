import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { NIVEIS_CONSCIENCIA, ROTULO_CONSCIENCIA, normalizar, type NivelConsciencia } from '@mf/shared'
import type { ClassificacaoDTO, RespostaDTO } from '@mf/shared/api'
import { api } from './api'
import { Botao, CLASSE_CAMPO, Erro } from './ui'

export function Correccao({
  resposta,
  clusters,
  aoGuardar,
  aoCancelar,
}: {
  resposta: RespostaDTO
  clusters: { slug: string; nome: string }[]
  aoGuardar: (c: ClassificacaoDTO) => void
  aoCancelar: () => void
}) {
  const actual = resposta.classificacao
  const [clusterDor, setClusterDor] = useState(actual?.clusterDor ?? clusters[0]?.slug ?? '')
  const [nivel, setNivel] = useState<NivelConsciencia>(
    actual?.nivelConsciencia ?? 'consciente_do_problema',
  )
  const [objecao, setObjecao] = useState(actual?.objecaoPrincipal ?? '')
  const [citacao, setCitacao] = useState(actual?.citacao ?? '')
  const [aGuardar, setAGuardar] = useState(false)
  const [erro, setErro] = useState('')

  const corpo = [resposta.r1Dificuldade, resposta.r2JaTentou, resposta.r3OQueFariaComprar]
    .filter(Boolean)
    .join(' ')

  const literal = citacao.trim() === '' || normalizar(corpo).includes(normalizar(citacao))

  async function guardar() {
    if (!literal) {
      setErro('A citação tem de ser um excerto literal do que a pessoa escreveu.')
      return
    }

    setAGuardar(true)
    setErro('')
    try {
      const nova = await api.corrigir(resposta.id, {
        clusterDor,
        nivelConsciencia: nivel,
        objecaoPrincipal: objecao,
        citacao: citacao.trim() === '' ? null : citacao.trim(),
      })
      aoGuardar(nova)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível guardar')
      setAGuardar(false)
    }
  }

  return (
    <div className="space-y-3.5 rounded-xl border border-ouro/40 bg-ouro/5 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.1em] text-ouro-escuro">
        Corrigir classificação
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs text-tinta-fraca">Cluster de dor</span>
          <select
            value={clusterDor}
            onChange={(e) => setClusterDor(e.target.value)}
            className={`${CLASSE_CAMPO} cursor-pointer`}
          >
            {clusters.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs text-tinta-fraca">Estado de consciência</span>
          <select
            value={nivel}
            onChange={(e) => setNivel(e.target.value as NivelConsciencia)}
            className={`${CLASSE_CAMPO} cursor-pointer`}
          >
            {NIVEIS_CONSCIENCIA.map((n) => (
              <option key={n} value={n}>
                {ROTULO_CONSCIENCIA[n]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs text-tinta-fraca">Objeção principal</span>
        <input
          value={objecao}
          onChange={(e) => setObjecao(e.target.value)}
          className={CLASSE_CAMPO}
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs text-tinta-fraca">
          Citação — tem de ser um excerto literal da resposta
        </span>
        <textarea
          rows={2}
          value={citacao}
          onChange={(e) => setCitacao(e.target.value)}
          className={`${CLASSE_CAMPO} resize-y ${literal ? '' : 'border-ferrugem'}`}
        />
        {!literal ? (
          <span className="mt-1.5 block text-xs text-ferrugem">
            Este excerto não aparece no texto desta resposta.
          </span>
        ) : null}
      </label>

      {erro ? <Erro mensagem={erro} /> : null}

      <div className="flex gap-2">
        <Botao tom="ouro" onClick={guardar} disabled={aGuardar}>
          <Check className="h-3.5 w-3.5" />
          {aGuardar ? 'A guardar' : 'Guardar correção'}
        </Botao>
        <Botao tom="fantasma" onClick={aoCancelar}>
          <X className="h-3.5 w-3.5" />
          Cancelar
        </Botao>
      </div>
    </div>
  )
}
