# HU-012: reativação com principal inativa usa mensagem diferente da aprovada pelo PO

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / divergência de requisito |
| **Severidade** | 🟢 Baixa — regra funcional aplicada; divergência textual |
| **Ambiente** | HTTP local, PostgreSQL 15 e MinIO isolados; branches `feat/front-hu011` e `feat/front-hu012`; commits de aplicação `671a6e0df3d00016e87477deb326dfdb7c33b364` e `23d1063f09f13cc195da7e45422581f73e2ae6da` |
| **Caso relacionado** | `CT-HU012-API-010` |
| **Issue relacionada** | [Decisões oficiais do PO #208](https://github.com/GOUOCE/GOUCE-app/issues/208#issuecomment-6430972445) |

---

### Pré-condição

Administrador autenticado e massa de rotas nas condições do caso: principal com complementar ativa (HU-011/CT-010 e HU-012/CT-009), ou complementar inativa ligada a principal inativa (HU-012/CT-010).

### Passos para reproduzir

1. Preparar os vínculos e status pela API conforme a pré-condição.
2. Enviar `PATCH /rotas-complementares/6/reativar`.
3. Ler `error.message` e conferir que o status da rota não mudou nem foi criada auditoria da recusa.

### ✅ Resultado esperado

HTTP **409**, `error.code: CONFLICT`, com a mensagem aprovada na #208:

> Não é possível reativar esta rota complementar pois a rota principal vinculada está inativa.

### ❌ Resultado obtido

HTTP **409**; a regra é aplicada e o estado é preservado, mas a mensagem difere do texto oficial:

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "A rota principal vinculada está inativa. Reative-a ou altere o vínculo antes."
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
- Reexecutar `CT-HU012-API-010`.

### 📎 Evidência

Reproduzido em 2026-10-27 por HTTP real e PostgreSQL isolado. Abaixo estão os JSONs das chamadas que comprovam este defeito, extraídos da execução original. Senhas, tokens e contatos foram omitidos.

**CT-HU012-API-010**

```json
{
  "case_id": "CT-HU012-API-010",
  "application_commit": "23d1063f09f13cc195da7e45422581f73e2ae6da",
  "requests": [
    {
      "sequence": 95,
      "timestamp": "2026-10-27T17:43:52.475368+00:00",
      "actor": "admin",
      "request": {
        "method": "PATCH",
        "url": "http://127.0.0.1:18812/rotas-complementares/6/reativar",
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
            "message": "A rota principal vinculada está inativa. Reative-a ou altere o vínculo antes."
          }
        }
      },
      "database_unchanged": true,
      "audit_delta": []
    },
    {
      "sequence": 96,
      "timestamp": "2026-10-27T17:43:52.494672+00:00",
      "actor": "admin",
      "request": {
        "method": "GET",
        "url": "http://127.0.0.1:18812/rotas-complementares/6",
        "headers": {
          "Accept": "application/json",
          "Authorization": "[REDACTED]"
        },
        "json": null
      },
      "response": {
        "status": 200,
        "headers": {
          "date": "Tue, 27 Oct 2026 17:43:51 GMT",
          "content-type": "application/json"
        },
        "json": {
          "id": 6,
          "nome": "Van Sítio",
          "horario_saida": "05:40",
          "ponto_conexao": "Entrada do Sítio Riacho",
          "ativo": false,
          "rota_principal": {
            "id": 2,
            "nome": "Rota Campo Velho - IFCE",
            "ativo": false
          }
        }
      }
    }
  ]
}
```

Issue no GitHub: https://github.com/GOUOCE/GOUCE-app/issues/312
