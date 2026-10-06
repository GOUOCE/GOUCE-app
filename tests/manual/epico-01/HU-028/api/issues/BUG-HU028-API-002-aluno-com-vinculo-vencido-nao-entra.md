# Aluno com vínculo vencido não consegue entrar e, por isso, não consegue renovar

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / divergência de requisito |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Branch `feature/testes-api-hu-028` — Docker local isolado, `http://localhost:8001`, commit `a0a08b5f` |
| **Caso relacionado** | `CT-HU028-API-004` |
| **Documentação** | [HU-028 — Testes manuais de API](../API-HU-028.md#ct-hu028-api-004--aluno-com-vínculo-vencido-consegue-renovar) |

---

### Pré-condição

Aluno com cadastro aprovado e `validade_acesso` no passado (vínculo vencido). Em ambiente local: `UPDATE aluno SET validade_acesso = now() - interval '1 day' WHERE aluno_id = <id>`.

### Passos para reproduzir

1. `POST /auth/login` com as credenciais do aluno.
2. Conferir o status HTTP e a mensagem.

### ✅ Resultado esperado

O login é permitido para que o aluno veja o aviso de renovação e envie o novo comprovante (AC-01: “Aluno com vínculo vencido […] faz login e visualiza um aviso destacado de necessidade de renovação”; RN-013).

### ❌ Resultado obtido

HTTP `401`; a renovação não pode ser feita.

```json
{"detail": "A validade de acesso da sua conta expirou."}
```

### ⚠️ Impacto

- O fluxo principal da HU-028 fica inacessível justamente para quem precisa dele: o aluno com vínculo vencido.
- Sem conseguir entrar, o aluno depende da coordenação para revalidar o vínculo.

### Causa aparente

`backend/src/modulos/usuarios/infrastructure/repositories/usuario_repository.py` (`buscar_contexto_autenticacao_por_id`): quando `validade_acesso` já passou, a conta é marcada como inativa (`ativo = False`) e o login é recusado, sem exceção para o fluxo de renovação.

### Critérios de aceite

- O aluno com vínculo vencido consegue entrar com acesso limitado: vê o aviso de renovação e consegue enviar a renovação, mas não acessa agendamento nem carteirinha.
- Reexecutar `CT-HU028-API-004` e o `CT-HU028-UI-001`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-06, ambiente Docker local isolado.
