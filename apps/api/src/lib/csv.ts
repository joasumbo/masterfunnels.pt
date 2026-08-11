export function lerCsv(conteudo: string): Record<string, string>[] {
  const linhas: string[][] = []
  let campo = ''
  let linha: string[] = []
  let dentroDeAspas = false

  const texto = conteudo.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]

    if (dentroDeAspas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campo += '"'
          i++
        } else {
          dentroDeAspas = false
        }
      } else {
        campo += c
      }
      continue
    }

    if (c === '"') {
      dentroDeAspas = true
    } else if (c === ',') {
      linha.push(campo)
      campo = ''
    } else if (c === '\n') {
      linha.push(campo)
      linhas.push(linha)
      linha = []
      campo = ''
    } else {
      campo += c
    }
  }

  if (campo !== '' || linha.length > 0) {
    linha.push(campo)
    linhas.push(linha)
  }

  const cabecalho = linhas.shift()
  if (!cabecalho) return []

  return linhas
    .filter((l) => l.some((v) => v.trim() !== ''))
    .map((l) => {
      const registo: Record<string, string> = {}
      cabecalho.forEach((coluna, i) => {
        registo[coluna.trim()] = (l[i] ?? '').trim()
      })
      return registo
    })
}

export function escreverCsv(cabecalho: string[], linhas: (string | number | null)[][]): string {
  const escapar = (v: string | number | null) => {
    const s = v === null ? '' : String(v)
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  return [cabecalho.join(','), ...linhas.map((l) => l.map(escapar).join(','))].join('\n')
}
