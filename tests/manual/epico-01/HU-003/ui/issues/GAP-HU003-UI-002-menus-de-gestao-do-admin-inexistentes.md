# Área do administrador sem os menus de gestão previstos na HU-003

| Campo | Valor |
|---|---|
| **Tipo** | Funcionalidade não implementada (requisito não atendido) |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo Go) |
| **Caso relacionado** | `CT-HU003-UI-002` |
| **Documentação** | HU-003 — Testes manuais de UI: [CT-HU003-UI-002](../UI-HU-003.md#ct-hu003-ui-002--menus-do-administrador) |
| **Issue relacionada** | #101 — administrador sem acesso ao Sair (aba Mais desativada) |

---

### Pré-condição

Administrador ativo logado no **Painel** no iPhone.

### Passos para reproduzir

1. Conferir as abas inferiores e os atalhos do **Painel**.
2. Tocar em cada aba e em cada atalho.

### ✅ Resultado esperado

Acesso aos menus de gestão do requisito e do BDD: **Gestão de Frota**, **Gestão de Motoristas**, **Gestão de Rotas**, **Gestão de Faculdades**, **Relatórios** e **Mural de Avisos** (AC-04, RN-006).

### ❌ Resultado obtido

- O **Painel** mostra apenas **Resumo de hoje** (Solicitações pendentes e Alunos ativos) e os atalhos **Fila de solicitações** e **Gestão de administradores**.
- Os números do resumo são fixos no código (`3` e `42`).
- Nenhum atalho abre tela, e as abas **Cadastros**, **Logística** e **Mais** não respondem ao toque.
- Nenhum dos seis menus de gestão do requisito existe.

### ⚠️ Impacto

- O administrador não consegue executar nenhuma função de gestão pelo app, inclusive aprovar cadastros de alunos. Nos testes, a aprovação teve de ser feita pela API.
- O painel exibe números fictícios, que podem ser confundidos com dados reais.

### Causa aparente

- `frontend/src/app/(administrador)/home.tsx`: `SummaryCard` com valores fixos e `ActionItem` sem `onPress`.
- `frontend/src/app/(administrador)/_layout.tsx`: abas `cadastros`, `logistica` e `mais` com `tabBarButton` em `pointerEvents="none"`.
- `cadastros.tsx` e `logistica.tsx` são telas provisórias que só exibem o título.

### Critérios de aceite

- A área do administrador dá acesso aos menus de gestão do AC-04 (ou o time registra quais ficam para HUs futuras).
- Os números do painel vêm da API, ou o painel deixa claro que é provisório.
- Reexecutar `CT-HU003-UI-002` e `CT-HU003-UI-004`.

### 📎 Evidência
