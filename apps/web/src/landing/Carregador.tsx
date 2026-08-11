export function Carregador({ aSair }: { aSair: boolean }) {
  return (
    <div
      className={`fixed inset-0 z-[60] flex flex-col items-center justify-center bg-fundo transition-opacity duration-500 ${
        aSair ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <div className="brilho relative">
        <img
          src="/marca/logo-wordmark-light.svg"
          alt="Master Funnels"
          className="h-10 w-auto sm:h-12"
        />
      </div>

      <div className="mt-8 h-px w-40 overflow-hidden bg-contorno sm:w-52">
        <div className="risca h-full w-1/3 bg-ouro" />
      </div>
    </div>
  )
}
