# Cadastro de aluno: a lista de bairros é fixa no app e o envio do nome do bairro dá erro 500

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / integração |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-007` a partir da `develop` (`5445f7b4`) |
| **Issue** | [#250](https://github.com/GOUOCE/GOUCE-app/issues/250) |
| **Caso relacionado** | `CT-HU007-UI-012` |
| **Documentação** | [HU-007 — Testes manuais de UI](../UI-HU-007.md#ct-hu007-ui-012--bairros-no-cadastro-de-aluno) |
| **Issue relacionada** | #192 — o mesmo problema para a instituição de ensino; #213 — a API aceita bairro inativo |

---

### Pré-condição

Administrador com bairros cadastrados (ex.: `Centro QA` e `Serra do Estêvão` ativos).

### Passos para reproduzir

1. Na tela de login, tocar em **Criar conta de aluno** e avançar até a etapa de contato e vínculo.
2. Abrir o seletor **Bairro / Localidade** e conferir as opções.
3. Pela API, simular o envio do app: `curl -X POST localhost:8000/usuarios/cadastrar` com `-F "bairro_id=Centro"` e os demais campos válidos.

### ✅ Resultado esperado

- O seletor traz os bairros **ativos** cadastrados pelo administrador; os inativos não aparecem (AC-11).
- O envio usa o **id** do bairro escolhido e o cadastro é concluído.

### ❌ Resultado obtido

- O seletor mostra uma lista fixa: `Centro`, `Croatá`, `Bairro Novo`, `Planalto`, `Serra` e `Outro`. Os bairros cadastrados (`Centro QA`, `Serra do Estêvão`) não aparecem; `Croatá`, `Planalto` e `Serra` não existem no banco.
- O app envia o **nome** do bairro (`bairro_id=Centro`) e a API responde HTTP **500** (`{"code":"INTERNAL_ERROR","message":"Erro interno ao processar a solicitação"}`), em vez de uma validação em português.

### ⚠️ Impacto

- O aluno não consegue escolher o bairro real e o cadastro não conclui com bairro algum (junto com a #192).
- Mudanças feitas pelo administrador (novo bairro, inativação) não chegam ao cadastro.

### Causa aparente

- `frontend/src/components/cadastro/Passo3ContatoVinculo.tsx`: `options={['Centro', 'Croatá', 'Bairro Novo', 'Planalto', 'Serra', 'Outro']}`.
- `frontend/src/services/usuarioService.ts`: `formData.append('bairro_id', data.bairro)` com o texto do seletor.
- Backend (`usuario_routes.py`): `bairro_id` entra como texto direto para a coluna inteira e o erro de banco vira 500.

### Sugestão

- Carregar as opções de `GET /bairros` (público e só com ativos) e enviar o **id**, junto com a correção da #192.
- Backend: validar `bairro_id` (inteiro, existente e ativo, ver #213) e devolver 422 em português.

### Critérios de aceite

- O seletor mostra os bairros ativos do cadastro e não mostra os inativos.
- O cadastro com o bairro escolhido é concluído.
- `bairro_id` inválido devolve 422 em português, não 500.
- Reexecutar `CT-HU007-UI-012`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-26, ambiente local.

**Issue bloqueante: anexar captura de tela da falha.**
