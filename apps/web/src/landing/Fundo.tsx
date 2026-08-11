import { useEffect, useRef } from 'react'

const LINHAS = 18
const PASSO = 10

export function Fundo() {
  const referencia = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const tela = referencia.current
    if (!tela) return
    const ctx = tela.getContext('2d')
    if (!ctx) return

    const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let largura = 0
    let altura = 0
    let pedido = 0
    let inicio = performance.now()

    const alvo = { x: -9999, y: -9999 }
    const suave = { x: -9999, y: -9999 }

    function dimensionar() {
      const escala = Math.min(window.devicePixelRatio || 1, 2)
      largura = tela!.clientWidth
      altura = tela!.clientHeight
      tela!.width = Math.max(1, Math.floor(largura * escala))
      tela!.height = Math.max(1, Math.floor(altura * escala))
      ctx!.setTransform(escala, 0, 0, escala, 0, 0)
    }

    function desenhar(agora: number) {
      const tempo = reduzido ? 0 : (agora - inicio) * 0.001
      const contexto = ctx!

      suave.x += (alvo.x - suave.x) * 0.07
      suave.y += (alvo.y - suave.y) * 0.07

      contexto.clearRect(0, 0, largura, altura)

      const espaco = altura / (LINHAS - 1)
      const raio = Math.max(200, Math.min(largura, altura) * 0.42)
      const amplitude = largura < 640 ? 0.6 : 1

      for (let i = 0; i < LINHAS; i++) {
        const base = i * espaco
        const fase = tempo * 0.16 + i * 0.42
        const altura1 = (8 + i * 1.1) * amplitude
        const altura2 = (16 - Math.abs(i - LINHAS / 2) * 1.2) * amplitude

        contexto.beginPath()

        let maisPerto = Infinity

        for (let x = 0; x <= largura + PASSO; x += PASSO) {
          const onda =
            Math.sin(x * 0.0042 + fase) * altura1 + Math.sin(x * 0.0015 - fase * 1.35) * altura2

          const dx = x - suave.x
          const dy = base - suave.y
          const distancia = Math.sqrt(dx * dx + dy * dy)
          if (distancia < maisPerto) maisPerto = distancia

          const forca = distancia < raio ? (1 - distancia / raio) ** 2 : 0
          const sentido = dy === 0 ? 1 : Math.sign(dy)
          const y = base + onda + forca * 64 * sentido

          if (x === 0) contexto.moveTo(x, y)
          else contexto.lineTo(x, y)
        }

        const proximidade = maisPerto < raio ? 1 - maisPerto / raio : 0
        const opacidade = 0.05 + proximidade * 0.32

        const gradiente = contexto.createLinearGradient(0, 0, largura, 0)
        gradiente.addColorStop(0, 'rgba(212, 168, 67, 0)')
        gradiente.addColorStop(0.25, `rgba(212, 168, 67, ${opacidade})`)
        gradiente.addColorStop(0.72, `rgba(232, 195, 106, ${opacidade * 0.85})`)
        gradiente.addColorStop(1, 'rgba(212, 168, 67, 0)')

        contexto.strokeStyle = gradiente
        contexto.lineWidth = 1 + proximidade * 0.6
        contexto.stroke()
      }

      pedido = requestAnimationFrame(desenhar)
    }

    function mover(evento: PointerEvent) {
      const caixa = tela!.getBoundingClientRect()
      alvo.x = evento.clientX - caixa.left
      alvo.y = evento.clientY - caixa.top
    }

    function largar() {
      alvo.x = -9999
      alvo.y = -9999
    }

    dimensionar()
    inicio = performance.now()
    pedido = requestAnimationFrame(desenhar)

    window.addEventListener('resize', dimensionar)
    window.addEventListener('pointermove', mover, { passive: true })
    window.addEventListener('pointerleave', largar)

    return () => {
      cancelAnimationFrame(pedido)
      window.removeEventListener('resize', dimensionar)
      window.removeEventListener('pointermove', mover)
      window.removeEventListener('pointerleave', largar)
    }
  }, [])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-fundo" />
      <div className="absolute -top-1/3 left-1/2 h-[90vh] w-[130vw] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(212,168,67,0.13),rgba(212,168,67,0.04)_45%,transparent_75%)] blur-[2px]" />
      <div className="absolute -bottom-1/4 right-0 h-[70vh] w-[80vw] rounded-full bg-[radial-gradient(closest-side,rgba(201,125,46,0.10),transparent_70%)]" />
      <canvas ref={referencia} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(6,6,8,0.72),rgba(6,6,8,0.35)_45%,rgba(6,6,8,0.85))]" />
    </div>
  )
}
