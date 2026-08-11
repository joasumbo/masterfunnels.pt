import { z } from 'zod'

export const RENDIMENTOS = [
  'até 1.000 €',
  '1.000 a 1.500 €',
  '1.500 a 2.500 €',
  '2.500 a 4.000 €',
  'mais de 4.000 €',
  'prefiro não dizer',
] as const

export const JA_INVESTIU = ['sim', 'não', 'não sei'] as const

export const ORIGENS = [
  'facebook',
  'ig_feed',
  'ig_stories',
  'youtube',
  'email',
  'organico',
] as const

export const NIVEIS_CONSCIENCIA = [
  'inconsciente',
  'consciente_do_problema',
  'consciente_da_solucao',
  'consciente_do_produto',
] as const

export type Rendimento = (typeof RENDIMENTOS)[number]
export type JaInvestiu = (typeof JA_INVESTIU)[number]
export type Origem = (typeof ORIGENS)[number]
export type NivelConsciencia = (typeof NIVEIS_CONSCIENCIA)[number]

export const ROTULO_ORIGEM: Record<Origem, string> = {
  facebook: 'Facebook',
  ig_feed: 'Instagram — feed',
  ig_stories: 'Instagram — stories',
  youtube: 'YouTube',
  email: 'Email',
  organico: 'Orgânico',
}

export const ROTULO_CONSCIENCIA: Record<NivelConsciencia, string> = {
  inconsciente: 'Inconsciente',
  consciente_do_problema: 'Consciente do problema',
  consciente_da_solucao: 'Consciente da solução',
  consciente_do_produto: 'Consciente do produto',
}

export const RespostaPublicaSchema = z.object({
  idade: z.coerce
    .number({ invalid_type_error: 'Indica a tua idade' })
    .int('A idade tem de ser um número inteiro')
    .min(16, 'Tens de ter pelo menos 16 anos')
    .max(100, 'Confirma a idade'),
  rendimento: z.enum(RENDIMENTOS, {
    errorMap: () => ({ message: 'Escolhe uma das opções' }),
  }),
  ja_investiu: z.enum(JA_INVESTIU, {
    errorMap: () => ({ message: 'Escolhe uma das opções' }),
  }),
  r1_dificuldade: z
    .string()
    .trim()
    .min(10, 'Escreve pelo menos uma frase — é esta resposta que mais nos ajuda')
    .max(2000, 'Resposta demasiado longa'),
  r2_ja_tentou: z.string().trim().max(2000).optional().default(''),
  r3_o_que_faria_comprar: z.string().trim().max(2000).optional().default(''),
  website: z.string().max(0, 'Submissão inválida').optional().default(''),
  tempo_preenchimento: z.coerce.number().int().nonnegative().optional().default(0),
})

export type RespostaPublica = z.infer<typeof RespostaPublicaSchema>

const MAPA_UTM: Record<string, Origem> = {
  facebook: 'facebook',
  fb: 'facebook',
  ig: 'ig_feed',
  instagram: 'ig_feed',
  ig_feed: 'ig_feed',
  ig_stories: 'ig_stories',
  stories: 'ig_stories',
  youtube: 'youtube',
  yt: 'youtube',
  email: 'email',
  newsletter: 'email',
}

export function origemDoUtm(utmSource: string | null | undefined): Origem {
  return MAPA_UTM[(utmSource ?? '').toLowerCase().trim()] ?? 'organico'
}

export const ClassificacaoSchema = z.object({
  cluster_dor: z.string().min(1),
  nivel_consciencia: z.enum(NIVEIS_CONSCIENCIA),
  objecao_principal: z.string().min(1),
  citacao: z.string().nullable(),
  confianca: z.number().int().min(0).max(100),
})

export type Classificacao = z.infer<typeof ClassificacaoSchema>

export const AnguloSchema = z.object({
  gancho: z.string().min(1),
  promessa: z.string().min(1),
  prova: z.string().min(1),
  objecao_que_derruba: z.string().min(1),
  citacoes: z
    .array(z.object({ resposta_id: z.string(), texto: z.string() }))
    .min(1),
})

export type Angulo = z.infer<typeof AnguloSchema>

export function normalizar(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
}

export function semSinal(texto: string | null | undefined): boolean {
  const t = normalizar(texto ?? '')
  return t === '' || t === '-' || t === 'nada' || t === 'na' || t === 'x'
}
