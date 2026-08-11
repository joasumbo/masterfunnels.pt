# Master Funnels — pesquisa de audiência

Ferramenta que pega nas respostas em texto livre de uma pesquisa pré-lançamento e devolve, sem ninguém ler tudo à mão, os grandes temas, o estado de consciência das pessoas, as objeções que se repetem, e ângulos de anúncio fundamentados em frases reais.

São quatro peças: a landing que capta, a classificação, o painel que a equipa lê, e um agente que transforma um cluster em cinco ângulos.

## Endereços

| | |
|---|---|
| Landing | *a preencher no envio* |
| Painel | *a preencher no envio* |
| Utilizador de teste | `avaliacao@masterfunnels.pt` |
| Palavra-passe | *enviada em separado* |

## Como correr

Precisas de Node 22, uma base de dados Postgres na Neon e uma chave da API do Gemini.

```bash
npm install

cp .env.example .env
# preenche DATABASE_URL, GEMINI_API_KEY, JWT_SEGREDO e ADMIN_PASSWORD

cp .env apps/api/.env
cp apps/web/.env.example apps/web/.env

npm run db:push --workspace apps/api      # cria as tabelas
npm run semear --workspace apps/api       # cria o utilizador do painel

npm run importar --workspace apps/api     # 112 respostas do CSV para a base de dados
npm run taxonomia --workspace apps/api    # descobre os clusters de dor
npm run classificar --workspace apps/api  # classifica as 112 respostas
npm run angulos --workspace apps/api      # corre o agente sobre o cluster com mais peso
```

Depois, em dois terminais:

```bash
npm run dev --workspace apps/api    # API em http://localhost:3001
npm run dev --workspace apps/web    # landing em http://localhost:5173, painel em /painel
```

## Como está montado

```
apps/web        React, Vite, TypeScript, Tailwind. Landing pública e painel.
apps/api        Node, Fastify, TypeScript. API, scripts de ingestão e o agente.
packages/shared Schemas Zod e tipos usados pelas duas pontas.
```

O `packages/shared` existe por causa de uma frase do enunciado: *"os campos têm de bater certo com o CSV, porque as respostas novas caem na mesma tabela das importadas"*. Os seis escalões de rendimento, as três respostas de `ja_investiu` e as seis origens estão declarados uma vez só, e são o mesmo objeto que valida o formulário no browser, valida o corpo do pedido na API e tipa o import do CSV. Se alguém mexer num valor, o TypeScript parte nos três sítios ao mesmo tempo. Na importação das 112 linhas não houve uma única violação dos enums, o que confirma que o contrato corresponde ao ficheiro original.

Backend separado, e não funções serverless, por causa do agente: o ciclo de ferramentas faz seis a dez chamadas encadeadas ao modelo e ultrapassaria o limite de execução de uma função.

## Decisões, e porquê

### Os campos de perfil contradizem o texto — e isso mudou a classificação

Ao ler o CSV antes de escrever código encontrei 16 contradições diretas entre os campos demográficos e o que a pessoa escreve. O texto *"Sou reformado, tenho 68 anos, quero rendimento e não crescimento"* aparece associado às idades 26, 41, 35, 24 e 41. A resposta R0001 tem `idade=22` e diz *"tenho 24 anos"*. Os demográficos foram atribuídos de forma aleatória a um conjunto de textos reutilizados.

Duas consequências:

**A classificação usa apenas os três campos de texto.** O prompt proíbe explicitamente o uso de idade, rendimento e origem, e explica porquê. Se deixasse o modelo ver os demográficos, o nível de consciência ficava contaminado por ruído.

**O cruzamento cluster contra rendimento é ruído, e o painel di-lo.** O enunciado pede pelo menos um cruzamento útil e dá o rendimento como exemplo, por isso ele está lá. Mas o cruzamento com sinal real é cluster contra nível de consciência, porque ambos derivam do texto — e o painel tem uma nota discreta a dizê-lo. Preferi mostrar os dois e ser honesto sobre a diferença do que apresentar uma matriz bonita que não significa nada.

### Os clusters saem dos dados, não da minha cabeça

O enunciado diz que os clusters devem surgir da abordagem ao problema. Fiz em duas passagens.

Primeiro, uma passagem de descoberta: das 112 respostas há apenas 33 dificuldades distintas, por isso mando as 33 com a respetiva frequência ao modelo e peço-lhe a taxonomia canónica, com o critério explícito de que duas respostas ficam no mesmo cluster se o mesmo anúncio as convencesse. Saíram dez clusters, gravados na tabela `clusters`.

Depois, a classificação corre contra essa taxonomia fixa, com os slugs como enumeração fechada no esquema de saída. O modelo não pode inventar um cluster novo a meio das 112, o que mantém as contagens do painel estáveis.

Podia ter feito clustering por embeddings. Não fiz porque com 33 textos distintos o agrupamento semântico dá grupos que não correspondem a decisões de escrita — junta "tenho medo de perder dinheiro" com "tenho dinheiro parado" por ambos falarem de dinheiro, quando são dores opostas que exigem anúncios opostos.

### As citações são verificadas contra o texto original

O enunciado pede que a citação seja um excerto literal. Pedir ao modelo não chega, por isso depois de cada classificação o código confirma que a citação existe mesmo, letra a letra, num dos três campos daquela resposta, com acentos e maiúsculas normalizados. Se não existir, a citação é descartada e a confiança desce para 45.

Nas 112 respostas não houve uma única citação rejeitada. A verificação fica na mesma, porque é o que garante que continua verdade quando entrarem respostas novas.

### Confiança e revisão humana

A confiança é o que o modelo reporta, corrigida por duas regras: citação não literal limita a 45; resposta sem sinal nos campos `ja_tentou` e `o_que_faria_comprar` limita a 55. O painel ordena as respostas de um cluster por confiança ascendente, portanto o que o modelo provavelmente errou aparece primeiro. Confiança média de 90, uma resposta abaixo de 60.

### Sujidade do ficheiro

Sete respostas com `ja_tentou` em branco, três com "nada", cinco com `o_que_faria_comprar` a "-". Esses valores entram como nulos. Por isso, na landing, só a primeira pergunta é obrigatória: exigir as três criaria uma tabela onde as linhas novas seguem regras diferentes das importadas.

### Proteção contra submissões automáticas

Campo escondido que um humano nunca preenche e um robô sim, mais o tempo entre abrir e submeter o formulário, mais limite por IP na API. Sem serviços externos, porque o enunciado pede proteção mínima e não quis acrescentar uma dependência de terceiros a uma coisa que se resolve em vinte linhas.

## O agente

O enunciado é explícito: *"não é apenas um prompt. Esperamos um agente capaz de decidir autonomamente que informação consultar e quando terminar."* Por isso o agente não recebe os dados do cluster no prompt. Recebe **ferramentas** e decide sozinho o que consultar.

**As ferramentas que tem:**

| Ferramenta | O que devolve |
|---|---|
| `panorama_do_cluster` | Tamanho, distribuição por nível de consciência, objeções por peso, e o cluster face aos outros |
| `ler_respostas` | Respostas na íntegra, com paginação, ordenadas por confiança |
| `procurar_citacoes` | Excertos que contêm um termo, para caçar frases sobre um medo ou um número concreto |
| `respostas_por_objecao` | Filtra o cluster por objeção, para fundamentar o ângulo que a derruba |
| `verificar_citacao` | Confirma que um excerto existe letra a letra e devolve o `resposta_id` de origem |
| `entregar_angulos` | Entrega e termina |

**Critério de paragem.** O agente só pode chamar `entregar_angulos` quando tiver cinco ângulos, cinco objeções distintas e todas as citações confirmadas. Mas o critério não fica ao critério dele: quando entrega, o servidor valida antes de aceitar — confere que são exatamente cinco, que as objeções não se repetem, e que cada citação existe mesmo no texto original. Se alguma falhar, a entrega é **rejeitada** e o motivo volta para o agente como resultado da ferramenta, para ele ir buscar outra citação em vez de insistir. Há um limite de dez iterações como rede de segurança.

Isto é o que separa o agente de um prompt: ele pode falhar a entrega e tem de recuperar sozinho.

**O que ficou gravado.** Cada execução guarda na tabela `execucoes_agente` a sequência completa de ferramentas consultadas, com argumentos e duração, o critério de paragem escrito pelo próprio agente, as iterações e os tokens. O painel mostra esse rasto ao lado dos ângulos.

**A execução que está entregue** — cluster *Não Sei Por Onde Começar*, o de maior peso com 22 das 112 respostas:

```
1. panorama_do_cluster    22 respostas, 16 objecoes distintas
2. ler_respostas          10 respostas lidas (de 22)
3. verificar_citacao      citacao valida em R0004
4. verificar_citacao      citacao valida em R0013
5. verificar_citacao      citacao valida em R0078
6. procurar_citacoes      "tempo": 2 excerto(s)
7. verificar_citacao      citacao valida em R0077
8. verificar_citacao      citacao valida em R0078
9. entregar_angulos       entrega aceite
```

Nove iterações, 33,7 segundos, 23.988 tokens de entrada e 944 de saída.

Vale a pena reparar no passo 6. Depois de ler dez respostas, o agente tinha citações para quatro ângulos mas faltava-lhe material para a objeção do tempo — então foi procurar pelo termo "tempo" em vez de ler mais respostas às cegas. É esse tipo de decisão que o enunciado está a pedir.

Nas palavras dele, sobre porque parou:

> *"Consultei o panorama_do_cluster para identificar as objeções mais frequentes e o tamanho do cluster. Li as primeiras 10 respostas para captar a voz dos utilizadores. Procurei citações específicas para a objeção 'Falta de tempo'. Todas as citações usadas nos cinco ângulos foram verificadas individualmente, garantindo a sua autenticidade e origem no cluster."*

## O que ficou de fora

*a preencher no envio*

## O que faria a seguir

**Busca vetorial quando o corpus crescer.** Com 112 respostas o corpus inteiro cabe no contexto e o agente lê o que precisa diretamente — não há nada para recuperar. Além disso, as citações têm de ser literais, e a busca por similaridade devolve vizinhos semânticos, não texto igual; para garantir que a frase existe letra a letra preciso de correspondência exata, que é uma operação de base de dados. Com milhares de respostas acumuladas em várias campanhas, o agente vai querer citações comparáveis de lançamentos anteriores e aí o corpus deixa de caber. A Neon já tem `pgvector` disponível, portanto o caminho está aberto.

**Avaliação da classificação.** Neste momento a única defesa contra um erro do modelo é a confiança e a revisão humana. Com um conjunto de cem respostas classificadas à mão dava para medir a concordância e detetar regressões ao mudar de modelo ou de prompt.

**Separar as objeções em taxonomia fixa.** As objeções são hoje texto livre normalizado para minúsculas. Funcionam, mas duas formulações da mesma objeção contam como duas. O mesmo tratamento em duas passagens que dei aos clusters resolvia isto.

## Serviços usados e custos

| Serviço | Para quê | Custo |
|---|---|---|
| Google Gemini | Taxonomia, classificação das 112 respostas e agente | Tier gratuito |
| Neon | Base de dados Postgres | Tier gratuito |
| Vercel | Alojamento da landing e do painel | Tier gratuito |

Sem custos a reembolsar.

Nota sobre a escolha do modelo: comecei com a OpenAI, mas a conta não tinha saldo, e os modelos Pro do Gemini têm quota zero no tier gratuito. Todo o trabalho corre em `gemini-2.5-flash`. Com orçamento, a classificação ficava igual e o agente beneficiava de um modelo de raciocínio mais forte.
