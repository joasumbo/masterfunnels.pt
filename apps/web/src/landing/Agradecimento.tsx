import { Check } from 'lucide-react'

export function Agradecimento() {
  return (
    <div className="py-10 sm:py-16">
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-ouro">
        <Check className="h-6 w-6 text-ouro" aria-hidden="true" />
      </span>

      <h2 className="mt-10 font-serif text-4xl leading-tight text-texto sm:text-5xl">Recebido.</h2>

      <div className="mt-6 max-w-xl space-y-4 text-base leading-relaxed text-texto-fraco">
        <p>
          Obrigado pelo tempo. A tua resposta vai para a mesma pilha que estamos a ler uma a uma,
          sem atalhos.
        </p>
        <p>
          Não te vamos enviar emails, porque não te pedimos nenhum. Podes fechar esta página.
        </p>
      </div>

      <p className="mt-10 border-t border-contorno pt-6 text-sm text-texto-subtil">
        Se conheces alguém a começar do zero com dinheiro, passa-lhe o link.
      </p>
    </div>
  )
}
