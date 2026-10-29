# Aplicar a máscara e as mensagens de telefone do cadastro em Meu Perfil e em Editar perfil

| Campo | Valor |
|---|---|
| **Tipo** | Melhoria |
| **Severidade** | 🟢 Baixa |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo Go) |
| **Caso relacionado** | `CT-HU005-UI-001`, `CT-HU005-UI-002`, `CT-HU005-UI-003` |
| **Issue relacionada** | [BUG-HU005-UI-003-validacao-telefone-fraca-no-perfil](BUG-HU005-UI-003-validacao-telefone-fraca-no-perfil.md) |
| **Documentação** | HU-005 — Testes manuais de UI: [CT-HU005-UI-002](../UI-HU-005.md#ct-hu005-ui-002--editar-telefone-e-bairro) |

---

### Pré-condição

Aluno ativo logado, na aba **Perfil**.

### Passos para reproduzir

1. Conferir o telefone em **Meu Perfil**.
2. Tocar em **Editar perfil** e conferir o campo **Telefone**.

### ✅ Resultado esperado

O telefone aparece formatado, como no cadastro: `(31) 99781-4542`. No campo de edição, a máscara é aplicada ao sair do campo, com o mesmo comportamento do Passo 3 do cadastro.

### ❌ Resultado obtido

- **Meu Perfil** mostra só os dígitos (ex.: `31997814542`).
- **Editar perfil** também exibe e aceita o telefone sem máscara.
- As mensagens de erro são diferentes das do cadastro: no perfil, “O telefone deve ter pelo menos 10 dígitos com DDD” vale até para o campo vazio; no cadastro há “Informe DDD e número com 9 dígitos”, “DDD inválido” e “O celular deve começar com 9 depois do DDD”.

### ⚠️ Impacto

- Baixo: o dado é salvo corretamente. A leitura do número fica mais difícil e a experiência fica diferente do cadastro.

### Causa aparente

- `frontend/src/app/(aluno)/perfil.tsx`: exibe `user?.telefone` sem formatação.
- `frontend/src/app/(aluno)/editar-perfil.tsx`: campo `telefone` sem máscara.
- O cadastro já tem a lógica em `frontend/src/components/cadastro/Passo3ContatoVinculo.tsx` (`formatarTelefone` + exibição só de dígitos durante a edição e máscara no `onBlur`).

### Sugestão

- Extrair `formatarTelefone` para `frontend/src/utils/` e reutilizar no cadastro, em **Meu Perfil** e em **Editar perfil**.
- Usar no `perfilSchema` o mesmo `telefoneSchema` do cadastro, para ter as mesmas regras e mensagens (mais claras e acessíveis), incluindo uma mensagem própria para o campo vazio.

### Critérios de aceite

- **Meu Perfil** exibe o telefone formatado.
- **Editar perfil** usa a mesma máscara do cadastro (dígitos ao editar, formatado ao sair do campo).
- As mensagens de erro do telefone são as mesmas do cadastro.
- Reexecutar `CT-HU005-UI-001`, `CT-HU005-UI-002` e `CT-HU005-UI-003`.

### 📎 Evidência
