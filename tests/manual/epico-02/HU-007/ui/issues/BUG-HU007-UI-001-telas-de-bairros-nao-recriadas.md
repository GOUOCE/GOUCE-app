# Telas de bairros não são recriadas: a seta volta ao Painel, os formulários não limpam e a edição não é descartada

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / UX |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-007` a partir da `develop` (`5445f7b4`) |
| **Issue** | [#245](https://github.com/GOUOCE/GOUCE-app/issues/245) |
| **Caso relacionado** | `CT-HU007-UI-001`, `CT-HU007-UI-002`, `CT-HU007-UI-010` |
| **Documentação** | [HU-007 — Testes manuais de UI](../UI-HU-007.md#ct-hu007-ui-001--acessar-a-gestão-de-bairros) |
| **Issue relacionada** | #125, #135, #151, #155 e #156 — mesma causa (telas que não são desmontadas), já corrigida na gestão de administradores |

---

### Pré-condição

Administrador logado em **Cadastros → Bairros e pontos de parada**.

### Passos para reproduzir

1. Na listagem de bairros, tocar na seta de voltar.
2. Voltar à listagem, tocar em **Novo** e tocar na seta de voltar.
3. Em **Novo**, preencher o nome e um ponto, finalizar o cadastro e tocar em **Novo** outra vez; abrir **Adicionar ponto de parada** e conferir o campo do nome.
4. Abrir o `Centro QA` em **Editar**, alterar o nome (sem salvar), tocar na seta de voltar e abrir o mesmo bairro em **Editar** de novo.

### ✅ Resultado esperado

- A seta da listagem volta para **Cadastros**; a seta de **Novo** e **Editar** volta para a listagem de bairros.
- **Novo** abre sempre com o formulário e o modal de ponto vazios.
- A seta de **Editar** pede confirmação antes de descartar alterações; ao reabrir, a tela mostra os dados salvos (mesmo padrão cobrado na #156).

### ❌ Resultado obtido

- As duas setas levam ao **Painel**, e não à tela anterior.
- **Novo** continua com o nome e os pontos do cadastro anterior; o modal de ponto mantém o texto digitado antes.
- **Editar** sai sem pedir confirmação e, ao reabrir o mesmo bairro, mostra o nome digitado e não salvo. Nada é gravado: o banco continua com o nome original.

### ⚠️ Impacto

- O administrador acha que a alteração foi salva ou salva por engano dados de uma tentativa anterior.
- A navegação quebrada obriga a refazer o caminho pelo Painel.

### Causa aparente

- As telas `bairros/index`, `cadastrar` e `editar` ficam numa aba oculta (`href: null` em `(administrador)/_layout.tsx`), sem `_layout.tsx` próprio, e não são desmontadas; o `router.back()` cai na primeira aba.
- `editar.tsx` carrega os dados em `useEffect` com `[id]` e só recarrega quando o `id` muda; `cadastrar.tsx` guarda os campos em `useState` e não limpa ao sair.

### Sugestão

- Aplicar nos bairros o padrão já usado em `administradores` (commit `7b903360`): `useFocusEffect` com `reset()` ao ganhar e ao perder o foco, e voltar à tela correta.
- Pedir confirmação ao sair de **Editar** com alterações (#156).
- Corrigir também em `faculdades`, que tem a mesma estrutura de pastas.

### Critérios de aceite

- Setas de voltar levam à tela anterior.
- **Novo** e o modal de ponto abrem sempre vazios.
- **Editar** pede confirmação e reabre com os dados salvos.
- Reexecutar `CT-HU007-UI-001`, `CT-HU007-UI-002` e `CT-HU007-UI-010`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-26, ambiente local.
