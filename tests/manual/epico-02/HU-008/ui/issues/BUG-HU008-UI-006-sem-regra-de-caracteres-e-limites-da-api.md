# Nome, sigla e campus da faculdade aceitam emoji e símbolos, e a API aceita limites diferentes dos da tela

| Campo | Valor |
|---|---|
| **Tipo** | Bug de validação / regra de negócio |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-008` a partir da `develop` (`a35ceff7`) |
| **Issue** | [#261](https://github.com/GOUOCE/GOUCE-app/issues/261) |
| **Caso relacionado** | `CT-HU008-UI-005` |
| **Documentação** | [HU-008 — Testes manuais de UI](https://github.com/GOUOCE/GOUCE-app/blob/test/manual-ui-hu-008/tests/manual/epico-02/HU-008/ui/UI-HU-008.md#ct-hu008-ui-005--campos-obrigatórios-e-limites) |
| **Issue relacionada** | #251 (mesma regra nos bairros); PR #255 define a regra (critério 12 da HU-008 e BDD), aguardando validação do produto (#207); #221 |

---

### Pré-condição

Administrador logado em **Cadastros → Faculdades → Cadastrar**.

### Passos para reproduzir

1. Em **Cadastrar**, usar nome `Faculdade 😀 @#$%`, sigla `U F C 😀` e campus `Campus 😀 @#$%`.
2. Pela API: `POST /faculdades` com `{"nome_faculdade":"Teste 😀 @#$%","campus_faculdade":"Campus Teste","sigla":"U F C"}`, com `{"nome_faculdade":"Z","campus_faculdade":"Q"}`, com um campus de 200 caracteres e com uma sigla de 50 caracteres.

### ✅ Resultado esperado

- Pela regra proposta no PR #255, na tela **e na API**:
- **Nome da instituição:** 3 a 150 caracteres; letras (com acento), números, espaços, hífen, apóstrofo e ponto. Emoji e símbolos bloqueiam com “Use apenas letras, números, espaços, hífen, apóstrofo ou ponto”.
- **Sigla:** 2 a 20 caracteres; só letras e números, sem espaços. Qualquer outro caractere bloqueia com “Use apenas letras e números na sigla, sem espaços”.
- **Campus:** 2 a 100 caracteres; mesmo conjunto do nome, com a mesma mensagem.
- Abaixo do mínimo e acima do máximo: mensagens que a tela já tem (“Informe o nome da instituição com pelo menos 3 caracteres”, “Informe a sigla do nome (ex.: UFC)”, “Informe o campus da instituição”, “O nome da instituição deve ter no máximo 150 caracteres”, “A sigla deve ter no máximo 20 caracteres”, “O campus deve ter no máximo 100 caracteres”).

### ❌ Resultado obtido

- A tela aceita emoji e caracteres especiais no nome, na sigla e no campus e grava.
- A API devolve **201** para nome com emoji e símbolos, para nome e campus de 1 letra, para campus de 200 caracteres e para sigla de 50 caracteres: não valida caracteres nem os mesmos limites da tela (tela: nome 3 a 150, sigla 2 a 20, campus 2 a 100; API: 1 a 255 no nome e no campus e até 50 na sigla). Quem chama a API direto escapa das regras.

### ⚠️ Impacto

- Nomes sem sentido ou com emoji chegam às listas, ao cadastro de aluno e às rotas.
- As regras da tela e da API ficam diferentes.

### Causa aparente

- `frontend/src/schemas/faculdadeSchema.ts` só valida o tamanho; não há regra de caracteres.
- `backend/src/modulos/crud_basicos/application/dtos/faculdade_dto.py`: `nome` e `campus` com `min_length=1` e `max_length=255`, `sigla` com `max_length=50`, sem regra de caracteres.

### Sugestão

- Depois do aceite do produto: reaproveitar a regex de `TEXTO_LIVRE` (`alunoSchema.ts`) no `faculdadeSchema` e criar a regra equivalente nos DTOs do backend, com as mensagens do critério 12, e alinhar os limites da API aos da tela, com testes nos dois lados.

### Critérios de aceite

- Nome, sigla e campus fora da regra são bloqueados na tela e na API, com a mensagem em português.
- A API devolve 422 para valor abaixo do mínimo ou acima do máximo.
- Reexecutar `CT-HU008-UI-005` e `CT-HU008-API-005`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-26, ambiente local.
