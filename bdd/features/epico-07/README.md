# BDD — Épico 07: Comunicação e Mural de Avisos

Especificações em Gherkin (português) do comportamento esperado para a comunicação oficial da coordenação com os alunos: o mural de avisos gerenciado pelo administrador e as notificações enviadas ao smartphone do aluno.

O formato, as tags e a rastreabilidade seguem o padrão descrito em [`../epico-01/README.md`](../epico-01/README.md). As tags adicionais e a organização em blocos `Regra:` seguem o [`../epico-02/README.md`](../epico-02/README.md).

## Estrutura

```
bdd/features/epico-07/
├── HU-023.feature  (Publicação de Avisos)
└── HU-024.feature  (Recebimento de Notificações Push)
```

## Tags adicionais usadas neste épico

| Tag                 | Significado                                                                                              |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| `@nao_implementado` | Critério dos requisitos que ainda não existe no código (branches das HU-023 e HU-024); aguarda decisão do PO |
| `@conectividade`    | Cenário que depende de queda de conexão ou de entrega posterior                                           |
| `@auditoria`        | Verifica o registro no log de auditoria (RNF-013)                                                         |

## Base dos cenários

O épico ainda não está na `develop`: a aba "Avisos" do aluno é só um placeholder. Os cenários seguem o que está implementado nas branches `feature/hu-023-publicacao-de-avisos` (PR #382) e `feature/hu-024-mural-aluno-e-notificacoes` (PR #383), que têm API, telas do administrador e do aluno e notificação local. Como esse código difere bastante dos requisitos, os cenários sem tag descrevem o que existe (nomes de campos, mensagens, limites e funcionamento) e os critérios dos requisitos que ainda não existem ficam marcados com `@nao_implementado`.

## Histórias de Usuário

**HU-023: Publicação de Avisos**

- Implementado: o administrador abre "Notificações" no menu "Mais", entra em "Gerenciar Avisos", seleciona "Novo", preenche "Título" e "Descrição" e salva; o sistema exibe "Operação realizada com sucesso" e "Aviso publicado com sucesso."; o aviso aparece no mural do aluno, que também tem busca por título
- Validação: "Título é obrigatório." e "Descrição é obrigatória." (também para só espaços); título de 3 a 150 e descrição de 3 a 2000 caracteres, com as mensagens "O título deve ter pelo menos 3 caracteres.", "O título deve ter no máximo 150 caracteres.", "A descrição deve ter pelo menos 3 caracteres." e "A descrição deve ter no máximo 2000 caracteres."
- Autoria: o aviso fica associado ao administrador logado; a API responde `201`, e a publicação exige perfil de administrador (RN-006), enquanto a consulta é liberada a qualquer usuário autenticado
- Não implementado (`@nao_implementado`): edição, inativação com soft delete, aviso inativado fora do mural e auditoria (RNF-013)
- Organizado em blocos `Regra:` (publicação e consulta, edição e inativação, mural do aluno, acesso restrito)
- Cenários: 1 publicação + 1 lista + 1 busca + 1 autor (API) + 1 obrigatórios + 1 só espaços + 1 tamanho dos campos + 1 obrigatórios (API) + 4 não implementados do administrador (edição, inativação, soft delete e auditoria) + 1 mural do aluno + 1 mural atualizado + 1 busca + 1 erro de carregamento + 2 não implementados do mural (aviso inativado e edição) + 3 acesso restrito (menu, API e sem token)

**HU-024: Recebimento de Notificações Push**

- Implementado: com o aplicativo aberto, a tela do aluno consulta a API a cada 5 segundos e exibe uma notificação local do aplicativo "GOUOCE" com o título e o texto do aviso; cada evento notifica uma única vez; ao abrir o app, avisos anteriores não geram notificação e ficam no mural; ao tocar, o app abre a aba "Avisos"; sem permissão, nada é exibido e o aviso continua no mural
- API: `GET /avisos/notificacoes` devolve os eventos do mais recente para o mais antigo, com consulta incremental pelo identificador (`apos_id`) e limite de 1 a 50; a falha do disparo não desfaz a publicação do aviso
- Não implementado (`@nao_implementado`): envio por Firebase/APNs, entrega com o aplicativo fechado ou em segundo plano, retenção offline pelo serviço de mensageria, disparo na alteração de alocação (o método de realocação existe no serviço, mas nenhum fluxo o chama), abertura da Consulta de Alocação ao tocar e dados atualizados da alocação (RN-009)
- Organizado em blocos `Regra:` (aviso notificado no aparelho, eventos da API, entrega por Firebase/APNs e alteração de alocação)
- Cenários: 1 aviso notificado + 1 toque abre o mural + 1 sem repetição + 1 primeira sincronização + 1 permissão desativada + 1 solicitação de permissão + 1 cadastro pendente + 1 eventos da API + 1 consulta incremental + 1 limite + 1 referência inválida + 1 falha do disparo + 1 sem token + 7 não implementados (app fechado, mensageria, offline, alteração de alocação, só o afetado, toque na alocação e dados atualizados)

## Resumo de Cobertura

| HU     | Cenários | Esquemas | Execuções | Implementados | Não implementados |
| ------ | -------- | -------- | --------- | ------------- | ----------------- |
| HU-023 | 21       | 8        | 34        | 15            | 6                 |
| HU-024 | 20       | 3        | 25        | 13            | 7                 |
| Total  | 41       | 11       | 59        | 28            | 13                |

- Todos os critérios de aceite e fluxos alternativos de `docs/requisitos.md` (seção 7.8) têm ao menos um cenário.
- Cenários de API, soft delete, auditoria, integridade (RNF-012), confiabilidade (RNF-014) e acesso por perfil estão marcados com `@teste_api @nao_automatizavel_via_appium`.
- Arquivos validados com o parser oficial `@cucumber/gherkin`.

## Divergências encontradas entre requisitos e implementação

Os pontos abaixo estão na issue #539 de decisões do PO deste épico.

- **Edição e inativação (HU-023, AC-04, AC-05 e FA-002):** a API só publica e lista avisos (não há `PATCH` nem `DELETE`) e a tabela `aviso` não tem coluna de situação; os avisos publicados não podem ser alterados nem removidos.
- **Auditoria (HU-023, RNF-013):** a publicação não grava log de auditoria.
- **Push nativo (HU-024, AC-02, AC-04, FA-001 e RNF-014):** não há Firebase nem APNs. O aplicativo consulta a API a cada 5 segundos e exibe uma notificação local, então só notifica com o aplicativo aberto; avisos publicados com o app fechado ou sem conexão aparecem só no mural.
- **Alteração de alocação (HU-024, AC-01, AC-06 e RN-009):** o serviço tem um método de notificação de realocação ("Você foi realocado" / "Seu ônibus para hoje é o ônibus X. Toque para ver os detalhes."), mas nenhuma alteração de alocação o chama.
- **Tela ao tocar (HU-024, AC-03):** o toque sempre abre a aba "Avisos"; o requisito pede a Consulta de Alocação para mudanças de rota e de ônibus.
- **Nome e limites dos campos (HU-023):** o requisito fala em "conteúdo"; a tela e a API usam "Descrição", com título de 3 a 150 e descrição de 3 a 2000 caracteres, que os requisitos não definem.
- **Destinatários (HU-024, AC-01):** o aviso do mural não aponta para um aluno; o aplicativo notifica todo aluno autenticado com cadastro que não esteja pendente, e a história fala em "aluno afetado".
