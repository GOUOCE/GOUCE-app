# API aceita senhas fora das regras de complexidade

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / validação / segurança |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Branch `feature/testes-api-hu-001` — Docker local, URL `http://localhost:8000`, commit `9cd5d3da` |
| **Caso relacionado** | `CT-HU001-API-005` |
| **Documentação** | [HU-001 — Testes manuais de API](../API-HU-001.md#ct-hu001-api-005--senha-fora-das-regras) |
| **Issue relacionada** | [Issue #84](https://github.com/GOUOCE/GOUCE-app/issues/84) |

---

### Pré-condição

API disponível em Docker local, em `http://localhost:8000`, e requisição válida de cadastro preparada como `multipart/form-data`. Foram usadas quatro tentativas independentes, alterando somente a categoria da senha e mantendo os demais campos válidos. Os valores das senhas foram omitidos desta evidência.

### Passos para reproduzir

1. Enviar `POST /usuarios/cadastrar` com uma senha de 7 caracteres e os demais campos válidos.
2. Repetir a requisição, em tentativas separadas, com uma senha sem letra maiúscula, uma sem letra minúscula e uma sem número.
3. Conferir o status HTTP, `success`, `error.code` e a mensagem de validação de cada resposta. Para os cadastros aceitos, consultar a persistência no PostgreSQL. Para a senha sem número, consultar a ausência de usuário e verificar separadamente a persistência de arquivos.

### ✅ Resultado esperado

- Rejeitar as quatro tentativas com HTTP `400` ou `422`, `success: false` e mensagem de validação.
- Aplicar o AC-03: mínimo de 8 caracteres, uma maiúscula, uma minúscula e um número.
- Os códigos e as mensagens esperados para cada categoria não foram especificados no registro disponível; não foram inventados.
- Não aceitar o cadastro com nenhuma das quatro senhas.

### ❌ Resultado obtido

- Senha curta, com 7 caracteres: HTTP `201`; cadastro aceito indevidamente.
- Senha sem maiúscula: HTTP `201`; cadastro aceito indevidamente.
- Senha sem minúscula: HTTP `201`; cadastro aceito indevidamente.
- Senha sem número: HTTP `400`, `success: false`, `error.code: "VALIDATION_ERROR"` e mensagem informando que a senha deve conter pelo menos um número; tentativa rejeitada corretamente.
- O PostgreSQL confirmou a persistência dos cadastros aceitos:

  | Cenário | ID |
  | --- | ---: |
  | Senha curta | 4 |
  | Senha sem maiúscula | 5 |
  | Senha sem minúscula | 6 |

- A senha sem número foi rejeitada pela API. A consulta posterior por `email_hash` retornou zero usuários para essa tentativa, mas foram encontrados dois registros órfãos na tabela `arquivos` e dois objetos correspondentes no bucket `smp-fotos` do MinIO.
- Não foram preservados os corpos JSON das três respostas HTTP `201`; os resultados estão documentados somente com status e persistência. O trecho abaixo é exclusivamente da tentativa sem número, que foi rejeitada.

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR"
  }
}
```

### ⚠️ Impacto

- Três das quatro regras de complexidade testadas podem ser contornadas no cadastro, permitindo a aceitação de senhas mais fracas que o requisito.
- Isso reduz a proteção das contas criadas e pode afetar a segurança da autenticação.

### Causa aparente

Não investigada nesta execução.

### Critérios de aceite

- Senhas com menos de 8 caracteres, sem maiúscula, sem minúscula ou sem número devem ser rejeitadas com HTTP `400` ou `422`, `success: false` e mensagem de validação.
- A validação que rejeita a ausência de número deve permanecer funcionando.
- Caso de teste a reexecutar: `CT-HU001-API-005`.

### 📎 Evidência

Reproduzido por Radlei Doroth em 2026-10-02, em ambiente Docker local, URL `http://localhost:8000`, branch `feature/testes-api-hu-001`, commit `9cd5d3da`. A evidência contém somente categorias de senha, status, código e descrição genérica da mensagem; não inclui senhas, tokens ou dados pessoais. O PostgreSQL confirmou a persistência dos cadastros das senhas curta, sem maiúscula e sem minúscula como usuários IDs `4`, `5` e `6`. A consulta posterior por `email_hash` retornou zero usuários para a tentativa sem número, mas confirmou-se a existência de dois registros órfãos no PostgreSQL e dois objetos correspondentes no MinIO. Essa consulta foi realizada após a execução e não comprova, isoladamente, a ausência de persistência de usuário durante todo o intervalo da tentativa. Não há print anexado no repositório.
