# Ao tornar um aluno representante, a instituição escolhida na tela é ignorada: a API recebe sempre a faculdade 1

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional |
| **Severidade** | 🔴 Alta (bloqueante) |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-030` a partir da `develop` (`88eb19dc`), com as mudanças do PR #195 aplicadas |
| **Issue** | [#298](https://github.com/GOUOCE/GOUCE-app/issues/298) |
| **Caso relacionado** | `CT-HU030-UI-003`, `CT-HU030-UI-004`, `CT-HU030-UI-008` |
| **Documentação** | [HU-030 — Testes manuais de UI](https://github.com/GOUOCE/GOUCE-app/blob/test/manual-ui-hu-030/tests/manual/epico-02/HU-030/ui/UI-HU-030.md#ct-hu030-ui-003--atribuir-a-instituição-escolhida-e-preservar-cadastro-de-aluno) |
| **Issue relacionada** | [#262](https://github.com/GOUOCE/GOUCE-app/issues/262) (lista de instituições fixa), AC-03/AC-12 da HU-030 |

---

### Pré-condição

Administrador logado e um aluno aprovado de outra instituição (por exemplo, IFCE).

### Passos para reproduzir

1. Em **Cadastros → Representantes → + Novo**, escolher a instituição **IFCE - Campus Quixadá**.
2. Selecionar o aluno e confirmar **Tornar representante?**.
3. Conferir a faculdade responsável gravada no banco.

### ✅ Resultado esperado

- O aluno passa a representante da instituição escolhida (AC-03, AC-12).

### ❌ Resultado obtido

- Obtido pela leitura do código (o caso não foi executado na tela, a pedido do testador): `cadastrar.tsx` chama `atribuirRepresentante(alunoSelecionado.aluno_id || alunoSelecionado.id)` sem passar a instituição, e o serviço usa `faculdadeId = 1` como padrão e envia `faculdade_id: 1` em `POST /representantes/promover`.
- A lista de instituições da tela é fixa (`UFC`, `IFCE` e `UECE`, Campus Quixadá), não vem da API, e começa com `UFC - Campus Quixadá` selecionada; não há estado vazio nem tratamento de instituição inativa.

### ⚠️ Impacto

- O representante fica responsável pela faculdade errada sem aviso, e o administrador acredita que atribuiu a instituição certa.

### Causa aparente

- `representanteService.atribuirRepresentante(alunoId, faculdadeId = 1)` e a chamada em `cadastrar.tsx` não envia a faculdade; a lista de instituições é um vetor fixo no componente.

### Sugestão

- Carregar as faculdades ativas da API para o seletor, guardar o id da escolhida e enviá-lo como `faculdade_id`.
- Exigir uma instituição válida e ativa antes de confirmar.

### Critérios de aceite

- O representante é gravado com a instituição escolhida (conferido no banco e na auditoria).
- A lista de instituições vem da API e não mostra inativas.
- Reexecutar `CT-HU030-UI-003`, `CT-HU030-UI-004` e `CT-HU030-UI-008`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-27, ambiente local.
