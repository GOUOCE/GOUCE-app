# Aluno aprovado não recebe nenhum aviso de que o acesso foi liberado

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional |
| **Severidade** | 🟡 Média |
| **Ambiente** | Branch `feature/testes-api-hu-027-hu-031` — Docker local isolado, `http://localhost:8001`, commit `4bf26d55` |
| **Issue** | [#313](https://github.com/GOUOCE/GOUCE-app/issues/313) |
| **Caso relacionado** | `CT-HU027-API-004` |
| **Documentação** | [HU-027 — Testes manuais de API](../API-HU-027.md#ct-hu027-api-004--notificar-o-aluno-da-aprovação) |

---

### Pré-condição

Token de administrador; aluno A1 (id 2) `pendente`; SMTP apontando para o Mailpit (`localhost:58025`), com a caixa limpa.

### Passos para reproduzir

1. `PATCH /usuarios/alunos/2/aprovar`, sem corpo.
2. Consultar o Mailpit: `GET http://localhost:58025/api/v1/search?query=to:a1.zuleide@qa.gouce.app`.

### ✅ Resultado esperado

A aprovação atualiza o status e **dispara uma notificação (push/e-mail)** informando o aluno da liberação do acesso (HU-027, AC-04 e fluxo principal, passo 13).

### ❌ Resultado obtido

A aprovação funciona, mas nenhum e-mail sai:

```json
{"aluno_id": 2, "status_cadastro": "ativado", "mensagem": "Cadastro do aluno aprovado com sucesso!"}
{"total": 0, "mensagens": []}
```

Controle: na mesma stack, a reprovação do A2 (`PATCH /usuarios/alunos/3/status`) enviou o e-mail “Documentos pendentes para reenvio - GOUCE” normalmente. O SMTP funciona.

### ⚠️ Impacto

- O aluno não sabe que pode usar o app; só descobre se tentar entrar.
- O AC-04 não é atendido.

### Causa aparente

`backend/src/modulos/usuarios/interface/http/usuario_routes.py:577` (`aprovar_aluno`) só chama `AprovarAlunoUseCase` e não usa o serviço de e-mail. A rota de status (linha 626) envia e-mail só para `rejeitado`. Não existe método de e-mail de aprovação em `shared/infrastructure/services/email_service.py`.

### Critérios de aceite

- Ao aprovar (pela rota `/aprovar` ou por `/status` com `ativado`), o aluno recebe e-mail (ou push) informando que o acesso foi liberado.
- Falha no envio não desfaz a aprovação, mas fica registrada no log.
- Reexecutar `CT-HU027-API-004`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-27, ambiente Docker local isolado. JSON: [`CT-HU027-API-004.json`](../evidencias/CT-HU027-API-004.json) e [`CT-HU027-API-005.json`](../evidencias/CT-HU027-API-005.json) (controle).
