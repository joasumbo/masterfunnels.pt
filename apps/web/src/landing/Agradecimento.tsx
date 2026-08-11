import { Check } from 'lucide-react'

export function Agradecimento() {
  return (
    <div>
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-sucesso bg-sucesso/10">
        <Check className="h-6 w-6 text-sucesso" aria-hidden="true" />
      </span>

      <h2
        className="mt-8 font-serif leading-[1.15] text-texto"
        style={{ fontSize: 'clamp(1.7rem, 1.1rem + 2.8vh, 3rem)' }}
      >
        A tua informação foi enviada com sucesso.
      </h2>

      <div
        className="mt-5 max-w-xl space-y-4 leading-relaxed text-texto-fraco"
        style={{ fontSize: 'clamp(0.9rem, 0.8rem + 0.5vh, 1.05rem)' }}
      >
        <p>
          Ficou registada. Vai para a mesma pilha que estamos a ler uma a uma, sem atalhos, e conta
          para desenhar o curso.
        </p>
        <p>Não te vamos enviar emails, porque não te pedimos nenhum. Podes fechar esta página.</p>
      </div>

      <p className="mt-8 border-t border-contorno pt-5 text-sm text-texto-subtil">
        Se conheces alguém a começar do zero com dinheiro, passa-lhe o link.
      </p>
    </div>
  )
}
