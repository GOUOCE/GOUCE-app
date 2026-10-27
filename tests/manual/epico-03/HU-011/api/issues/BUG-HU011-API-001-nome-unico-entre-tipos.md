# HU-011/HU-012: nome de rota já usado no outro tipo é aceito com 201

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / divergência de requisito |
| **Severidade** | 🟠 Alta — não bloqueante para os demais fluxos |
| **Ambiente** | HTTP local, PostgreSQL 15 e MinIO isolados; branches `feat/front-hu011` e `feat/front-hu012`; commits de aplicação `671a6e0df3d00016e87477deb326dfdb7c33b364` e `23d1063f09f13cc195da7e45422581f73e2ae6da` |
| **Caso relacionado** | `CT-HU011-API-004`, `CT-HU012-API-004` |
| **Issue relacionada** | [Decisões oficiais do PO #208](https://github.com/GOUOCE/GOUCE-app/issues/208#issuecomment-6430972445) |

---

### Pré-condição

Administrador autenticado; complementar `Van Trevo` já cadastrada (inclusive inativa) e principal `Rota Centro - UFC` existente. Massa criada pela API; autenticação real via `/auth/login`.

### Passos para reproduzir

1. Criar uma complementar com nome `Van Trevo` e depois inativá-la.
2. Enviar `POST /rotas-principais` com nome `Van Trevo`, horários válidos e bairros/faculdades ativos.
3. No outro sentido, cadastrar `POST /rotas-complementares` com nome `Rota Centro - UFC` já usado por uma principal.
4. Consultar a API e o PostgreSQL para conferir os dois registros.

### ✅ Resultado esperado

HTTP **409**, `error.code: CONFLICT`, sem nova rota nem auditoria de criação. O nome precisa ser único entre principais e complementares, com trim, sem diferenciar maiúsculas e contra registros ativos/inativos (#208, item 1).

### ❌ Resultado obtido

As duas chamadas retornam **201** e persistem o nome duplicado entre tabelas. A unicidade dentro do mesmo tipo funciona, inclusive com maiúsculas/espaços e registros inativos.

Exemplo real do POST de principal:

```json
{
  "request": {
    "nome": "Van Trevo",
    "horario_saida": "06:30",
    "horario_retorno": "17:30",
    "bairros_ids": [
      1
    ],
    "faculdades_ida_ids": [
      1
    ],
    "faculdades_volta_ids": [
      1
    ]
  },
  "status": 201,
  "response": {
    "success": true,
    "message": "Operação realizada com sucesso",
    "data": {
      "id": 7,
      "nome": "Van Trevo",
      "horario_saida": "06:30",
      "horario_retorno": "17:30",
      "ativo": true,
      "bairros": [
        {
          "id": 1,
          "nome": "Centro"
        }
      ],
      "faculdades_ida": [
        {
          "id": 1,
          "nome": "UFC",
          "campus": "Campus Quixadá"
        }
      ],
      "faculdades_volta": [
        {
          "id": 1,
          "nome": "UFC",
          "campus": "Campus Quixadá"
        }
      ]
    }
  }
}
```

### ⚠️ Impacto

- Rota principal e complementar podem ter a mesma identificação, contrariando a regra confirmada pelo PO.
- O problema ocorre nas duas direções, não apenas no cadastro de complementares.

### Causa aparente

`nome_em_uso` em `rota_principal_repository.py` e `rota_complementar_repository.py` consulta somente sua própria tabela. Os índices únicos também são separados por tabela.

### Critérios de aceite

- Validar o nome nos dois tipos, no cadastro e na edição, contra ativos e inativos, preservando trim/case-insensitive.
- A recusa retorna 409, não persiste alterações nem audita uma criação/edição recusada.
- Reexecutar os dois CT-004, preservando o controle de edição com o próprio nome.

### 📎 Evidência

Reproduzido em 2026-10-27 por HTTP real e PostgreSQL isolado. Abaixo estão os JSONs das chamadas que comprovam este defeito, extraídos da execução original. Senhas, tokens e contatos foram omitidos.

**CT-HU011-API-004**

```json
{
  "case_id": "CT-HU011-API-004",
  "application_commit": "671a6e0df3d00016e87477deb326dfdb7c33b364",
  "requests": [
    {
      "sequence": 107,
      "timestamp": "2026-10-27T17:43:52.874220+00:00",
      "actor": "admin",
      "request": {
        "method": "POST",
        "url": "http://127.0.0.1:18811/rotas-principais",
        "headers": {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": "[REDACTED]"
        },
        "json": {
          "nome": "Van Trevo",
          "horario_saida": "06:30",
          "horario_retorno": "17:30",
          "bairros_ids": [
            1
          ],
          "faculdades_ida_ids": [
            1
          ],
          "faculdades_volta_ids": [
            1
          ]
        }
      },
      "response": {
        "status": 201,
        "headers": {
          "date": "Tue, 27 Oct 2026 17:43:52 GMT",
          "content-type": "application/json"
        },
        "json": {
          "success": true,
          "message": "Operação realizada com sucesso",
          "data": {
            "id": 7,
            "nome": "Van Trevo",
            "horario_saida": "06:30",
            "horario_retorno": "17:30",
            "ativo": true,
            "bairros": [
              {
                "id": 1,
                "nome": "Centro"
              }
            ],
            "faculdades_ida": [
              {
                "id": 1,
                "nome": "UFC",
                "campus": "Campus Quixadá"
              }
            ],
            "faculdades_volta": [
              {
                "id": 1,
                "nome": "UFC",
                "campus": "Campus Quixadá"
              }
            ]
          }
        }
      },
      "database_unchanged": false,
      "audit_delta": [
        {
          "id": 22,
          "usuario_id": 1,
          "acao": "CRIAR",
          "entidade": "rota_principal",
          "entidade_id": "7",
          "valor_anterior": null,
          "valor_novo": "{\"ativo\": true, \"bairros_ids\": [1], \"faculdades_ida_ids\": [1], \"faculdades_volta_ids\": [1], \"horario_retorno\": \"17:30\", \"horario_saida\": \"06:30\", \"nome\": \"Van Trevo\"}",
          "criado_em": "2026-10-27T17:43:52.895081+00:00"
        }
      ],
      "database_records_with_same_name": [
        {
          "table": "rota_principal",
          "row": {
            "id": 7,
            "nome": "Van Trevo",
            "horario_saida": "06:30:00",
            "horario_retorno": "17:30:00",
            "ativo": true,
            "data_criacao": "2026-10-27T17:43:52.892669+00:00"
          }
        },
        {
          "table": "rota_complementar",
          "row": {
            "id": 1,
            "rota_principal_id": 1,
            "nome": "Van Trevo",
            "horario_saida": "06:00:00",
            "ponto_conexao": "Trevo do Bairro Novo",
            "ativo": false,
            "data_criacao": "2026-10-27T17:43:52.714699+00:00"
          }
        }
      ]
    }
  ]
}
```

**CT-HU012-API-004**

```json
{
  "case_id": "CT-HU012-API-004",
  "application_commit": "23d1063f09f13cc195da7e45422581f73e2ae6da",
  "requests": [
    {
      "sequence": 30,
      "timestamp": "2026-10-27T17:43:50.965315+00:00",
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
          "nome": "Rota Centro - UFC",
          "horario_saida": "06:00",
          "ponto_conexao": "Trevo do Bairro Novo",
          "rota_principal_id": 1
        }
      },
      "response": {
        "status": 201,
        "headers": {
          "date": "Tue, 27 Oct 2026 17:43:50 GMT",
          "content-type": "application/json"
        },
        "json": {
          "success": true,
          "message": "Operação realizada com sucesso",
          "data": {
            "id": 3,
            "nome": "Rota Centro - UFC",
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
      },
      "database_unchanged": false,
      "audit_delta": [
        {
          "id": 9,
          "usuario_id": 1,
          "acao": "CRIAR",
          "entidade": "rota_complementar",
          "entidade_id": "3",
          "valor_anterior": null,
          "valor_novo": "{\"ativo\": true, \"horario_saida\": \"06:00\", \"nome\": \"Rota Centro - UFC\", \"ponto_conexao\": \"Trevo do Bairro Novo\", \"rota_principal_id\": 1}",
          "criado_em": "2026-10-27T17:43:50.981790+00:00"
        }
      ],
      "database_records_with_same_name": [
        {
          "table": "rota_principal",
          "row": {
            "id": 1,
            "nome": "Rota Centro - UFC",
            "horario_saida": "06:30:00",
            "horario_retorno": "17:30:00",
            "ativo": true,
            "data_criacao": "2026-10-27T17:43:50.557108+00:00"
          }
        },
        {
          "table": "rota_complementar",
          "row": {
            "id": 3,
            "rota_principal_id": 1,
            "nome": "Rota Centro - UFC",
            "horario_saida": "06:00:00",
            "ponto_conexao": "Trevo do Bairro Novo",
            "ativo": true,
            "data_criacao": "2026-10-27T17:43:50.981053+00:00"
          }
        }
      ]
    }
  ]
}
```

Issue no GitHub: https://github.com/GOUOCE/GOUCE-app/issues/309
