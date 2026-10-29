# HU-011/HU-012: bloqueio por complementar ativa usa mensagem diferente da aprovada pelo PO

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / divergência de requisito |
| **Severidade** | 🟢 Baixa — regra funcional aplicada; divergência textual |
| **Ambiente** | HTTP local, PostgreSQL 15 e MinIO isolados; branches `feat/front-hu011` e `feat/front-hu012`; commits de aplicação `671a6e0df3d00016e87477deb326dfdb7c33b364` e `23d1063f09f13cc195da7e45422581f73e2ae6da` |
| **Caso relacionado** | `CT-HU011-API-010`, `CT-HU012-API-009` |
| **Issue relacionada** | [Decisões oficiais do PO #208](https://github.com/GOUOCE/GOUCE-app/issues/208#issuecomment-6430972445) |

---

### Pré-condição

Administrador autenticado e massa de rotas nas condições do caso: principal com complementar ativa (HU-011/CT-010 e HU-012/CT-009), ou complementar inativa ligada a principal inativa (HU-012/CT-010).

### Passos para reproduzir

1. Preparar os vínculos e status pela API conforme a pré-condição.
2. Enviar `PATCH /rotas-principais/1/inativar`.
3. Ler `error.message` e conferir que o status da rota não mudou nem foi criada auditoria da recusa.

### ✅ Resultado esperado

HTTP **409**, `error.code: CONFLICT`, com a mensagem aprovada na #208:

> Esta rota possui rotas complementares ativas vinculadas. Inative ou desvincule as rotas complementares antes de continuar.

### ❌ Resultado obtido

HTTP **409**; a regra é aplicada e o estado é preservado, mas a mensagem difere do texto oficial:

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Esta rota possui rotas complementares ativas e não pode ser inativada. Inative ou reassocie as complementares antes."
  }
}
```

### ⚠️ Impacto

- Mensagem fora do contrato aprovado pelo PO. O bloqueio funcional funciona; esta issue não afirma ausência da proteção.
- O roteiro determina classificação **⚠️ parcial** quando a regra funciona e o texto diverge.

### Causa aparente

Mensagem constante no backend de rotas difere da decisão oficial da #208.

### Critérios de aceite

- Preservar o bloqueio 409 e usar o texto aprovado pelo PO.
- Preservar ausência de alterações/auditoria em operações recusadas.
- Reexecutar `CT-HU011-API-010`, `CT-HU012-API-009`.

### 📎 Evidência

Reproduzido em 2026-10-27 por HTTP real e PostgreSQL isolado. Abaixo estão os JSONs das chamadas que comprovam este defeito, extraídos da execução original. Senhas, tokens e contatos foram omitidos.

**CT-HU011-API-010**

```json
{
  "case_id": "CT-HU011-API-010",
  "application_commit": "671a6e0df3d00016e87477deb326dfdb7c33b364",
  "requests": [
    {
      "sequence": 102,
      "timestamp": "2026-10-27T17:43:52.724380+00:00",
      "actor": "admin",
      "request": {
        "method": "PATCH",
        "url": "http://127.0.0.1:18811/rotas-principais/1/inativar",
        "headers": {
          "Accept": "application/json",
          "Authorization": "[REDACTED]"
        },
        "json": null
      },
      "response": {
        "status": 409,
        "headers": {
          "date": "Tue, 27 Oct 2026 17:43:51 GMT",
          "content-type": "application/json"
        },
        "json": {
          "success": false,
          "error": {
            "code": "CONFLICT",
            "message": "Esta rota possui rotas complementares ativas e não pode ser inativada. Inative ou reassocie as complementares antes."
          }
        }
      },
      "database_unchanged": true,
      "audit_delta": []
    }
  ]
}
```

**CT-HU012-API-009**

```json
{
  "case_id": "CT-HU012-API-009",
  "application_commit": "23d1063f09f13cc195da7e45422581f73e2ae6da",
  "requests": [
    {
      "sequence": 90,
      "timestamp": "2026-10-27T17:43:52.319898+00:00",
      "actor": "admin",
      "request": {
        "method": "PATCH",
        "url": "http://127.0.0.1:18812/rotas-principais/2/inativar",
        "headers": {
          "Accept": "application/json",
          "Authorization": "[REDACTED]"
        },
        "json": null
      },
      "response": {
        "status": 409,
        "headers": {
          "date": "Tue, 27 Oct 2026 17:43:51 GMT",
          "content-type": "application/json"
        },
        "json": {
          "success": false,
          "error": {
            "code": "CONFLICT",
            "message": "Esta rota possui rotas complementares ativas e não pode ser inativada. Inative ou reassocie as complementares antes."
          }
        }
      },
      "database_unchanged": true,
      "audit_delta": []
    }
  ]
}
```

Issue no GitHub: https://github.com/GOUOCE/GOUCE-app/issues/311
