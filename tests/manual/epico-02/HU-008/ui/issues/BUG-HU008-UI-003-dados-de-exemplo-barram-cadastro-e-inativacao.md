# Cadastro e inativação de faculdade são barrados pelos dados de exemplo do app, sem chamar a API

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional |
| **Severidade** | 🔴 Alta |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-008` a partir da `develop` (`a35ceff7`) |
| **Issue** | [#258](https://github.com/GOUOCE/GOUCE-app/issues/258) |
| **Caso relacionado** | `CT-HU008-UI-002`, `CT-HU008-UI-007` |
| **Documentação** | [HU-008 — Testes manuais de UI](https://github.com/GOUOCE/GOUCE-app/blob/test/manual-ui-hu-008/tests/manual/epico-02/HU-008/ui/UI-HU-008.md#ct-hu008-ui-002--cadastrar-faculdade) |
| **Issue relacionada** | #249 (dados de exemplo nos bairros) e #192 |

---

### Pré-condição

Administrador logado; banco só com a `UFC` / `Campus Quixadá` do seed (id 1).

### Passos para reproduzir

1. Em **Cadastrar**, preencher `Universidade Federal do Ceará` / `UFC` / `Campus Quixadá`, finalizar e confirmar.
2. Na listagem, tocar na lixeira da faculdade de `id` 1 (`UFC` / `Campus Quixadá`) e tocar em **Inativar**.

### ✅ Resultado esperado

- O cadastro é enviado à API: como a combinação não existe no banco, é aceito.
- A inativação da faculdade de `id` 1 só é bloqueada se ela tiver alunos agendados para datas futuras (AC-06), o que hoje não existe; fora isso, é inativada.

### ❌ Resultado obtido

- O cadastro mostra “Esta faculdade já está cadastrada.” e **nada chega à API** (o log não registra `POST /faculdades`; o banco não ganha a faculdade).
- A inativação do `id` 1 mostra “Esta instituição possui viagens programadas pendentes. Não é possível inativar no momento.” e **nada chega à API** (o log não registra `PATCH /faculdades/1/inativar`; a faculdade continua ativa).

### ⚠️ Impacto

- Não dá para cadastrar a faculdade `UFC` / `Campus Quixadá` (ou `UFC` na sigla do mesmo campus) mesmo que ela não exista.
- A primeira faculdade real do banco (`id` 1) nunca pode ser inativada.

### Causa aparente

- `frontend/src/services/faculdadeService.ts`: `criarFaculdade` compara o que foi digitado com `FACULDADES_MOCK` (nome + campus **ou** sigla + campus) antes de chamar a API; o primeiro item da lista de exemplo é `Universidade Federal do Ceará` / `UFC` / `Campus Quixadá`.
- `inativarFaculdade` procura o `id` em `FACULDADES_MOCK` e barra se `viagens_programadas_pendentes` for `true`, o que vale para o item de `id` 1.

### Sugestão

- Remover a lista de exemplo do serviço: a duplicidade vem da API (`409`, já devolvida com “Esta faculdade já está cadastrada.”).
- O bloqueio por viagens pendentes deve vir da API quando a agenda existir (HU-013).

### Critérios de aceite

- Cadastro e inativação sempre chamam a API e só mostram o que ela respondeu.
- Reexecutar `CT-HU008-UI-002` e `CT-HU008-UI-007`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-26, ambiente local.
