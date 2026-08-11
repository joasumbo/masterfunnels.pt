import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  serial,
  jsonb,
  index,
} from 'drizzle-orm/pg-core'

export const respostas = pgTable(
  'respostas',
  {
    id: text('id').primaryKey(),
    fonte: text('fonte').notNull().default('landing'),
    submetidoEm: timestamp('submetido_em', { withTimezone: true }).notNull(),
    idade: integer('idade'),
    rendimento: text('rendimento'),
    jaInvestiu: text('ja_investiu'),
    origem: text('origem').notNull().default('organico'),
    r1Dificuldade: text('r1_dificuldade').notNull(),
    r2JaTentou: text('r2_ja_tentou'),
    r3OQueFariaComprar: text('r3_o_que_faria_comprar'),
    criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    idxFonte: index('idx_respostas_fonte').on(t.fonte),
    idxOrigem: index('idx_respostas_origem').on(t.origem),
  }),
)

export const clusters = pgTable('clusters', {
  slug: text('slug').primaryKey(),
  nome: text('nome').notNull(),
  descricao: text('descricao').notNull(),
  ordem: integer('ordem').notNull().default(0),
})

export const classificacoes = pgTable(
  'classificacoes',
  {
    id: serial('id').primaryKey(),
    respostaId: text('resposta_id')
      .notNull()
      .unique()
      .references(() => respostas.id, { onDelete: 'cascade' }),
    clusterDor: text('cluster_dor').notNull(),
    nivelConsciencia: text('nivel_consciencia').notNull(),
    objecaoPrincipal: text('objecao_principal').notNull(),
    citacao: text('citacao'),
    confianca: integer('confianca').notNull(),
    modelo: text('modelo').notNull(),
    revistoPorHumano: boolean('revisto_por_humano').notNull().default(false),
    revistoEm: timestamp('revisto_em', { withTimezone: true }),
    criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    idxCluster: index('idx_class_cluster').on(t.clusterDor),
    idxNivel: index('idx_class_nivel').on(t.nivelConsciencia),
    idxConfianca: index('idx_class_confianca').on(t.confianca),
  }),
)

export const execucoesAgente = pgTable('execucoes_agente', {
  id: serial('id').primaryKey(),
  clusterSlug: text('cluster_slug').notNull(),
  estado: text('estado').notNull().default('a_correr'),
  modelo: text('modelo').notNull(),
  iteracoes: integer('iteracoes').notNull().default(0),
  trace: jsonb('trace').notNull().default([]),
  criterioParagem: text('criterio_paragem'),
  erro: text('erro'),
  tokensEntrada: integer('tokens_entrada').notNull().default(0),
  tokensSaida: integer('tokens_saida').notNull().default(0),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
  concluidoEm: timestamp('concluido_em', { withTimezone: true }),
})

export const angulos = pgTable(
  'angulos',
  {
    id: serial('id').primaryKey(),
    execucaoId: integer('execucao_id')
      .notNull()
      .references(() => execucoesAgente.id, { onDelete: 'cascade' }),
    clusterSlug: text('cluster_slug').notNull(),
    posicao: integer('posicao').notNull(),
    gancho: text('gancho').notNull(),
    promessa: text('promessa').notNull(),
    prova: text('prova').notNull(),
    objecaoQueDerruba: text('objecao_que_derruba').notNull(),
    citacoes: jsonb('citacoes').notNull().default([]),
  },
  (t) => ({ idxCluster: index('idx_angulos_cluster').on(t.clusterSlug) }),
)

export const utilizadores = pgTable('utilizadores', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  palavraPasseHash: text('palavra_passe_hash').notNull(),
  nome: text('nome').notNull(),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
})
