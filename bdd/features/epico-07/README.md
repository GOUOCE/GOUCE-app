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

| Tag              | Significado                                                                  |
| ---------------- | ---------------------------------------------------------------------------- |
| `@conectividade` | Cenário que depende de queda de conexão ou de entrega posterior (FA-001)     |
| `@auditoria`     | Verifica o registro no log de auditoria (RNF-013)                            |

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
- Como o épico não está implementado, os códigos de status de API seguem o padrão dos outros épicos e devem ser confirmados na implementação.
- Arquivos validados com o parser oficial `@cucumber/gherkin`.

## Divergências encontradas entre requisitos e implementação

Os cenários seguem os requisitos. A `develop` analisada é a `f51e7d1e`.

**Sem implementação na `develop`:**

- **HU-023 e HU-024:** não há módulo de avisos no backend nem tela no app; a aba "Avisos" do aluno (`avisos.tsx`) é só um texto de placeholder. Existe um começo em duas branches de PRs fechados sem merge (#382, `feature/hu-023-publicacao-de-avisos`, e #383, `feature/hu-024-mural-aluno-e-notificacoes`).
- **Branches fechadas, o que elas têm:** a API só lista avisos, publica e lista notificações; não tem edição, inativação (soft delete) nem auditoria. O serviço de push guarda os eventos em memória e não chama Firebase nem APNs; o app usa notificações locais do `expo-notifications`. A API chama o conteúdo de `descricao` (aceita `conteudo`) e responde "Aviso publicado com sucesso." com ponto final.

**Pontos dos requisitos em aberto:**

- **Destinatários do aviso (HU-024, AC-01):** a história fala em "aluno afetado", mas um aviso do mural não aponta para um aluno. Os cenários consideram que o aviso notifica os alunos com acesso regular.
- **Mensagens não definidas (HU-023):** os requisitos não trazem o texto de sucesso da edição e da inativação, nem o texto do mural vazio; os cenários descrevem o comportamento sem citar frase.
- **Limites dos campos (HU-023):** os requisitos não definem tamanho mínimo e máximo de título e conteúdo. A branch usa título de 3 a 150 e descrição de 3 a 2000 caracteres.
- **Registro do aparelho (HU-024):** nenhum critério fala em pedir a permissão ao aluno e registrar o aparelho para o push, que é pré-condição de todo o fluxo. O cenário de solicitação de permissão foi derivado do FA-002.
- **Notificação de edição e de inativação (HU-023 e HU-024):** o requisito dispara a notificação só na publicação; não diz se editar ou inativar um aviso também notifica.
- **Nome do campo:** o requisito fala em "conteúdo"; a branch usa "descrição" na API e na validação.
