# <Título curto: o que falha, em linguagem de quem usa>

| Campo | Valor |
|---|---|
| **Tipo** | <Bug funcional / validação / segurança / divergência de requisito> |
| **Severidade** | <🔴 Crítica / 🟠 Alta / 🟡 Média / 🟢 Baixa> |
| **Ambiente** | Branch `<test/execucao-ui-hu-00X>` — <navegador/dispositivo e versão>, URL do front `<url>`, API `<url>`, commit `<hash>` |
| **Caso relacionado** | `CT-HU00X-UI-00X` |
| **Documentação** | [HU-00X — Testes manuais de UI](<caminho relativo>/UI-HU-00X.md#<âncora-do-caso>) |
| **Issue relacionada** | <link, inclusive de issue de API com a mesma causa, ou remover a linha> |

---

### Pré-condição

<Perfil e login usado, sem senha; dados da massa já preparados; tela de partida.>

### Passos para reproduzir

1. <Tela e ação, ex.: tocar em "Confirmar distribuição".>
2. <Campo preenchido, opção escolhida ou botão tocado.>
3. <O que conferir na tela.>

### ✅ Resultado esperado

<O que a tela deve mostrar, com os textos exatos, conforme o caso e o critério de aceite.>

### ❌ Resultado obtido

<O que a tela mostrou, com os textos exatos. Se a causa estiver na API, incluir o trecho da resposta vista na aba Network.>

```json
{
}
```

<Remover este bloco se a causa não estiver na API.>

### ⚠️ Impacto

- <Quem é afetado e como.>
- <Risco de segurança, dados ou integração com o app, se houver.>

### Causa aparente

<Opcional. Arquivo e linha suspeitos, se você os identificou. Remover a seção se não souber.>

### Critérios de aceite

- <O que precisa ser verdade para considerar corrigido.>
- <Caso de teste a reexecutar: `CT-HU00X-UI-00X`.>

### 📎 Evidência

<Reproduzido por <testador> em <data>, ambiente <ambiente>. Anexar print ou GIF (sem tokens nem dados pessoais).>
