# Cadastro de bairro: o ponto “Praça da Matriz” já vem preenchido e o aviso de ponto repetido aparece por baixo do modal

| Campo | Valor |
|---|---|
| **Tipo** | Bug de interface |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-007` a partir da `develop` (`5445f7b4`) |
| **Issue** | [#248](https://github.com/GOUOCE/GOUCE-app/issues/248) |
| **Caso relacionado** | `CT-HU007-UI-002`, `CT-HU007-UI-004` |
| **Documentação** | [HU-007 — Testes manuais de UI](../UI-HU-007.md#ct-hu007-ui-002--cadastrar-bairro-com-pontos-de-parada) |
| **Issue relacionada** | #210 — a API bloqueia ponto com mesmo nome em outro bairro, o que agrava o ponto padrão |

---

### Pré-condição

Administrador logado em **Bairros e pontos de parada**.

### Passos para reproduzir

1. Tocar em **Novo** e conferir a lista **Pontos de Parada**.
2. Tocar em **Adicionar ponto de parada**, digitar um nome que já está na lista (ex.: `Praça da Matriz`) e confirmar.
3. Conferir o campo do modal ao abrir.

### ✅ Resultado esperado

- **Novo** abre com a lista de pontos **vazia**; só entra o que o administrador digitar.
- O aviso “Esta localidade já está cadastrada.” aparece **na frente** do modal (ou como erro no próprio campo), visível na hora.
- O campo mostra uma só orientação (rótulo **ou** texto de ajuda).

### ❌ Resultado obtido

- **Novo** já traz o ponto `Praça da Matriz`, que o administrador não digitou; se não for removido, ele é gravado.
- O aviso de ponto repetido abre **por baixo** do modal do ponto e só fica visível depois de fechar o modal.
- O campo do modal mostra o rótulo “Nome do Ponto *” e, ao mesmo tempo, o texto “Nome do ponto de parada”.

### ⚠️ Impacto

- Pontos de exemplo vão para o banco sem querer (e, com a #210, o segundo bairro com o ponto padrão é bloqueado).
- O administrador não vê a mensagem de erro no momento do erro.

### Causa aparente

- `bairros/cadastrar.tsx`: `useState<string[]>(['Praça da Matriz'])` (linha 17) e `defaultValues.pontos` com o mesmo valor, sobra de dado de exemplo.
- O `AppPopup` é montado antes do `Portal` com o `RNModal` do ponto, então fica atrás dele.

### Sugestão

- Iniciar a lista de pontos vazia.
- Fechar o modal antes do aviso, ou mostrar o erro no próprio campo.
- Deixar só rótulo ou só placeholder no campo do modal.

### Critérios de aceite

- **Novo** abre sem pontos.
- O aviso de ponto repetido aparece na frente, na hora.
- Reexecutar `CT-HU007-UI-002` e `CT-HU007-UI-004`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-26, ambiente local.
