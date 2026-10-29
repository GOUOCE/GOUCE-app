# Botão “Salvar nova senha” não fica desabilitado com senhas diferentes

| Campo | Valor |
|---|---|
| **Tipo** | Bug de UX / validação |
| **Severidade** | 🟢 Baixa |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo Go) |
| **Caso relacionado** | `CT-HU004-UI-005` |
| **Documentação** | HU-004 — Testes manuais de UI: [CT-HU004-UI-005](../UI-HU-004.md#ct-hu004-ui-005--senha-e-confirmação-divergentes) |

---

### Pré-condição

Tela **Redefinir Senha** aberta por um link de recuperação válido.

### Passos para reproduzir

1. Preencher **Nova senha** com `NovaSenha@1`.
2. Preencher **Confirmar nova senha** com `NovaSenha@2`.
3. Observar o botão **Salvar nova senha** antes de tocar nele.

### ✅ Resultado esperado

O botão fica desabilitado e o app sinaliza que as senhas não coincidem, antes de qualquer toque (AC-06, FA-003). Ao corrigir a confirmação, o botão é liberado.

### ❌ Resultado obtido

- O botão continua habilitado (azul) o tempo todo.
- O aviso “As senhas não coincidem” só aparece depois de tocar no botão.
- Nada é enviado: a validação no envio funciona.

### ⚠️ Impacto

- Baixo: a senha não é alterada por engano. O usuário só descobre o erro depois de tentar salvar, o que diverge do AC-06.

### Causa aparente

- `frontend/src/app/(autenticacao)/redefinir-senha.tsx`: `useForm` sem `mode` (valida só no envio) e botão com `disabled={isLoading}` apenas.

### Sugestão

- Usar `mode: 'onChange'` no `useForm` e desabilitar o botão enquanto o formulário for inválido (`disabled={isLoading || !isValid}`).

### Critérios de aceite

- Com senha e confirmação diferentes, o botão fica desabilitado e o aviso aparece sem precisar tocar.
- Ao corrigir, o botão é liberado.
- Reexecutar `CT-HU004-UI-005`.

### 📎 Evidência
