# Como executar os testes manuais de API — HU-024

Execução pela **LLM**, com revisão de **Cauan Ricardo**. [Suíte de API: 9 casos](API-HU-024.md). A [UI tem 10 casos](../ui/UI-HU-024.md) para execução manual por Cauan. Execução de 25/11/2026 na branch `test/execucao-api-hu-024`; resultados abaixo.

## Base e fontes

Planejamento na branch `test/planejamento-api-ui-hu-024`, com entrega para `develop`. Código analisado em 25/11/2026: `feature/hu-024-mural-aluno-e-notificacoes`, commit `e15f398a` ([PR #383](https://github.com/GOUOCE/GOUCE-app/pull/383) fechado sem merge), **345 commits atrás da `develop` `1bc67d02`**. Ler os [requisitos, seção 7.8](../../../../../docs/requisitos.md), o [BDD do épico 07](../../../../../bdd/features/epico-07/README.md) e as [decisões do PO na #539](https://github.com/GOUOCE/GOUCE-app/issues/539).

## 1. Preparar a execução

1. Integrar as duas branches na `develop` (a HU-024 contém a HU-023); registrar o SHA do build e renumerar a migration `81_create_avisos`.
2. Subir API e PostgreSQL reais em stack isolada, com um só processo, e conferir `alembic heads`.
3. Confirmar no OpenAPI `GET /avisos/notificacoes` e procurar endpoints de dispositivo ou de envio de push.
4. Obter os tokens em `POST /auth/login` e mantê-los fora do Git.

## 2. Preparar a massa

Criar a massa da HU-023 (administrador e avisos) e a das HU-016 e HU-019 (alunos A e B com reservas em D+1 e distribuição). Preparar por fixture os alunos pendente, reprovado e com vínculo vencido depois de reservar e alocar como aprovados. Anotar o estado do buffer (consultar `/avisos/notificacoes`) antes de cada caso.

## 3. Executar e conferir

- Comparar cada resposta com `aviso` e `minha-viagem` em conexões novas.
- Conferir a mensagem e o tipo de cada evento; o texto do requisito prevalece e a divergência é registrada.
- Para o buffer em memória, comparar a resposta antes e depois do reinício e com um e dois processos.
- Não aprovar caso por leitura do código; registrar cada peça que falta.

## 4. Registrar e entregar

Preencher ambiente/commit, última execução, resultado obtido por variação, status, resumo, totais e defeitos. Usar ✅ passou, ❌ falhou, ⚠️ parcial, 🚫 bloqueado e ⏳ pendente; registrar a dependência específica quando impedir uma parte.

Registrar o JSON da falha no corpo das issues do GitHub, seguindo o [modelo de API](../../../modelos/ISSUE-BUG-API.md); vincular as issues à suíte e omitir credenciais, tokens e dados pessoais.

Commits seguem o [CONTRIBUTING](../../../../../docs/CONTRIBUTING.md), com autoria de Cauan e sem coautoria. Depois da revisão e integração do planejamento em `develop`, criar a branch própria de execução da HU; não registrar aprovação de caso por leitura do código.

## Riscos mapeados no código

Riscos levantados na leitura do código em 25/11/2026; nenhum foi reproduzido. A execução confirma ou descarta cada um.

| Risco | Evidência de leitura | Cobertura |
| --- | --- | --- |
| Notificações só com o aplicativo aberto (push nativo ausente) | `avisoService.ts` consulta a API e cria uma notificação local; não há Firebase, APNs nem token de dispositivo | API-009; UI-005; UI-006 |
| Alteração de alocação nunca dispara | `disparar_realocacao_onibus` não tem chamadores em todo o backend | API-004; API-005; UI-004 |
| Toque sempre abre o Mural de Avisos | `(aluno)/_layout.tsx` faz `router.push('/(aluno)/avisos')` para qualquer notificação | UI-003; UI-004 |
| Cursor único mistura ids de aviso e de realocação | ids de realocação começam em 1.000.001 e `listar_eventos_recentes` filtra por `id > apos_id` para os dois tipos | API-006 |
| Buffer em memória do processo | `_eventos = deque(maxlen=100)` na classe; com o buffer aquecido, `listar_notificacoes` ignora os avisos do banco; cada processo tem o seu buffer | API-007 |
| Evento sem destinatário | o evento não guarda o aluno; `GET /avisos/notificacoes` usa `verify_any_user` e entrega o mesmo a qualquer perfil | API-002; API-004; API-008 |
| Exclusão de destinatários só no cliente e só do “pendente” | `deveMonitorarNotificacoes` ignora apenas `status === 'pendente'`; reprovado (“rejeitado”) e vínculo vencido continuam monitorando | API-002; UI-008 |
| Permissão negada pode ser tratada como concedida | `configurarPermissoesNotificacaoNativa` devolve `true` quando a chamada nativa falha | UI-007 |
| Até 5 notificações por consulta de 5 segundos | o cliente pede `limite=5` e avança o cursor para o maior id; numa rajada de avisos os intermediários se perdem | UI-009 |
| Erros da consulta são engolidos, inclusive a sessão expirada | o `catch` do monitoramento em `(aluno)/_layout.tsx` ignora qualquer erro de rede ou 401, sem avisar o aluno | UI-010 |
| Layout do aluno do branch incompatível com a `develop` | o branch troca `(aluno)/_layout.tsx` por um layout de abas com o monitoramento; a `develop` usa `Stack` com `(tabs)` e tratamento de `rejeitado` | UI-002; UI-003; UI-008 |

## Dependências e critérios de bloqueio

- **Código:** o serviço de notificação e a tela do aluno não estão na `develop`; sem o build integrado, toda a suíte fica bloqueada.
- **HU-023:** a publicação de avisos é pré-requisito dos casos de disparo; edição e inativação, quando existirem, habilitam o CT-003.
- **HU-016 e HU-019:** a alteração de alocação depende da distribuição manual; sem o gatilho, os CT-004 e CT-005 ficam bloqueados.
- **Push real:** exige aparelho físico com o app instalado e o Firebase ou APNs configurados; a versão web só usa a notificação do navegador, com o app aberto.
- Registrar cada parte verificada, falha ou impedimento; não aprovar caso inteiro quando houver impedimento.

## Resultado de 25/11/2026

**9 casos: 2 passaram, 5 falharam e 2 ficaram bloqueados.** Código executado: `develop` `2e87cccc` mais o backend do `feature/hu-024-mural-aluno-e-notificacoes` (`e15f398a`), integrado só no ambiente de teste (migration renumerada para `86_create_avisos` e conflitos de `main.py` e `db.py` resolvidos). Stack isolada `atu-exec-api-hu024`, porta 8131, PostgreSQL 15 em banco novo. Evidência registrada somente dos casos que falharam.

- **CT-002:** o evento do aviso é entregue a qualquer perfil autenticado, inclusive pendente, reprovado, com vínculo vencido, representante e administrador.
- **CT-004:** a mudança de ônibus não gera nenhuma notificação (decisão 4 do PO); **CT-005** fica bloqueado por isso, e o **CT-003**, por falta de editar e inativar avisos.
- **CT-006:** o cursor único perde avisos depois de um evento de realocação (reproduzido no teste unitário do serviço), e duas mensagens de validação vêm em inglês.
- **CT-007:** depois de reiniciar a API, publicar antes de qualquer consulta esconde os avisos anteriores (a consulta devolveu só o aviso novo), e com dois processos a mesma consulta deu três respostas diferentes.
- **CT-009:** não há push nativo, token de dispositivo, Firebase nem APNs (decisão 3 do PO).
