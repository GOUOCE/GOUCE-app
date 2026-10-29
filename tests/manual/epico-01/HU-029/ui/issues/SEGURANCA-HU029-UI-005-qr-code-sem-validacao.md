# QR Code da carteirinha não pode ser validado e pode ser forjado

| Campo | Valor |
|---|---|
| **Tipo** | Segurança |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo Go) |
| **Caso relacionado** | `CT-HU029-UI-005` |
| **Documentação** | HU-029 — Testes manuais de UI: [CT-HU029-UI-005](../UI-HU-029.md#ct-hu029-ui-005--leitura-do-qr-code) |

---

### Pré-condição

Aluno aprovado com a carteirinha aberta.

### Passos para reproduzir

1. Ler o QR Code da carteirinha com a câmera de outro aparelho.
2. Conferir o conteúdo.

### ✅ Resultado esperado

O QR Code permite ao validador do embarque comprovar que a carteirinha é autêntica e está vigente (ex.: identificador assinado pelo backend ou código verificável na API), sem expor dados desnecessários.

### ❌ Resultado obtido

O QR Code contém um JSON montado no próprio app:

```json
{"id": 2, "email": "qa.hu005@gmail.com", "token": "eyJhbGciOiJIUzI1NiIs"}
```

- `token` são os 20 primeiros caracteres do JWT da sessão, que correspondem ao cabeçalho fixo (`{"alg":"HS256",`): é igual para todos e não comprova nada.
- Não há assinatura nem validade: qualquer pessoa pode gerar um QR igual com o id e o e-mail de outro aluno.

### ⚠️ Impacto

- Um validador não consegue distinguir uma carteirinha verdadeira de uma forjada, nem saber se o aluno ainda está aprovado.
- O e-mail do aluno é exposto a quem ler o QR.

### Causa aparente

`frontend/src/app/(aluno)/carteirinha-digital.tsx`, linhas 68 a 72: `qrcodeValue = JSON.stringify({ id, email, token: token.slice(0, 20) })`.

### Sugestão

- Gerar no backend um código da carteirinha assinado (ex.: JWT próprio com id, validade e status), com uma rota de validação para o leitor do embarque.
- Não incluir e-mail nem partes do token de sessão no QR.

### Critérios de aceite

- O QR só é aceito pelo validador quando gerado pelo backend para um aluno aprovado e dentro da validade.
- Reexecutar `CT-HU029-UI-005`.

### 📎 Evidência
