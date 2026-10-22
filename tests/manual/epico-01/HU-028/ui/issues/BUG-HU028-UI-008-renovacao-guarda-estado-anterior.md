# Renovar vínculo reabre no mesmo passo e com o comprovante anterior após cancelar ou concluir

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / UX |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo Go) |
| **Caso relacionado** | `CT-HU028-UI-008` (e observação após o `CT-HU028-UI-003`) |
| **Documentação** | HU-028 — Testes manuais de UI: [CT-HU028-UI-008](../UI-HU-028.md#ct-hu028-ui-008--cancelar-a-renovação-no-meio) |
| **Issue relacionada** | #125 — Editar perfil mantém valores não salvos (mesma causa) |

---

### Pré-condição

Aluno aprovado em **Perfil → Renovar vínculo**.

### Passos para reproduzir

1. **Cancelar:** iniciar a renovação, avançar até o passo 3, tocar no **X** e confirmar **Cancelar renovação?**. Abrir **Renovar vínculo** de novo.
2. **Concluir:** enviar uma renovação com sucesso e abrir **Renovar vínculo** logo em seguida.

### ✅ Resultado esperado

- Depois de cancelar, uma nova renovação começa do zero, pela tela de aviso, sem arquivos anexados.
- Depois de concluir, o app não reabre o formulário preenchido (e, com status em análise, não oferece novo envio — ver CT-HU028-UI-009).

### ❌ Resultado obtido

- Depois de cancelar, a tela reabre exatamente no passo em que o aluno saiu.
- Depois de concluir, a tela reabre direto no passo 4 com os arquivos já anexados; saindo pela seta e entrando de novo, volta ao passo 1, mas o comprovante anterior continua anexado.
- O estado só é limpo quando o aluno sai da conta e entra de novo.

### ⚠️ Impacto

- O aluno pode reenviar sem perceber o mesmo comprovante de uma renovação anterior.
- “Cancelar renovação” não cancela de fato o preenchimento, o que contradiz o próprio aviso (“todas as alterações feitas serão perdidas”).

### Causa aparente

- `frontend/src/app/(aluno)/_layout.tsx`: `renovar-vinculo` é uma aba oculta (`href: null`); abas não são desmontadas ao sair, então o estado (`passo` e o formulário) permanece.
- `frontend/src/app/(aluno)/renovar-vinculo.tsx`: ao cancelar ou concluir, o formulário e o `passo` não são reiniciados.

### Sugestão

- Reiniciar o formulário e voltar `passo` para 0 ao cancelar e após o sucesso (`reset()` + `setPasso(0)`), ou reiniciar ao ganhar foco (`useFocusEffect`).
- Corrigir junto com a #125 (mover as telas ocultas da área do aluno para uma `Stack`).

### Critérios de aceite

- Depois de cancelar ou concluir, **Renovar vínculo** abre na tela de aviso e sem arquivos.
- Reexecutar `CT-HU028-UI-008` e `CT-HU028-UI-009`.

### 📎 Evidência
