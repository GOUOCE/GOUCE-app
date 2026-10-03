# Turno do curso sem as opções aceitas pela API impede concluir o cadastro

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo) |
| **Caso relacionado** | `CT-HU001-UI-002` |
| **Documentação** | HU-001 — Testes manuais de UI: [CT-HU001-UI-002](../UI-HU-001.md#ct-hu001-ui-002--cadastro-concluído-com-sucesso) |
| **Issue relacionada** | [BUG-HU001-UI-006-mensagem-erro-object-object](BUG-HU001-UI-006-mensagem-erro-object-object.md) |

---

### Pré-condição

Usuário sem sessão autenticada em **Criar conta** no iPhone, com os demais campos preenchidos com a massa válida das pré-condições PC-02 a PC-04 da suíte.

### Passos para reproduzir

1. Preencher todas as etapas com a massa válida, escolhendo um turno do seletor.
2. Anexar os dois comprovantes e aceitar os termos.
3. Tocar em **Concluir cadastro**.

### ✅ Resultado esperado

Informar que o cadastro foi enviado para análise e direcionar para o login.

### ❌ Resultado obtido

A API recusou o cadastro com HTTP `400` e a mensagem “Turno do curso inválido. Opções permitidas: Matutino, Vespertino, Noturno ou Integral”. Essas opções não estavam disponíveis no seletor da interface. O cadastro não foi concluído.

### ⚠️ Impacto

- Nenhum aluno conseguia concluir o cadastro pela interface na versão testada.
- Bloqueava a verificação completa do CT-HU001-UI-006.

### Causa aparente

Na versão atual do código, o seletor de turno (`frontend/src/components/cadastro/Passo3ContatoVinculo.tsx:187`) já oferece Matutino, Vespertino, Noturno e Integral, e durante os testes um cadastro foi aceito (status pendente, ID 5). O defeito provavelmente já foi corrigido; confirmar com o reteste antes de fechar a issue.

### Critérios de aceite

- O seletor de turno oferece somente valores aceitos pela API.
- Um cadastro válido é concluído e direciona para o login.
- Reexecutar `CT-HU001-UI-002` e `CT-HU001-UI-006`.

### 📎 Evidência

```
LOG  [API ERROR] 400 POST /usuarios/cadastrar {
  "detail": {
    "erros": [
      "Turno do curso inválido. Opções permitidas: Matutino, Vespertino, Noturno ou Integral"
    ]
  }
}
```
