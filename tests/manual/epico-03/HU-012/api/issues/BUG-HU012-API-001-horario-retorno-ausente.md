# HU-012: horário de retorno da complementar é recusado como campo não permitido

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / divergência de requisito |
| **Severidade** | 🔴 Alta — bloqueia a configuração do retorno |
| **Ambiente** | HTTP local, PostgreSQL 15 e MinIO isolados; branches `feat/front-hu011` e `feat/front-hu012`; commits de aplicação `671a6e0df3d00016e87477deb326dfdb7c33b364` e `23d1063f09f13cc195da7e45422581f73e2ae6da` |
| **Caso relacionado** | `CT-HU012-API-003` |
| **Issue relacionada** | [Decisões oficiais do PO #208](https://github.com/GOUOCE/GOUCE-app/issues/208#issuecomment-6430972445) |

---

### Pré-condição

Administrador autenticado e rota principal ativa, com bairros/faculdades válidos.

### Passos para reproduzir

1. Enviar `POST /rotas-complementares` com saída `06:00` e retorno `17:40`.
2. Repetir com retorno igual e anterior à saída.
3. Enviar `PATCH /rotas-complementares/{id}` com `{"horario_retorno":"17:45"}`.
4. Consultar a complementar e o schema para verificar a ausência do retorno.

### ✅ Resultado esperado

Cadastro válido retorna **201**, edição retorna **200**, e `horario_retorno` é persistido e devolvido. Retorno igual ou anterior à saída deve voltar 422 explicando a ordem dos horários. A #208, itens 2 e 4, exige um horário de saída e um de retorno por complementar.

### ❌ Resultado obtido

Cadastro e edição recusam o campo com **422**, `REQUEST_VALIDATION_ERROR`, `field: horario_retorno`, mensagem **“Campo não permitido.”**. A resposta de consulta não contém horário de retorno. Os casos de ordem são recusados pelo campo desconhecido, não pela regra de horário.

```json
{
  "request": {
    "nome": "Van Retorno 17:40",
    "horario_saida": "06:00",
    "ponto_conexao": "Trevo do Bairro Novo",
    "rota_principal_id": 1,
    "horario_retorno": "17:40"
  },
  "status": 422,
  "response": {
    "success": false,
    "error": {
      "code": "REQUEST_VALIDATION_ERROR",
      "message": "Requisição inválida",
      "details": [
        {
          "field": "horario_retorno",
          "message": "Campo não permitido."
        }
      ]
    }
  }
}
```

### ⚠️ Impacto

- Não é possível configurar ou consultar a volta da complementar, exigida para o vínculo de ida/volta do agendamento.

### Causa aparente

A migration 77, a entidade e os DTOs da complementar possuem apenas `horario_saida`. Os DTOs usam `extra="forbid"`, rejeitando `horario_retorno`.

### Critérios de aceite

- Persistir e devolver um horário de retorno no cadastro, edição e consulta.
- Exigir formato HH:MM e retorno estritamente posterior à saída; na edição parcial, comparar com o horário já salvo.
- Prever migration para registros existentes e alinhar o contrato do frontend.
- Reexecutar `CT-HU012-API-003`.

### 📎 Evidência

Reproduzido em 2026-10-27 por HTTP real e PostgreSQL isolado. Abaixo estão os JSONs das chamadas que comprovam este defeito, extraídos da execução original. Senhas, tokens e contatos foram omitidos.

**CT-HU012-API-003**

```json
{
  "case_id": "CT-HU012-API-003",
  "application_commit": "23d1063f09f13cc195da7e45422581f73e2ae6da",
  "requests": [
    {
      "sequence": 22,
      "timestamp": "2026-10-27T17:43:50.791810+00:00",
      "actor": "admin",
      "request": {
        "method": "POST",
        "url": "http://127.0.0.1:18812/rotas-complementares",
        "headers": {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": "[REDACTED]"
        },
        "json": {
          "nome": "Van Retorno 17:40",
          "horario_saida": "06:00",
          "ponto_conexao": "Trevo do Bairro Novo",
          "rota_principal_id": 1,
          "horario_retorno": "17:40"
        }
      },
      "response": {
        "status": 422,
        "headers": {
          "date": "Tue, 27 Oct 2026 17:43:50 GMT",
          "content-type": "application/json"
        },
        "json": {
          "success": false,
          "error": {
            "code": "REQUEST_VALIDATION_ERROR",
            "message": "Requisição inválida",
            "details": [
              {
                "field": "horario_retorno",
                "message": "Campo não permitido."
              }
            ]
          }
        }
      },
      "database_unchanged": true,
      "audit_delta": []
    },
    {
      "sequence": 23,
      "timestamp": "2026-10-27T17:43:50.811333+00:00",
      "actor": "admin",
      "request": {
        "method": "POST",
        "url": "http://127.0.0.1:18812/rotas-complementares",
        "headers": {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": "[REDACTED]"
        },
        "json": {
          "nome": "Van Retorno 06:00",
          "horario_saida": "06:00",
          "ponto_conexao": "Trevo do Bairro Novo",
          "rota_principal_id": 1,
          "horario_retorno": "06:00"
        }
      },
      "response": {
        "status": 422,
        "headers": {
          "date": "Tue, 27 Oct 2026 17:43:50 GMT",
          "content-type": "application/json"
        },
        "json": {
          "success": false,
          "error": {
            "code": "REQUEST_VALIDATION_ERROR",
            "message": "Requisição inválida",
            "details": [
              {
                "field": "horario_retorno",
                "message": "Campo não permitido."
              }
            ]
          }
        }
      },
      "database_unchanged": true,
      "audit_delta": []
    },
    {
      "sequence": 24,
      "timestamp": "2026-10-27T17:43:50.830201+00:00",
      "actor": "admin",
      "request": {
        "method": "POST",
        "url": "http://127.0.0.1:18812/rotas-complementares",
        "headers": {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": "[REDACTED]"
        },
        "json": {
          "nome": "Van Retorno 05:30",
          "horario_saida": "06:00",
          "ponto_conexao": "Trevo do Bairro Novo",
          "rota_principal_id": 1,
          "horario_retorno": "05:30"
        }
      },
      "response": {
        "status": 422,
        "headers": {
          "date": "Tue, 27 Oct 2026 17:43:50 GMT",
          "content-type": "application/json"
        },
        "json": {
          "success": false,
          "error": {
            "code": "REQUEST_VALIDATION_ERROR",
            "message": "Requisição inválida",
            "details": [
              {
                "field": "horario_retorno",
                "message": "Campo não permitido."
              }
            ]
          }
        }
      },
      "database_unchanged": true,
      "audit_delta": []
    },
    {
      "sequence": 25,
      "timestamp": "2026-10-27T17:43:50.849233+00:00",
      "actor": "admin",
      "request": {
        "method": "PATCH",
        "url": "http://127.0.0.1:18812/rotas-complementares/1",
        "headers": {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": "[REDACTED]"
        },
        "json": {
          "horario_retorno": "17:45"
        }
      },
      "response": {
        "status": 422,
        "headers": {
          "date": "Tue, 27 Oct 2026 17:43:50 GMT",
          "content-type": "application/json"
        },
        "json": {
          "success": false,
          "error": {
            "code": "REQUEST_VALIDATION_ERROR",
            "message": "Requisição inválida",
            "details": [
              {
                "field": "horario_retorno",
                "message": "Campo não permitido."
              }
            ]
          }
        }
      },
      "database_unchanged": true,
      "audit_delta": []
    },
    {
      "sequence": 26,
      "timestamp": "2026-10-27T17:43:50.881549+00:00",
      "actor": "admin",
      "request": {
        "method": "GET",
        "url": "http://127.0.0.1:18812/rotas-complementares/1",
        "headers": {
          "Accept": "application/json",
          "Authorization": "[REDACTED]"
        },
        "json": null
      },
      "response": {
        "status": 200,
        "headers": {
          "date": "Tue, 27 Oct 2026 17:43:50 GMT",
          "content-type": "application/json"
        },
        "json": {
          "id": 1,
          "nome": "Van 2 - Bairro Novo",
          "horario_saida": "06:00",
          "ponto_conexao": "Trevo do Bairro Novo",
          "ativo": true,
          "rota_principal": {
            "id": 1,
            "nome": "Rota Centro - UFC",
            "ativo": true
          }
        }
      }
    }
  ]
}
```

Issue no GitHub: https://github.com/GOUOCE/GOUCE-app/issues/310
