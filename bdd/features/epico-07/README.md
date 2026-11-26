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
| `@valor_limite`  | Testa o tamanho mínimo ou máximo de um campo (título e descrição)        |

## Histórias de Usuário

**HU-023: Publicação de Avisos**

- Fluxo: o administrador abre "Mural de Avisos", seleciona "Novo Aviso", preenche título e descrição e aciona "Publicar"; o sistema exibe "Aviso publicado com sucesso" e o aviso aparece no mural do aluno
- Validação: título e descrição obrigatórios, inclusive quando preenchidos só com espaços (FA-001); título de 3 a 150 e descrição de 3 a 2000 caracteres, com as mensagens do código; a API recusa a publicação sem os campos
- Edição e inativação: a mudança aparece imediatamente no mural do aluno; a inativação é soft delete e o aviso inativado deixa de ser exibido (FA-002)
- Autoria e auditoria: o aviso fica associado ao administrador logado (AC-03) e as operações de escrita são registradas no log (RNF-013)
- Acesso (RN-006): só o administrador gerencia avisos; o aluno apenas lê o mural
- Organizado em blocos `Regra:` (gerenciamento pelo administrador, mural do aluno, acesso restrito)
- Cenários: 1 publicação + 1 lista + 1 autor (API) + 1 obrigatórios + 1 só espaços + 1 limites recusados + 1 limites aceitos + 1 obrigatórios (API) + 1 edição + 1 inativação + 1 soft delete + 1 auditoria + 1 avisos no mural do aluno + 1 aviso inativado + 1 mural vazio + 1 edição visível ao aluno + 3 acesso restrito (menu, API e sem token)

**HU-024: Recebimento de Notificações Push**

- Fluxo: a publicação de um aviso ou a alteração de última hora na alocação do aluno (ônibus ou rota) faz a API montar a notificação e enviá-la ao serviço de mensageria (Firebase ou APNs), que a entrega ao aparelho
- Recebimento: o alerta aparece com o aplicativo fechado ou em segundo plano; ao tocar, o app abre no Mural de Avisos (aviso) ou na Consulta de Alocação (mudança de rota ou ônibus)
- Offline (FA-001): o serviço de mensageria retém a notificação e entrega quando a conexão volta
- Permissão desativada (FA-002): a notificação não aparece e o aluno vê o aviso ao abrir o Mural
- Destinatários: o aviso notifica todos os alunos com cadastro aprovado e vínculo válido; cadastro pendente ou reprovado não recebe; editar ou inativar um aviso não notifica de novo
- Dados atualizados (RN-009): a notificação e a consulta refletem a alocação mais recente
- Organizado em blocos `Regra:` (disparo, recebimento no aparelho)
- Cenários: 1 aviso + 1 aviso para todos os aprovados + 1 sem cadastro aprovado + 1 edição e inativação sem notificação + 1 alteração de alocação + 1 só o aluno afetado + 1 dados atualizados (API) + 1 disparo a cada evento (API) + 1 app fechado ou em segundo plano + 1 tela aberta ao tocar + 1 aviso no mural + 1 offline + 1 permissão desativada + 1 solicitação de permissão

## Resumo de Cobertura

| HU     | Cenários | Esquemas | Execuções |
| ------ | -------- | -------- | --------- |
| HU-023 | 19       | 8        | 32        |
| HU-024 | 14       | 6        | 21        |
| Total  | 33       | 14       | 53        |

- Todos os critérios de aceite e fluxos alternativos de `docs/requisitos.md` (seção 7.8) têm ao menos um cenário.
- Cenários de API, soft delete, auditoria, integridade (RNF-012), confiabilidade (RNF-014) e acesso por perfil estão marcados com `@teste_api @nao_automatizavel_via_appium`.
- Os cenários seguem os requisitos; os códigos de status de API seguem o padrão dos outros épicos e devem ser confirmados na implementação.
- Arquivos validados com o parser oficial `@cucumber/gherkin`.

## Decisões do PO (issue #539) e o que falta implementar

O PO não respondeu a tempo; seguimos as sugestões ⭐ da issue #539 como regra do épico. Os cenários seguem os requisitos, que agora incluem as decisões 5, 6 e 7. As decisões 1 a 4 mantêm os requisitos como estavam e ficam como pendência de implementação.

**Decididas e já nos requisitos e nos cenários:**

- **Campos (item 5):** "Título" (3 a 150 caracteres) e "Descrição" (3 a 2000), com as mensagens do código; cenários de valor-limite.
- **Destinatários (item 6):** todos os alunos com cadastro aprovado e vínculo válido; cadastro pendente ou reprovado não recebe.
- **Edição e inativação (item 7):** não geram nova notificação; só a publicação notifica.

**Decididas e ainda não implementadas** (o épico ainda não está na `develop`; existe um começo nas branches `feature/hu-023-publicacao-de-avisos`, PR #382, e `feature/hu-024-mural-aluno-e-notificacoes`, PR #383, sem merge):

- **Edição e inativação (item 1, HU-023, AC-04, AC-05 e FA-002):** a API só publica e lista (não há `PATCH` nem `DELETE`) e a tabela `aviso` não tem coluna de situação.
- **Auditoria (item 2, RNF-013):** a publicação não grava log de auditoria.
- **Push nativo (item 3, HU-024, AC-02, AC-04, FA-001 e RNF-014):** não há Firebase nem APNs; o aplicativo consulta a API a cada 5 segundos e só notifica com o app aberto.
- **Alteração de alocação (item 4, HU-024, AC-01, AC-03, AC-06 e RN-009):** o serviço tem a mensagem de realocação, mas nenhuma alteração de alocação a dispara, e o toque sempre abre "Avisos" em vez da Consulta de Alocação.
