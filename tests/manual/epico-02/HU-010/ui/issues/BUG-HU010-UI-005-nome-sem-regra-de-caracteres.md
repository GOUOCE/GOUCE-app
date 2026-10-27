# Nome Completo do motorista aceita números, emoji e símbolos, no app e na API

| Campo | Valor |
|---|---|
| **Tipo** | Bug de validação / requisito |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-010` a partir da `develop` (`4b1706ee`), com o `motoristaService.ts` do PR #243 aplicado |
| **Issue** | [#290](https://github.com/GOUOCE/GOUCE-app/issues/290) |
| **Caso relacionado** | `CT-HU010-UI-005` |
| **Documentação** | [HU-010 — Testes manuais de UI](https://github.com/GOUOCE/GOUCE-app/blob/test/manual-ui-hu-010/tests/manual/epico-02/HU-010/ui/UI-HU-010.md#ct-hu010-ui-005--campos-obrigatórios-no-cadastro-e-na-edição) |
| **Issue relacionada** | [#261](https://github.com/GOUOCE/GOUCE-app/issues/261) (faculdades) e [#280](https://github.com/GOUOCE/GOUCE-app/issues/280) (frota) |

---

### Pré-condição

Administrador logado.

### Passos para reproduzir

1. Em **+ Novo**, digitar o nome `333333333333` (ou com emoji e símbolos), um telefone válido e confirmar.
2. Repetir na edição de um motorista.

### ✅ Resultado esperado

- O nome com números, emoji ou outros símbolos é recusado (regra abaixo).

### ❌ Resultado obtido

- O cadastro foi aceito: `POST /motoristas` com `201` e o motorista de id 6 ficou gravado com o nome `333333333333`. O testador relatou que emoji e símbolos também passam.
- A API só confere se o nome não está vazio (`_validar_texto_obrigatorio`); o app só limita o tamanho (3 a 150) em `motoristaSchema.ts`.

### ⚠️ Impacto

- Nomes sem sentido (números, emoji, símbolos) entram na base e aparecem na listagem e nos relatórios.

### Causa aparente

- Nem `motoristaSchema.ts` nem o caso de uso `gerenciar_motoristas_use_case.py` têm regra de caracteres. O critério 12 da HU-010 também não define essa regra.

### Sugestão

- Aplicar, no app e na API, a regra que o sistema já usa para nome de pessoa no cadastro de aluno (`nomeSchema`): de 3 a 150 caracteres depois de tirar espaços das pontas e juntar espaços repetidos; apenas letras (com acento), espaços, hífen e apóstrofo; pelo menos nome e sobrenome (duas partes com 2 letras ou mais).
- Mensagens: “Use apenas letras, espaços, hífen ou apóstrofo” e “Informe nome e sobrenome completos”.
- Registrar a regra no critério de aceite da HU-010 (proposta para aprovação do produto).

### Critérios de aceite

- Nome com número, emoji ou símbolo é recusado no cadastro e na edição, no app e na API, com a mensagem acima.
- Nomes como `Maria da Silva`, `João D’Ávila` e `Ana-Clara Souza` continuam aceitos.
- Reexecutar `CT-HU010-UI-005`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-27, ambiente local.
