# Nome de bairro e de ponto de parada aceita emoji, números e símbolos, e a API aceita nomes abaixo do mínimo

| Campo | Valor |
|---|---|
| **Tipo** | Bug de validação / regra de negócio |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-007` a partir da `develop` (`5445f7b4`) |
| **Issue** | [#251](https://github.com/GOUOCE/GOUCE-app/issues/251) |
| **Caso relacionado** | `CT-HU007-UI-005`, `CT-HU007-UI-004` |
| **Documentação** | [HU-007 — Testes manuais de UI](../UI-HU-007.md#ct-hu007-ui-005--campos-obrigatórios-limites-e-caracteres) |
| **Issue relacionada** | PR #244 — define a regra (critério 12 da HU-007 e cenários BDD), aguardando validação do produto (#207) |

---

### Pré-condição

Administrador logado em **Bairros e pontos de parada**.

### Passos para reproduzir

1. Em **Novo**, cadastrar o bairro `@@@` com o ponto `@@`, e outro com o nome `2222`.
2. Tentar também nomes com emoji (`Centro 😀`) e símbolos.
3. Pela API: `POST /bairros` com `{"nome_bairro":"Zé 😀 @@ 2","pontos_de_parada":["Pto 😀 @@"]}` e com `{"nome_bairro":"Ab","pontos_de_parada":["A"]}`.

### ✅ Resultado esperado

Pela regra proposta no PR #244:

- **Bairro:** de 3 a 100 caracteres; só letras (com acento), espaços, hífen, apóstrofo e ponto. Número, emoji e símbolo são bloqueados com “Use apenas letras, espaços, hífen ou apóstrofo”.
- **Ponto de parada:** de 2 a 100 caracteres; as mesmas letras e símbolos permitidos, mais números. Emoji e símbolos são bloqueados com “Use apenas letras, números, espaços, hífen, apóstrofo ou ponto”.
- A regra vale na tela e na API.

### ❌ Resultado obtido

- A tela aceita e grava emoji, números e símbolos no bairro e no ponto (`@@@`, `2222`, `@@`).
- A API devolve **201** para `Zé 😀 @@ 2` e também para `Ab` com ponto `A`: não valida caracteres nem o tamanho mínimo (a tela já bloqueia menos de 3 no bairro e de 2 no ponto).

### ⚠️ Impacto

- Nomes sem sentido ou com emoji chegam às listas, ao cadastro de aluno e às rotas.
- Quem usar a API direto escapa também do tamanho mínimo.

### Causa aparente

- `frontend/src/schemas/bairroSchema.ts` só valida o tamanho (3 a 100) do nome do bairro; o nome do ponto só tem `min(1)` e o tamanho mínimo de 2 fica em `handleAdicionarPonto`.
- `backend` (`bairro_dto.py`): `nome_bairro` com `min_length=1, max_length=100`, sem regra de caracteres; os pontos não têm limites.

### Sugestão

- Depois do aceite do produto: reaproveitar a regex de `TEXTO_LIVRE` (`alunoSchema.ts`) no `bairroSchema` e criar a regra equivalente no DTO do backend, com as mensagens do critério 12, mais testes nos dois lados.

### Critérios de aceite

- Bairro e ponto com número, emoji ou símbolo (conforme a regra) são bloqueados na tela e na API, com a mensagem em português.
- A API devolve 422 para nome abaixo do tamanho mínimo.
- Reexecutar `CT-HU007-UI-005` e `CT-HU007-API-005`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-26, ambiente local.
