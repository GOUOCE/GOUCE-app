# BDD — Épico 07: Comunicação e Mural de Avisos

Especificações em Gherkin (português) do comportamento esperado para a comunicação oficial da coordenação com os alunos: o mural de avisos gerenciado pelo administrador e as notificações push enviadas ao smartphone do aluno.

O formato, as tags e a rastreabilidade seguem o padrão descrito em [`../epico-01/README.md`](../epico-01/README.md). As tags adicionais e a organização em blocos `Regra:` seguem o [`../epico-02/README.md`](../epico-02/README.md).

## Estrutura

```
bdd/features/epico-07/
├── HU-023.feature  (Publicação de Avisos)
└── HU-024.feature  (Recebimento de Notificações Push)
```

## Tags adicionais usadas neste épico

| Tag              | Significado                                                              |
| ---------------- | ------------------------------------------------------------------------ |
| `@conectividade` | Cenário que depende de queda de conexão ou de entrega posterior (FA-001) |
| `@auditoria`     | Verifica o registro no log de auditoria (RNF-013)                        |

## Histórias de Usuário

**HU-023: Publicação de Avisos**

- Fluxo: o administrador abre "Mural de Avisos", seleciona "Novo Aviso", preenche título e conteúdo e aciona "Publicar"; o sistema exibe "Aviso publicado com sucesso" e o aviso aparece no mural do aluno
- Validação: título e conteúdo obrigatórios, inclusive quando preenchidos só com espaços (FA-001); a API recusa a publicação sem os campos
- Edição e inativação: a mudança aparece imediatamente no mural do aluno; a inativação é soft delete e o aviso inativado deixa de ser exibido (FA-002)
- Autoria e auditoria: o aviso fica associado ao administrador logado (AC-03) e as operações de escrita são registradas no log (RNF-013)
- Acesso (RN-006): só o administrador gerencia avisos; o aluno apenas lê o mural
- Organizado em blocos `Regra:` (gerenciamento pelo administrador, mural do aluno, acesso restrito)
- Cenários: 1 publicação + 1 lista + 1 autor (API) + 1 obrigatórios + 1 só espaços + 1 obrigatórios (API) + 1 edição + 1 inativação + 1 soft delete + 1 auditoria + 1 avisos no mural do aluno + 1 aviso inativado + 1 mural vazio + 1 edição visível ao aluno + 3 acesso restrito (menu, API e sem token)

**HU-024: Recebimento de Notificações Push**

- Fluxo: a publicação de um aviso ou a alteração de última hora na alocação do aluno (ônibus ou rota) faz a API montar a notificação e enviá-la ao serviço de mensageria (Firebase ou APNs), que a entrega ao aparelho
- Recebimento: o alerta aparece com o aplicativo fechado ou em segundo plano; ao tocar, o app abre no Mural de Avisos (aviso) ou na Consulta de Alocação (mudança de rota ou ônibus)
- Offline (FA-001): o serviço de mensageria retém a notificação e entrega quando a conexão volta
- Permissão desativada (FA-002): a notificação não aparece e o aluno vê o aviso ao abrir o Mural
- Dados atualizados (RN-009): a notificação e a consulta refletem a alocação mais recente
- Organizado em blocos `Regra:` (disparo, recebimento no aparelho)
- Cenários: 1 aviso + 1 alteração de alocação + 1 só o aluno afetado + 1 dados atualizados (API) + 1 disparo a cada evento (API) + 1 app fechado ou em segundo plano + 1 tela aberta ao tocar + 1 aviso no mural + 1 offline + 1 permissão desativada + 1 solicitação de permissão

## Resumo de Cobertura

| HU     | Cenários | Esquemas | Execuções |
| ------ | -------- | -------- | --------- |
| HU-023 | 17       | 6        | 24        |
| HU-024 | 11       | 4        | 16        |
| Total  | 28       | 10       | 40        |

- Todos os critérios de aceite e fluxos alternativos de `docs/requisitos.md` (seção 7.8) têm ao menos um cenário.
- Cenários de API, soft delete, auditoria, integridade (RNF-012), confiabilidade (RNF-014) e acesso por perfil estão marcados com `@teste_api @nao_automatizavel_via_appium`.
- Os cenários seguem os requisitos; os códigos de status de API seguem o padrão dos outros épicos e devem ser confirmados na implementação.
- Arquivos validados com o parser oficial `@cucumber/gherkin`.

## Divergências entre os requisitos e o código das branches

O épico ainda não está na `develop`: a aba "Avisos" do aluno é só um placeholder. Existe um começo nas branches `feature/hu-023-publicacao-de-avisos` (PR #382) e `feature/hu-024-mural-aluno-e-notificacoes` (PR #383), ainda sem merge. Os pontos abaixo são o que falta ou difere nelas e estão na issue #539 de decisões do PO.

- **Edição e inativação (HU-023, AC-04, AC-05 e FA-002):** a API só publica e lista avisos (não há `PATCH` nem `DELETE`) e a tabela `aviso` não tem coluna de situação; os avisos não podem ser alterados nem removidos.
- **Auditoria (HU-023, RNF-013):** a publicação não grava log de auditoria.
- **Push nativo (HU-024, AC-02, AC-04, FA-001 e RNF-014):** não há Firebase nem APNs. O aplicativo consulta a API a cada 5 segundos e exibe uma notificação local, então só notifica com o aplicativo aberto; avisos publicados com o app fechado ou sem conexão aparecem só no mural.
- **Alteração de alocação (HU-024, AC-01, AC-06 e RN-009):** o serviço tem um método de notificação de realocação, mas nenhuma alteração de alocação o chama.
- **Tela ao tocar (HU-024, AC-03):** o toque sempre abre a aba "Avisos"; o requisito pede a Consulta de Alocação para mudanças de rota e de ônibus.
- **Nome e limites dos campos (HU-023):** o requisito fala em "conteúdo"; a tela e a API usam "Descrição", com título de 3 a 150 e descrição de 3 a 2000 caracteres, que os requisitos não definem.
- **Destinatários (HU-024, AC-01):** o aviso do mural não aponta para um aluno; o aplicativo notifica todo aluno autenticado com cadastro que não esteja pendente, e a história fala em "aluno afetado".
