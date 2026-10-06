# Aplicar a máscara de telefone em Meu Perfil e em Editar perfil, como no cadastro

| Campo | Valor |
|---|---|
| **Tipo** | Melhoria |
| **Severidade** | 🟢 Baixa |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo Go) |
| **Caso relacionado** | `CT-HU005-UI-001`, `CT-HU005-UI-002` |
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

### ⚠️ Impacto

- Baixo: o dado é salvo corretamente. A leitura do número fica mais difícil e a experiência fica diferente do cadastro.

### Causa aparente

- `frontend/src/app/(aluno)/perfil.tsx`: exibe `user?.telefone` sem formatação.
- `frontend/src/app/(aluno)/editar-perfil.tsx`: campo `telefone` sem máscara.
- O cadastro já tem a lógica em `frontend/src/components/cadastro/Passo3ContatoVinculo.tsx` (`formatarTelefone` + exibição só de dígitos durante a edição e máscara no `onBlur`).

### Sugestão

- Extrair `formatarTelefone` para `frontend/src/utils/` e reutilizar no cadastro, em **Meu Perfil** e em **Editar perfil**.

### Critérios de aceite

- **Meu Perfil** exibe o telefone formatado.
- **Editar perfil** usa a mesma máscara do cadastro (dígitos ao editar, formatado ao sair do campo).
- Reexecutar `CT-HU005-UI-001`, `CT-HU005-UI-002` e `CT-HU005-UI-003`.

### 📎 Evidência
