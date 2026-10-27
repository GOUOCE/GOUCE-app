# Cadastro de aluno e de representante: a lista de instituições é fixa e não reflete as faculdades cadastradas

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / integração |
| **Severidade** | 🔴 Alta |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-008` a partir da `develop` (`a35ceff7`) |
| **Issue** | [#262](https://github.com/GOUOCE/GOUCE-app/issues/262) |
| **Caso relacionado** | `CT-HU008-UI-011` |
| **Documentação** | [HU-008 — Testes manuais de UI](https://github.com/GOUOCE/GOUCE-app/blob/test/manual-ui-hu-008/tests/manual/epico-02/HU-008/ui/UI-HU-008.md#ct-hu008-ui-011--faculdades-na-seleção-de-cadastro) |
| **Issue relacionada** | #192 (o app envia o nome da instituição e a API exige o id) e #250 (lista de bairros fixa no cadastro de aluno) |

---

### Pré-condição

Administrador logado; existem faculdades ativas e inativas cadastradas.

### Passos para reproduzir

1. Como administrador, abrir **Representantes → cadastrar** e abrir **Instituição de Ensino**.
2. Sair e, no login, tocar em **Criar conta**, avançar até o **Passo 3 — Contato e Vínculo** e abrir **Instituição de Ensino**.

### ✅ Resultado esperado

- As faculdades **ativas** cadastradas pelo administrador aparecem nas duas listas; as **inativas** não aparecem (AC-11).

### ❌ Resultado obtido

- **Representante:** `UFC - Campus Quixadá`, `IFCE - Campus Quixadá` e `UECE - Campus Quixadá`.
- **Aluno:** `UFC - Universidade Federal do Ceará`, `IFCE`, `UNILAB`, `Estácio` e `Outra`.
- Nenhuma das faculdades cadastradas na suíte aparece, e a inativa também não é tratada.

### ⚠️ Impacto

- Faculdades novas nunca chegam ao cadastro de aluno e de representante; o administrador não consegue vincular às instituições que gerencia.
- Faculdades inativas continuam disponíveis por estarem fixas no app.

### Causa aparente

- `frontend/src/components/cadastro/Passo3ContatoVinculo.tsx` usa `options={['UFC - Universidade Federal do Ceará', 'IFCE', 'UNILAB', 'Estácio', 'Outra']}` e `frontend/src/app/(administrador)/representantes/cadastrar.tsx` usa a lista fixa `['UFC - Campus Quixadá', 'IFCE - Campus Quixadá', 'UECE - Campus Quixadá']`. As duas telas não consultam a API. `GET /faculdades` é público (responde 200 sem token), então o cadastro de aluno pode usá-lo.

### Sugestão

- Carregar as faculdades ativas de `GET /faculdades` nas duas telas, exibir nome e campus e enviar o **id** numérico à API (#192).

### Critérios de aceite

- As duas listas mostram só as faculdades ativas cadastradas, com nome e campus.
- Faculdade inativa não aparece.
- Reexecutar `CT-HU008-UI-011`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-26, ambiente local.
