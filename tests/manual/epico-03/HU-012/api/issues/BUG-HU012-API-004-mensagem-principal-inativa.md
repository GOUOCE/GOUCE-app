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

Reproduzido em 2026-10-27, HTTP real e PostgreSQL isolado. [CT-HU012-API-010 JSON](https://github.com/GOUOCE/GOUCE-app/blob/feat/front-hu012/tests/manual/epico-03/HU-012/api/evidencias/CT-HU012-API-010.json). Respostas e consultas de persistência/auditoria estão preservadas; evidências entram nos PRs #194/#182 conforme a HU.

Issue no GitHub: https://github.com/GOUOCE/GOUCE-app/issues/312
