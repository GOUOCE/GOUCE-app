# A sigla da faculdade não é enviada à API nem gravada, e a tela inventa a sigla a partir do nome

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / dados |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-008` a partir da `develop` (`a35ceff7`) |
| **Issue** | [#259](https://github.com/GOUOCE/GOUCE-app/issues/259) |
| **Caso relacionado** | `CT-HU008-UI-002`, `CT-HU008-UI-003`, `CT-HU008-UI-006`, `CT-HU008-UI-007` |
| **Documentação** | [HU-008 — Testes manuais de UI](https://github.com/GOUOCE/GOUCE-app/blob/test/manual-ui-hu-008/tests/manual/epico-02/HU-008/ui/UI-HU-008.md#ct-hu008-ui-002--cadastrar-faculdade) |
| **Issue relacionada** | HU-008 — requisito cita só “nome e campus”; a sigla depende de decisão do produto (#207) |

---

### Pré-condição

Administrador logado.

### Passos para reproduzir

1. Em **Cadastrar**, preencher nome, sigla (ex.: `UTST`) e campus, finalizar e confirmar.
2. Conferir `GET /faculdades` ou a coluna `sigla` da tabela `faculdade`.
3. Editar a faculdade, trocar a sigla e salvar; conferir de novo.
4. Inativar uma faculdade e ler a mensagem.

### ✅ Resultado esperado

- A sigla digitada é gravada, aparece na listagem e na edição (CT-002 e CT-006).

### ❌ Resultado obtido

- Cadastro e edição funcionam (`201` e `200`), mas a coluna `sigla` fica **vazia** no banco (conferido em várias faculdades criadas e editadas).
- A listagem mostra uma sigla que não vem do banco, e a mensagem da inativação usa essa sigla inventada (“Faculdade <sigla> inativada”).

### ⚠️ Impacto

- A sigla digitada se perde; o administrador acha que ela foi salva.
- A lista e as mensagens mostram uma sigla que não existe no banco.

### Causa aparente

- `faculdadeService.ts`: `criarFaculdade` e `atualizarFaculdade` enviam à API só `nome_faculdade` e `campus_faculdade`, sem `sigla`. O backend já aceita e grava a sigla (`faculdade_dto.py`, `faculdade_service.py`, `faculdade_repository.py`), então o ajuste é no app.
- Na listagem e em `obterFaculdadePorId`, quando não há sigla o app usa o nome (se tiver até 10 letras) ou a primeira palavra do nome.

### Sugestão

- Enviar `sigla` no `POST` e no `PATCH` e exibir a sigla vinda da API (vazia, se não houver).
- Confirmar com o produto se a sigla é obrigatória (a tela exige; o requisito não cita).

### Critérios de aceite

- A sigla digitada é gravada e exibida a partir do banco, no cadastro e na edição.
- Reexecutar `CT-HU008-UI-002` e `CT-HU008-UI-006`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-26, ambiente local.
