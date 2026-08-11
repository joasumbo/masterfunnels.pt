# Pesquisa de audiência — Master Funnels

Isto pega nas respostas de uma pesquisa pré-lançamento e devolve, sem ninguém ter de ler as 112 à mão, os temas que se repetem, o estado de consciência de quem respondeu, as objeções que travam a compra, e ângulos de anúncio escritos a partir de frases reais.

São quatro peças: a landing que recolhe, a ingestão que classifica, o painel onde a equipa lê, e um agente que pega num cluster e devolve cinco ângulos.

## Onde está

| | |
|---|---|
| Landing | https://masterfunnels.vercel.app |
| Painel | https://masterfunnels.vercel.app/painel |
| Repositório | https://github.com/joasumbo/masterfunnels.pt |
| Utilizador de teste | `avaliacao@masterfunnels.pt` |
| Palavra-passe | enviada à parte |

## Correr localmente

Node 22, uma base Postgres na Neon e uma chave do Gemini.

```bash
npm install

cp .env.example .env
# DATABASE_URL, GEMINI_API_KEY, JWT_SEGREDO, ADMIN_EMAIL, ADMIN_PASSWORD
cp .env apps/api/.env

npm run db:push --workspace apps/api
npm run semear --workspace apps/api
```

A partir daqui a base está vazia. Para a encher pela ordem certa:

```bash
npm run importar --workspace apps/api     # as 112 linhas do CSV
npm run taxonomia --workspace apps/api    # descobre os clusters
npm run classificar --workspace apps/api  # classifica tudo contra eles
npm run angulos --workspace apps/api      # corre o agente no cluster maior
```

Dois terminais e está a andar:

```bash
npm run dev --workspace apps/api    # http://localhost:3001
npm run dev --workspace apps/web    # http://localhost:5173
```

## Como está dividido

```
apps/web         React, Vite, Tailwind. Landing e painel.
apps/api         Fastify, Drizzle, os scripts de ingestão e o agente.
packages/shared  Zod e tipos, partilhados pelas duas pontas.
```

O `packages/shared` nasceu de uma frase do enunciado: os campos da landing têm de bater certo com o CSV, porque as respostas novas caem na mesma tabela das importadas. Os seis escalões de rendimento, as três respostas de `ja_investiu` e as seis origens estão escritos uma vez só. O mesmo objeto valida o formulário no browser, valida o corpo do pedido na API e tipa o importador. Mexer num valor parte a compilação nos três sítios ao mesmo tempo, que é exactamente o que eu quero que aconteça.

Escolhi um servidor a sério em vez de funções serverless por causa do agente. O ciclo de ferramentas faz seis a dez chamadas encadeadas ao modelo e estoira o tempo de execução de uma função.

## O que encontrei no ficheiro antes de escrever código

Abri o CSV e li-o antes de decidir seja o que for. Ainda bem.

Há 16 sítios onde os campos de perfil contradizem o que a pessoa escreveu. O texto *"Sou reformado, tenho 68 anos, quero rendimento e não crescimento"* aparece colado às idades 26, 41, 35, 24 e 41. A R0001 diz `idade=22` e no texto escreve "tenho 24 anos". Não é ruído aleatório de gente a mentir num formulário: são textos reaproveitados com demográficos atirados por cima.

Isto mudou duas decisões.

A primeira é que a classificação lê só os três campos de texto. O prompt proíbe explicitamente olhar para idade, rendimento ou origem, e diz porquê. Se deixasse o modelo ver aquilo, o nível de consciência vinha contaminado.

A segunda é o cruzamento por rendimento. O enunciado pede pelo menos um cruzamento útil e dá o rendimento como exemplo, por isso ele está lá. Só que não significa nada, e o painel diz isso por baixo da matriz. O cruzamento que presta é cluster contra nível de consciência, porque as duas dimensões saem do texto. Preferi mostrar os dois e ser franco sobre a diferença do que servir uma matriz bonita e vazia.

## De onde vêm os clusters

O enunciado diz que devem emergir da abordagem ao problema, não de uma lista que eu escrevi. Fiz em duas passagens.

Na primeira, descoberta. Das 112 respostas há só 33 dificuldades distintas, portanto mando as 33 com a frequência de cada uma e peço a taxonomia canónica. O critério que dei ao modelo foi este: duas respostas ficam no mesmo cluster se o mesmo anúncio as convencesse. Saíram dez, gravados na tabela `clusters`.

Na segunda, classificação contra essa taxonomia já fixa, com os slugs como enumeração fechada no esquema de saída. O modelo não pode inventar um cluster a meio do lote, e as contagens do painel ficam estáveis.

Pensei em fazer clustering por embeddings e não fiz. Com 33 textos distintos, o agrupamento semântico dá grupos que não correspondem a decisões de escrita: junta "tenho medo de perder dinheiro" com "tenho dinheiro parado" porque as duas frases falam de dinheiro, quando são dores opostas que pedem anúncios opostos.

## As citações

O enunciado quer um excerto literal, utilizável num anúncio. Pedir ao modelo que não invente não chega, portanto depois de cada classificação o código vai confirmar que a frase existe mesmo, letra a letra, num dos três campos daquela resposta, com acentos e maiúsculas normalizados. Se não existir, a citação é deitada fora e a confiança cai para 45.

Nas 112 não foi rejeitada nenhuma. A verificação fica na mesma, porque é ela que garante que isto continua verdade quando entrarem respostas novas pela landing.

A confiança é a que o modelo reporta, com dois tectos por cima: citação não literal limita a 45, resposta sem sinal nos campos opcionais limita a 55. Ficou em 90 de média, com uma única resposta abaixo de 60. O painel ordena cada cluster por confiança ascendente, para o que provavelmente correu mal ser a primeira coisa que se vê.

## A landing

Uma pergunta por ecrã, com transição de entrada e saída. É mais lento de construir do que um formulário empilhado, mas responde-se mais e escreve-se mais em cada campo, e o que este projecto precisa é de texto livre com substância.

Só a primeira pergunta é obrigatória. Isto não é preguiça: no CSV há sete respostas com `ja_tentou` em branco, três com "nada" e cinco com `o_que_faria_comprar` a "-". Se exigisse as três, ficava com uma tabela onde as linhas novas seguem regras diferentes das importadas.

Contra robôs há um campo escondido que nenhum humano preenche, o tempo entre abrir e submeter, e um limite por IP na API. Sem serviços externos. O enunciado pede protecção mínima e não me apetecia meter uma dependência de terceiros numa coisa que se resolve em vinte linhas.

## O painel

Barra lateral escura com a marca, área de trabalho clara. A landing é preta e dourada porque é a cara da Master Funnels; o painel é uma ferramenta de trabalho e lê-se melhor em claro.

Na visão geral estão os indicadores, o peso dos clusters num donut clicável, a consciência e as objeções em gráfico, e os dois cruzamentos.

A página de respostas tem as 112 em tabela, com a data e hora de cada uma, procura no texto, filtros por cluster, consciência e origem, e um atalho para as duvidosas. Clicar abre uma gaveta com a resposta inteira, a citação destacada, o perfil, e se veio do CSV ou da landing.

Abrir um cluster dá as respostas com a citação em destaque e um botão para corrigir a classificação sem sair dali. A correcção marca `revisto_por_humano` e passa a aparecer assinalada.

Exporta-se um cluster só com as citações, ou o conjunto todo com as colunas originais do CSV mais as oito da classificação. Este segundo leva marca de ordem de bytes e a dica de separador, senão o Excel em português despeja tudo na coluna A.

A autenticação é um JWT assinado com `jose` num cookie httpOnly e a palavra-passe em bcrypt. Não tem recuperação de conta nem gestão de utilizadores, mas nenhum endpoint do painel responde sem ela.

## O agente

O enunciado é claro nisto: *"não é apenas um prompt. Esperamos um agente capaz de decidir autonomamente que informação consultar e quando terminar."*

Por isso não lhe dou os dados do cluster no prompt. Dou-lhe ferramentas e ele que se governe.

| Ferramenta | O que devolve |
|---|---|
| `panorama_do_cluster` | Tamanho, distribuição por consciência, objeções por peso, o cluster face aos outros |
| `ler_respostas` | Respostas na íntegra, paginadas, por confiança |
| `procurar_citacoes` | Excertos que contêm um termo, para caçar uma frase sobre um medo ou um número |
| `respostas_por_objecao` | Filtra o cluster por objeção |
| `verificar_citacao` | Confirma que um excerto existe letra a letra e devolve o `resposta_id` |
| `entregar_angulos` | Entrega e termina |

Sobre quando parar, a regra é ter cinco ângulos, cinco objeções distintas e todas as citações confirmadas. Mas isso não fica na palavra dele. Quando entrega, o servidor valida antes de aceitar: conta os ângulos, verifica que as objeções não se repetem, e vai ver se cada citação existe mesmo no texto original. Se falhar alguma coisa, a entrega é recusada e o motivo volta para ele como resultado da ferramenta, para ir buscar outra citação em vez de insistir na mesma. Dez iterações de tecto, por segurança.

É isto que separa um agente de um prompt bem escrito: pode falhar a entrega e tem de se safar sozinho.

Cada execução deixa gravado na tabela `execucoes_agente` a sequência de ferramentas com argumentos e duração, o critério de paragem escrito por ele, as iterações e os tokens. O painel mostra esse rasto ao lado dos ângulos, para se poder discordar do resultado com o processo à frente.

A execução que está entregue foi no cluster *Não Sei Por Onde Começar*, o maior, com 22 das 112 respostas:

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

O passo 6 é o que me interessa. Ele tinha citações para quatro ângulos e faltava-lhe material para a objeção do tempo. Em vez de ler mais dez respostas à sorte, foi procurar pelo termo. Isso é uma decisão, não um passo de guião.

## O que ficou de fora

Só gerei ângulos para um cluster. O enunciado pede pelo menos um e o botão está no painel para gerar os outros à frente de quem avaliar. Correr os dez de enfiada gastava quota do plano gratuito para mostrar exactamente a mesma coisa dez vezes.

As objeções ficaram em texto livre normalizado. Deram 51 distintas, e algumas são a mesma coisa dita de duas maneiras. O tratamento em duas passagens que dei aos clusters resolvia isto e não tive tempo.

Não há testes automatizados. Verifiquei ponta a ponta com pedidos reais à API e os números deste ficheiro saíram de lá, mas se isto continuasse a primeira coisa que eu escrevia era um teste ao verificador de citações literais, que é a peça de que mais depende a credibilidade do resto.

Criar ou renomear clusters faz-se por script, não pelo painel. Mudar uma resposta de cluster faz-se no painel.

Guardo que uma classificação foi revista e quando, não o que lá estava antes.

## O que faria a seguir

Busca vectorial, mas só quando fizer sentido. Com 112 respostas o corpus inteiro cabe no contexto e o agente vai buscar o que precisa directamente, não há nada para recuperar. E as citações têm de ser literais: a busca por similaridade devolve vizinhos semânticos, não texto igual, portanto para garantir que a frase existe letra a letra continuo a precisar de correspondência exacta, que é uma operação de base de dados. Isto muda com milhares de respostas acumuladas de várias campanhas, quando o agente quiser citações comparáveis de lançamentos anteriores. A Neon já traz `pgvector`, o caminho está aberto.

Avaliação da classificação. Neste momento a única defesa contra um erro do modelo é a confiança e a revisão humana. Com cem respostas classificadas à mão dava para medir a concordância e apanhar regressões ao mudar de modelo ou de prompt.

Histórico das correcções, para se poder ver o que a equipa discordou e usar isso para afinar o prompt.

## Serviços e custos

| Serviço | Para quê | Custo |
|---|---|---|
| Google Gemini | Taxonomia, classificação e agente | Plano gratuito |
| Neon | Postgres | Plano gratuito |
| Vercel | Landing e painel | Plano gratuito |

Nada a reembolsar.

Uma nota sobre o modelo: comecei na OpenAI e a conta não tinha saldo. Passei para o Gemini e os modelos Pro têm quota zero no plano gratuito. Tudo isto corre em `gemini-2.5-flash`. Com orçamento, a classificação ficava na mesma e o agente é que ganhava com um modelo de raciocínio mais forte.
