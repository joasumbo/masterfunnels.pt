import { useEffect, useState } from 'react'
import { CircleCheck, Info, TriangleAlert, X } from 'lucide-react'

type Tom = 'atencao' | 'sucesso' | 'nota'

type Aviso = { id: number; texto: string; tom: Tom }

const ICONES = { atencao: TriangleAlert, sucesso: CircleCheck, nota: Info }

const CORES: Record<Tom, string> = {
  atencao: 'border-l-quente text-texto',
  sucesso: 'border-l-sucesso text-texto',
  nota: 'border-l-ouro text-texto',
}

const TINTAS: Record<Tom, string> = {
  atencao: 'text-quente',
  sucesso: 'text-sucesso',
  nota: 'text-ouro',
}

const ouvintes = new Set<(aviso: Aviso) => void>()
let contador = 1

export function avisar(texto: string, tom: Tom = 'atencao') {
  const aviso = { id: contador++, texto, tom }
  ouvintes.forEach((ouvinte) => ouvinte(aviso))
}

export function Avisos() {
  const [lista, setLista] = useState<Aviso[]>([])

  useEffect(() => {
    const relogios: number[] = []

    function receber(aviso: Aviso) {
      setLista((anteriores) => [...anteriores.filter((a) => a.texto !== aviso.texto), aviso].slice(-3))
      relogios.push(
        window.setTimeout(() => setLista((anteriores) => anteriores.filter((a) => a.id !== aviso.id)), 4600),
      )
    }

    ouvintes.add(receber)
    return () => {
      ouvintes.delete(receber)
      relogios.forEach(window.clearTimeout)
    }
  }, [])

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-center gap-2 px-4 pt-4 sm:pt-6"
    >
      {lista.map((aviso) => {
        const Icone = ICONES[aviso.tom]
        return (
          <div
            key={aviso.id}
            className={`aviso-entra pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-lg border border-contorno border-l-2 bg-elevado/95 px-4 py-3 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.9)] backdrop-blur ${CORES[aviso.tom]}`}
          >
            <Icone className={`mt-0.5 h-4 w-4 shrink-0 ${TINTAS[aviso.tom]}`} aria-hidden="true" />
            <p className="flex-1 text-sm leading-relaxed">{aviso.texto}</p>
            <button
              type="button"
              onClick={() => setLista((anteriores) => anteriores.filter((a) => a.id !== aviso.id))}
              aria-label="Fechar"
              className="mt-0.5 text-texto-subtil transition-colors hover:text-texto"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
