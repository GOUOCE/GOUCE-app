# API aceita cadastro sem telefone obrigatório

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / validação |
| **Severidade** | 🟡 Média |
| **Ambiente** | Branch `feature/testes-api-hu-001` — Docker local, URL `http://localhost:8000`, commit `9cd5d3da` |
| **Caso relacionado** | `CT-HU001-API-003` |
| **Documentação** | [HU-001 — Testes manuais de API](../API-HU-001.md#ct-hu001-api-003--campo-obrigatório-ausente) |
| **Issue relacionada** | [Issue #81](https://github.com/GOUOCE/GOUCE-app/issues/81) |

---

### Pré-condição

API disponível e requisição válida de cadastro preparada como `multipart/form-data`, com dados fictícios e os dois comprovantes válidos. O campo `telefone` deve ser obrigatório conforme o AC-02. Valores de entrada pessoais ou sensíveis foram omitidos desta evidência.

### Passos para reproduzir

1. Enviar `POST /usuarios/cadastrar` por `multipart/form-data`, omitindo somente `nome` e mantendo os demais campos válidos.
2. Conferir o status HTTP, `success`, `error.code` e o campo identificado na resposta.
3. Restaurar `nome`, omitir somente `telefone` e reenviar a requisição com os demais dados válidos.
4. Conferir o status HTTP e o corpo da resposta. Consultar no PostgreSQL a persistência do cadastro aceito.

### ✅ Resultado esperado

- Sem `nome`: HTTP `422`, `success: false`, `error.code: "REQUEST_VALIDATION_ERROR"` e `error.details` identificando `nome`.
- Sem `telefone`: HTTP `400` ou `422`, identificando `telefone` como campo obrigatório.
- Para a ausência de `telefone`, o código e a mensagem esperados não foram especificados no registro disponível; não foram inventados.
- As duas tentativas devem ser rejeitadas, sem aceitar o cadastro.

### ❌ Resultado obtido

- Sem `nome`: HTTP `422`, `success: false`, `error.code: "REQUEST_VALIDATION_ERROR"` e `error.details` identificando `nome`.
- Sem `telefone`: HTTP `201`, `success: true`; cadastro aceito com `status_cadastro: "pendente"`.
- O PostgreSQL confirmou a persistência do usuário ID `3` sem telefone.

```json
{
  "success": true,
  "data": {
    "status_cadastro": "pendente"
  }
}
```

### ⚠️ Impacto

- A API aceita uma solicitação de cadastro sem um campo obrigatório do requisito.
- O sistema pode receber cadastros pendentes com dados incompletos, afetando a qualidade do cadastro e fluxos que dependam do telefone.

### Causa aparente

Não investigada nesta execução.

### Critérios de aceite

- Requisições sem `telefone` devem ser rejeitadas com HTTP `400` ou `422`, identificando o campo como obrigatório e sem aceitar o cadastro.
- O comportamento sem `nome` deve permanecer conforme o resultado esperado de validação.
- Caso de teste a reexecutar: `CT-HU001-API-003`.

### 📎 Evidência

Reproduzido por Radlei Doroth em 2026-10-02, em ambiente Docker local, URL `http://localhost:8000`, branch `feature/testes-api-hu-001`, commit `9cd5d3da`. A evidência contém somente status, códigos e campos genéricos; não inclui senhas, tokens ou dados pessoais. A consulta ao PostgreSQL confirmou a persistência do usuário ID `3` sem telefone. Não há print anexado no repositório.
