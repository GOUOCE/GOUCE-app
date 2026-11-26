# Como executar os testes manuais de API — HU-023

Execução pela **LLM**, com revisão de **Cauan Ricardo**. [Suíte de API: 11 casos](API-HU-023.md). A [UI tem 9 casos](../ui/UI-HU-023.md) para execução manual por Cauan. Execução de 25/11/2026 na branch `test/execucao-api-hu-023`; resultados abaixo.

## Base e fontes

Planejamento na branch `test/planejamento-api-ui-hu-023`, com entrega para `develop`. Código analisado em 25/11/2026: `feature/hu-023-publicacao-de-avisos`, commit `5466b1de` ([PR #382](https://github.com/GOUOCE/GOUCE-app/pull/382) fechado sem merge), **345 commits atrás da `develop` `1bc67d02`**. Ler os [requisitos, seção 7.8](../../../../../docs/requisitos.md), o [BDD do épico 07](../../../../../bdd/features/epico-07/README.md) e as [decisões do PO na #539](https://github.com/GOUOCE/GOUCE-app/issues/539).

## 1. Preparar a execução

1. Integrar a branch de avisos na `develop` (a branch está 345 commits atrás e a migration `81` conflita); registrar o SHA do build.
2. Subir API e PostgreSQL reais em stack isolada, rodar as migrations até a head única e conferir `alembic heads`.
3. Confirmar no OpenAPI os endpoints de `/avisos` e se existem edição e inativação.
4. Obter os tokens em `POST /auth/login` e mantê-los fora do Git.

## 2. Preparar a massa

Criar os administradores A1 e A2, um aluno aprovado com vínculo válido, um aluno pendente e um representante (promovido pela HU-030). Publicar avisos pela própria API nos casos que dependem de lista. Anotar a contagem de `aviso` e de `log_auditoria` antes de cada caso.

## 3. Executar e conferir

- Comparar cada resposta com `aviso` em nova conexão e, nas recusas, com a contagem anterior.
- Conferir a mensagem de cada recusa: o texto do requisito e do BDD prevalece e a divergência com o código é registrada.
- Para a auditoria, comparar `log_auditoria` antes e depois, sem exigir formato de campo não definido.
- Para a concorrência, usar conexões simultâneas e registrar o resultado de cada uma.

## 4. Registrar e entregar

Preencher ambiente/commit, última execução, resultado obtido por variação, status, resumo, totais e defeitos. Usar ✅ passou, ❌ falhou, ⚠️ parcial, 🚫 bloqueado e ⏳ pendente; registrar a dependência específica quando impedir uma parte.

Registrar o JSON da falha no corpo das issues do GitHub, seguindo o [modelo de API](../../../modelos/ISSUE-BUG-API.md); vincular as issues à suíte e omitir credenciais, tokens e dados pessoais.

Commits seguem o [CONTRIBUTING](../../../../../docs/CONTRIBUTING.md), com autoria de Cauan e sem coautoria. Depois da revisão e integração do planejamento em `develop`, criar a branch própria de execução da HU; não registrar aprovação de caso por leitura do código.

## Riscos mapeados no código

Riscos levantados na leitura do código em 25/11/2026; nenhum foi reproduzido. A execução confirma ou descarta cada um.

| Risco | Evidência de leitura | Cobertura |
| --- | --- | --- |
| Edição e inativação não existem | `aviso_routes.py` só tem `GET /avisos`, `GET /avisos/notificacoes` e `POST /avisos`; a entidade `AvisoORM` não tem coluna de situação | API-006; API-007; UI-006 |
| Mensagem de sucesso com ponto final | o código responde “Aviso publicado com sucesso.” e o requisito traz “Aviso publicado com sucesso” | API-001; UI-002 |
| Busca por título trata `%` e `_` como curinga | `AvisoRepository.listar` usa `ilike(f"%{termo}%")` sem escapar | API-002 |
| Leitura do mural aberta a qualquer perfil autenticado | `GET /avisos` usa `verify_any_user`, que só exige estar autenticado | API-008 |
| Título normalizado antes de contar | `CriarAvisoDTO` e `_validar_titulo` reduzem espaços repetidos; um título de 151 caracteres com espaços duplos pode ser aceito | API-004 |
| Auditoria só na criação | `AvisoRepository.criar` grava `CRIAR`; o README do BDD ainda diz que não há log | API-005 |
| Migration e módulo conflitam com a `develop` | `81_create_avisos` e `81_add_updated_at_rotas` partem de `80_remove_horarios_agendamento`; `main.py`, `db.py` e `orm_registry.py` mudaram dos dois lados | API-010 |
| Lista de avisos sem paginação | `AvisoRepository.listar` faz `query.order_by(...).all()` sem limite e a tela carrega tudo de uma vez | API-011; UI-005 |
| Data de publicação em UTC | `data_criacao` é gravada com `timezone.utc` e o front acrescentou `formatarData`; um erro de fuso mostraria o dia errado perto da meia-noite | API-011; UI-005; UI-007 |
| Rótulo do menu diferente do requisito | o administrador entra por “Notificações” (“gerenciar avisos e comunicados globais”) e o requisito fala em “Mural de Avisos” ou “Comunicados” | UI-001 |
| Campos cortam o texto sem avisar | `cadastrar.tsx` usa `maxLength` de 150 e 2000 nos campos | UI-004 |
| Tela do aluno fora da barra de abas | no branch o mural está em `(aluno)/avisos.tsx`; na `develop` o item Avisos da barra é um stub em `(aluno)/(tabs)/avisos.tsx` | UI-007 |

## Dependências e critérios de bloqueio

- **Código:** o módulo de avisos não está na `develop`; sem o build integrado, toda a suíte fica bloqueada por dependência.
- **CT-006 e CT-007:** dependem de edição e inativação; sem elas a falha é esperada e deve ser registrada.
- **UI:** exige o build integrado e a massa de avisos; a LLM prepara a massa e confere API/banco depois de cada caso.
- Registrar cada parte verificada, falha ou impedimento; não aprovar caso inteiro quando houver impedimento.

## Resultado de 25/11/2026

**11 casos: 7 passaram, 3 falharam e 1 ficou parcial.** Código executado: `develop` `2e87cccc` mais o backend do `feature/hu-023-publicacao-de-avisos` (`5466b1de`), integrado só no ambiente de teste (migration renumerada para `86_create_avisos` e conflitos de `main.py` e `db.py` resolvidos mantendo os dois lados). Stack isolada `atu-exec-api-hu023`, porta 8130, PostgreSQL 15 em banco novo. Cerca de 313 chamadas HTTP, incluindo preparação e logins; evidência registrada somente dos casos que falharam.

Falhas e parcial:

- **CT-002:** a busca por título trata `%` e `_` como curinga (`ilike` sem escapar) e devolve todos os avisos.
- **CT-006 e CT-007:** não existem rotas de editar nem de inativar (404) e a tabela não tem coluna de situação; são lacunas conhecidas, decisão 1 do PO ([#539](https://github.com/GOUOCE/GOUCE-app/issues/539)).
- **CT-010 (parcial):** com a numeração original do branch há duas heads e `alembic upgrade head` falha; depois de renumerar, tudo passa.

Observações dos casos aprovados: mensagem de sucesso com ponto final (CT-001); JSON inválido responde com “JSON decode error” em inglês (CT-003); título de 151 caracteres brutos com espaços duplos é aceito e gravado com 150 (CT-004); o README do BDD diz que não há auditoria, mas o código grava `CRIAR` (CT-005); `GET /avisos` responde 200 para aluno pendente e representante (CT-008); a lista não tem paginação, 796 KB com 224 avisos, e o fuso depende de o PostgreSQL rodar em America/Fortaleza (CT-011).
