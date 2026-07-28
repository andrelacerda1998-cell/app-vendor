# Piquet Profissional — Auditoria e Melhorias

App dos técnicos (React Native / Expo SDK 52 / expo-router). Backend Laravel partilhado com a app do cliente.
Branch: `feat/build12-parity`. Documento vivo — atualizado durante o trabalho.

---

## 1. Resumo executivo

A app funcionava, mas tinha três classes de problema que se reforçavam:

1. **Coisas partidas que ninguém via** — um crash, rotas inexistentes, e o telefone do cliente que nunca chegava à app por causa de um nome de campo errado no backend.
2. **Falhas silenciosas** — o técnico deixava de receber trabalho sem perceber porquê.
3. **Duplicação estrutural** — dois sistemas de tipografia, três ecrãs de aceitação de pedidos, quatro de histórico.

O efeito combinado era o mais caro: **sem rede, a app mostrava `0,00 €` e listas vazias indistinguíveis de dados reais**, sem um único botão de repetir em toda a aplicação.

### Estado das ferramentas de qualidade (antes → depois)

| | Antes | Depois |
|---|---|---|
| Type check | 34 erros | **15** |
| Lint | **não existia configuração** (`expo lint` abortava) | corre, **0 erros**, 336 avisos de estilo |
| Testes | **nenhum** | **90 testes, 6 suites, todos a passar** |
| Build (bundle iOS) | — | compila (6,76 MB) |

---

## 2. Mapa da aplicação

**77 rotas** em 8 grupos expo-router · **9 contextos** aninhados em 11 níveis · **79 endpoints** · **1046 chaves de texto** (pt/en idênticas).

| Fluxo | Onde vive | Estado |
|---|---|---|
| Entrada | `app/(auth)/` — 2 ecrãs | ok |
| Onboarding | `signup/` 4 passos + `(complete-profile)/` 8 → **12 ecrãs, ~23 campos** | pesado (ver §7) |
| Receber pedido | socket → `(modals)/incoming-request/` · lista → `(bottom-sheets)/(services)/requests/` | corrigido |
| Serviço em curso | `(services)/(open)/{status,progress,chat}` | núcleo sólido |
| Histórico | `(pages)/(history)` + 3 outros | disperso |
| Dinheiro | `(tabs)/history` (Ganhos) + `(pages)/(payouts)` | corrigido |
| Perfil | `(tabs)/profile` + subecrãs | ok |

**Navegação principal:** Início · Agenda · Ganhos · Perfil.
Nota: as rotas `wallet` (=Agenda) e `history` (=Ganhos) têm **nomes legados trocados** face ao que mostram. Não foram renomeadas para não partir deep links; está documentado no código.

---

## 3. Problemas encontrados

| ID | Prio | Área | Problema | Impacto | Estado |
|---|---|---|---|---|---|
| P0-1 | P0 | Ganhos | Ícone de recibos abria ecrã de detalhe sem parâmetros → `JSON.parse(undefined)` → **crash** | app rebenta | **corrigido** |
| P0-2 | P0 | Backend | `Service.php` pedia `only('name','phone',…)` mas a coluna é `phone_number` → **telefone do cliente nunca chegava à app** | técnico não conseguia ligar | **corrigido** |
| P0-3 | P0 | Sessão | `fetchAndSaveUserData` fazia `signOut()` em **qualquer** erro (timeout, 500) | expulsava o técnico a meio do trabalho | **corrigido** |
| P0-4 | P0 | Conta | "Eliminar conta" apontava para rota inexistente | RGPD por cumprir | **corrigido** |
| P0-5 | P0 | Pedidos | Socket abria o ecrã antigo (2 botões iguais, timer fixo 60s mesmo p/ agendados de 20min) | pedidos perdidos | **corrigido** |
| P0-6 | P0 | Disponibilidade | Autosave disparava no **carregamento** — abrir o ecrã escrevia sempre no servidor; com recargas apanhava **429** | disponibilidade por gravar | **corrigido** |
| P0-7 | P0 | Documentos | `expiration_date > now()` numa coluna `date` bloqueava o técnico às 00:00 do próprio dia de validade | perdia 1 dia de trabalho | **corrigido** |
| P1-1 | P1 | Pedidos | `customer_notes` existia no backend com **zero usos**; DTO só enviava "cidade, Estado" (e `", "` quando não havia rua) | aceitava às cegas | **corrigido** |
| P1-2 | P1 | Rede | Sem deteção de offline; falhas devolviam zeros credíveis; **zero botões de repetir** | dados falsos | **corrigido** |
| P1-3 | P1 | Notificações | Recusa de permissão silenciosa | deixava de receber pedidos sem saber | **corrigido** |
| P1-4 | P1 | Notificações | `notification_preferences` gravava mas **nenhum `notify()` a lia** | toggles decorativos | **corrigido** |
| P1-5 | P1 | Chat | Chave RSA falhada → chat mudo com botão de enviar ativo | julgava ter avisado o cliente | **corrigido** |
| P1-6 | P1 | Ganhos | "Já pago no total" era o total **ganho**; `ClosedPendingPayment` invisível | valor ambíguo | **corrigido** |
| P1-7 | P1 | Arranque | ~10 pedidos simultâneos no arranque; em rede fraca os críticos rebentavam | app sem dados | **corrigido** |
| P1-8 | P1 | Tipografia | `CustomText` (101 ficheiros) e `ThemedText` (30) com escalas divergentes (`subtitle` 20 vs **24**) | hierarquia errada | **corrigido** |
| P1-9 | P1 | Backend | `ServicePhotosController` usava `getFirstTemporaryUrl` no `map` → **todas as fotos devolviam o URL da primeira** | fotos trocadas | **corrigido** |
| P1-10 | P1 | Copy | 117 strings em "você" vs 52 em "tu"; `errors.title`="Erro" usado **48×** | inconsistente e inútil | **corrigido** |
| P1-11 | P1 | A11y | 2 `accessibilityLabel` p/ 211 tocáveis; `hitSlop` 0; botão de voltar 20×20 em 35 ecrãs | inutilizável com leitor de ecrã | **corrigido** |
| P1-12 | P1 | Código | `utils/campaignUtils.ts` chamava hooks dentro de funções normais | "Invalid hook call" se usado | **removido** |
| **P1-13** | **P1** | **Despacho** | **`can_accept_service` só é verificado ao ficar online. Um técnico já online com documento expirado continua a receber e aceitar pedidos até se desligar** | **regra de negócio não cumprida** | **DOCUMENTADO, não corrigido** |
| P2-1 | P2 | Extras | Extras ficavam "pendentes" para sempre — não existia lado do cliente | funcionalidade morta | **corrigido (menos pagamento)** |
| P2-2 | P2 | Agenda | Cartão abre a lista toda em vez do serviço tocado | fricção | **por fazer** (não existe ecrã de detalhe de agendado) |
| P2-3 | P2 | Código | 20 componentes/ícones sem uso, 8 rotas de API mortas, 406 imports, 72 `console.log` | ruído | **corrigido** |
| P3-1 | P3 | UI | Cartões cinzento chapado; âmbar a servir de marca **e** de alerta | Home "morta" | **corrigido** |

---

## 4. Decisões de UX

| Decisão | Motivo | Alternativas | Impacto |
|---|---|---|---|
| Cartão da Home abre o **estado** e não o mapa | do mapa era preciso entrar no estado para agir | manter | −1 toque/serviço |
| Navegação abre logo ao marcar "Estou a caminho" | é sempre o passo seguinte | botão separado | −1 toque |
| Aviso de perfil incompleto passa a **vermelho** | `warning` (#E9A23B) ≈ `brand` (#FABB5B): os dois cartões liam-se como um bloco | tornar o aviso discreto | hierarquia legível |
| Dinheiro é o **único** número em âmbar | é a razão de abrir a app | tudo branco (antes) | leitura imediata |
| Fotos e extras só com serviço **em execução** | antes de chegar não há nada para fotografar | mostrar sempre | menos ruído |
| Botões de extras **fixos** por cima do CTA | é onde a mão está durante o trabalho | no conteúdo (antes) | acesso imediato |
| "Perdidos" → **"Recusados"** | significa recusados/expirados pelo próprio, mostrado como `−X €` | manter | honestidade |
| Fotos **"Recomendado"**, nunca obrigatórias | decisão do produto | obrigar | não bloqueia conclusão |
| Cancelamentos e documentos recusados **não silenciáveis** | evitam deslocação inútil e controlam elegibilidade | respeitar toggle | dano operacional evitado |
| Analytics **sem SDK externo** | evita dependência e mantém RGPD em casa | Mixpanel/Firebase | dados em casa |

---

## 5. Terminologia oficial

| Conceito | Termo |
|---|---|
| Quem presta o serviço | **técnico** |
| Quem contrata | **cliente** |
| Antes de aceitar | **pedido** |
| Depois de aceitar | **serviço** |
| Preço-hora (tinha **5 nomes**) | **valor/hora** |
| Dinheiro recebido | **ganhos** |
| Envio para o banco | **transferência** |

Tratamento por **"tu"** em toda a app (0 ocorrências formais restantes).

---

## 6. ⚠️ Regras de negócio por validar

### 6.1 Modelo de atribuição — CONTRADIÇÃO COM O BRIEF

O brief pede terminologia de concorrência: *"mostrar interesse"*, *"a aguardar escolha do cliente"*, *"foste escolhido"*, *"pedido não atribuído"*.

**O código não funciona assim.** Em `OpenServiceController.php:173`:
```php
$vendor = $this->findVendor($request->get('vendor_id'), $isScheduled);
```
O **cliente escolhe o técnico primeiro**; o serviço nasce já dirigido a esse `vendor_id`. O técnico apenas confirma ou recusa. Não há candidatura, concorrência nem seleção posterior.

**Implementar essa terminologia seria inventar uma regra de negócio.** Mantido o comportamento e o vocabulário atuais. Precisa de decisão: manter este modelo, ou mudar para concorrência (mudança grande, começa no backend e na app do cliente).

### 6.2 Elegibilidade não revalidada no despacho (P1-13)

`can_accept_service` só é verificado em `StatusController` (ficar online).
- `VendorSearchService::filterVendor()` é `private` e **nunca chamado**.
- `AcceptService::accept()` só verifica se o serviço está pendente.

Um técnico online cujo documento expira à meia-noite continua a receber e aceitar pedidos. **Não corrigido**: toca em regras de atribuição. Recomenda-se guard em `AcceptService::accept()`, mas bloqueia imediatamente quem estiver em produção com documentos expirados — convém medir antes.

### 6.3 Extras aprovados não pagam mais ao técnico

Endpoints e notificações construídos. **Não somam** ao `amount_for_vendor`. Falta cobrar o delta ao cliente — a autorização Payshop é criada pelo valor original, logo exige 2.ª ordem de pagamento. Nenhum cálculo financeiro foi alterado.

### 6.4 Comissão da Piquet

Decisão do produto: **não expor** ao técnico. Nenhum endpoint de vendor a devolve.

---

## 7. Funcionalidades sem suporte no backend

Pedidas no brief, **impossíveis hoje** — não simuladas:

| Funcionalidade | Bloqueio |
|---|---|
| Biografia, portefólio, certificações | não existe coluna |
| Fotografia de perfil no onboarding | coleção existe, fluxo não |
| Pré-visualização do perfil público | faltam os dados acima |
| Férias, dias bloqueados, vários blocos/dia | `schedule_days` só guarda 1 intervalo/dia |
| Área de atuação por raio, limite de distância | não existe |
| Estados "em disputa", "a aguardar orçamento" | não existem no enum (15 estados) |
| Duração estimada no cartão | `services_types.time` a **NULL** nos 11 registos |
| "Acréscimo horário +30%" | backend não guarda a % aplicada por serviço |

---

## 8. Testes

- **90 testes** (6 suites): lógica pura de `money`, `requestTiming`, `fieldActions`, `serviceDetails`, `analytics` + smoke de `EmptyState`/`ErrorState`.
- **Validação manual no simulador** dos fluxos: login, Home, pedido a chegar, estado do serviço nos 3 estados, Agenda, Ganhos, Movimentos, Perfil, Documentos, Definições, Suporte, Disponibilidade, Notificações.
- **Backend provado por tinker/curl**: fronteira do último dia de validade, idempotência dos lembretes, preferências de notificação, filtro de dados pessoais no analytics, upload de fotos.

**Limitações:** sem testes E2E; internet lenta testada por acidente (dev server single-thread) e não sistematicamente; sem teste em Android.

---

## 9. Dívida técnica

- `ThemedText.tsx` sobrevive porque 9 ficheiros de onboarding ainda o usam.
- 336 avisos de lint (estilo e dependências de `useEffect`) — deixados como avisos de propósito.
- `*.module.tsx` da agenda concentram os cinzentos duplicados; trocá-los implica refazer os StyleSheets.
- Ficheiro `.swp` do vim esquecido em `components/warnings/`.
- 3 ecrãs órfãos: `(userprofile)`, `(payments)`, `(notifications-settings)`.

---

## 10. Próximos passos

**P0** — nenhum em aberto.
**P1** — decidir §6.1 (modelo de atribuição) e §6.2 (guard de elegibilidade).
**P2** — ecrã de detalhe de serviço agendado; suporte contextual dentro do serviço; migrar onboarding para `CustomText` e apagar `ThemedText`.
**P3** — testes E2E; validação em Android; preencher `services_types.time` no backoffice.
