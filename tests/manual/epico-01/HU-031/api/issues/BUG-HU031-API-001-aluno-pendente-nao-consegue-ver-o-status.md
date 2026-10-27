# Aluno com cadastro pendente não consegue entrar para ver o status, nem logo depois de reenviar os documentos

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / divergência de requisito |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Branch `feature/testes-api-hu-027-hu-031` — Docker local isolado, `http://localhost:8001`, commit `4bf26d55` |
| **Issue** | [#319](https://github.com/GOUOCE/GOUCE-app/issues/319) |
| **Caso relacionado** | `CT-HU031-API-001` e `CT-HU031-API-008` |
| **Documentação** | [HU-031 — Testes manuais de API](../API-HU-031.md#ct-hu031-api-001--login-e-status-de-cada-situação) |

---

### Pré-condição

Aluno P1 (id 10) `pendente`; aluno R1 (id 8) `rejeitado` e logado.

### Passos para reproduzir

1. `POST /auth/login` com o P1.
2. Com o R1, reenviar os documentos pedidos em `PUT /usuarios/reenvio_documento` (HTTP `200`, status `pendente`).
3. Com o mesmo token do R1, enviar `GET /usuarios/reenvio_documento`; depois fazer `POST /auth/login` de novo.

### ✅ Resultado esperado

O aluno consegue entrar e ver a tela **Status do Cadastro** com o status **Pendente de aprovação** (HU-031, AC-01, AC-02, AC-06 e FA-002). Para o pendente, o requisito só bloqueia o **agendamento** (RN-011; HU-001, AC-07), não o login.

### ❌ Resultado obtido

```json
POST /auth/login (P1) -> 401 {"detail": "Sua conta está pendente de aprovação pela coordenação."}
GET /usuarios/reenvio_documento (R1, token de antes do reenvio) -> 401 {"success": false, "error": {"code": "UNAUTHORIZED", "message": "Não autorizado"}}
POST /auth/login (R1 depois do reenvio) -> 401 {"detail": "Sua conta está pendente de aprovação pela coordenação."}
```

### ⚠️ Impacto

- O aluno pendente não consegue ver o status nem acompanhar a avaliação (FA-002).
- Logo depois de reenviar, o aluno perde a sessão; o app não consegue mostrar “Pendente de Aprovação” vindo do servidor.

### Causa aparente

`login_use_case.py:47` recusa o login quando o status é `pendente`. `usuario_repository.py:131` considera ativo só `ativado`, `analise_renovacao` e `rejeitado`; por isso `get_current_user` (`shared/auth/dependencies.py:128`) devolve `401` para qualquer token de aluno pendente.

### Critérios de aceite

- O aluno pendente consegue logar e consultar o próprio status, mas continua sem acesso ao agendamento (RN-011).
- Depois do reenvio, a sessão continua válida e mostra o status `pendente`.
- Reexecutar `CT-HU031-API-001`, `CT-HU031-API-003`, `CT-HU031-API-007` e `CT-HU031-API-008`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-27, ambiente Docker local isolado. JSON: [`CT-HU031-API-001.json`](../evidencias/CT-HU031-API-001.json) e [`CT-HU031-API-008.json`](../evidencias/CT-HU031-API-008.json).
