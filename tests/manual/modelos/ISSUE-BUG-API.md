# <Título curto: o que falha, em linguagem de quem usa>

| Campo | Valor |
|---|---|
| **Tipo** | <Bug funcional / validação / segurança / divergência de requisito> |
| **Severidade** | <🔴 Crítica / 🟠 Alta / 🟡 Média / 🟢 Baixa> |
| **Ambiente** | Branch `<feature/testes-api-hu-00X>` — <ambiente e URL>, commit `<hash>` |
| **Caso relacionado** | `CT-HU00X-API-00X` |
| **Documentação** | [HU-00X — Testes manuais de API](<caminho relativo>/API-HU-00X.md#<âncora-do-caso>) |
| **Issue relacionada** | <link, ou remover a linha> |

---

### Pré-condição

<Estado necessário antes de testar: contas, tokens, dados já cadastrados.>

### Passos para reproduzir

1. <Endpoint e método, ex.: `POST /auth/login`.>
2. <Corpo ou parâmetros enviados.>
3. <O que conferir na resposta.>

### ✅ Resultado esperado

<Status HTTP, `error.code` e comportamento esperado, conforme o caso e o critério de aceite.>

### ❌ Resultado obtido

<Status HTTP e trecho do corpo recebido.>

```json
{
}
```

### ⚠️ Impacto

- <Quem é afetado e como.>
- <Risco de segurança, dados ou integração com o app, se houver.>

### Causa aparente

<Opcional. Arquivo e linha suspeitos, se você os identificou. Remover a seção se não souber.>

### Critérios de aceite

- <O que precisa ser verdade para considerar corrigido.>
- <Caso de teste a reexecutar: `CT-HU00X-API-00X`.>

### 📎 Evidência

<Reproduzido por <testador> em <data>, ambiente <ambiente>. Anexar print da resposta (sem senhas nem tokens).>
