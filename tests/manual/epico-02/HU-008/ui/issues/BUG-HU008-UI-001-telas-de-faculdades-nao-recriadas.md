# Telas de faculdades não são recriadas: a seta volta ao Painel, os formulários não limpam e a edição não é descartada

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / UX |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-008` a partir da `develop` (`a35ceff7`) |
| **Issue** | [#256](https://github.com/GOUOCE/GOUCE-app/issues/256) |
| **Caso relacionado** | `CT-HU008-UI-001`, `CT-HU008-UI-002`, `CT-HU008-UI-009` |
| **Documentação** | [HU-008 — Testes manuais de UI](https://github.com/GOUOCE/GOUCE-app/blob/test/manual-ui-hu-008/tests/manual/epico-02/HU-008/ui/UI-HU-008.md#ct-hu008-ui-001--acessar-a-gestão-de-faculdades) |
| **Issue relacionada** | #245 (mesmo defeito nos bairros, que já cita faculdades), #156 e #125 — mesma causa; PR #253 (HU-007) mexe nestes arquivos |

---

### Pré-condição

Administrador logado em **Cadastros → Faculdades**.

### Passos para reproduzir

1. Na listagem de faculdades, tocar na seta de voltar.
2. Voltar à listagem, tocar em **Cadastrar** e tocar na seta de voltar; repetir em **Editar**.
3. Em **Cadastrar**, preencher os campos, finalizar o cadastro e abrir **Cadastrar** de novo.
4. Abrir uma faculdade em **Editar**, alterar o nome (sem salvar), tocar na seta de voltar e abrir a mesma faculdade de novo.

### ✅ Resultado esperado

- A seta da listagem volta para **Cadastros**; a de **Cadastrar** e **Editar** volta para a listagem de faculdades.
- **Cadastrar** abre sempre com os campos vazios.
- A seta de **Editar** pede confirmação antes de descartar alterações; ao reabrir, a tela mostra os dados salvos (padrão cobrado na #156).

### ❌ Resultado obtido

- As três setas levam ao **Painel**, e não à tela anterior.
- **Cadastrar** e **Editar** reabrem com os dados da vez anterior (nome, sigla e campus), tanto ao sair sem salvar quanto ao salvar e voltar.
- **Editar** sai sem pedir confirmação. Nada é gravado: o log da API não registra `PATCH` e o banco mantém os dados originais.

### ⚠️ Impacto

- O administrador acha que a alteração foi salva ou envia dados de uma tentativa anterior.
- A navegação quebrada obriga a refazer o caminho pelo Painel.

### Causa aparente

- As telas `faculdades/index`, `cadastrar` e `editar` ficam numa aba oculta, sem `_layout.tsx` próprio, e não são desmontadas; `router.back()` cai na primeira aba.
- `editar.tsx` carrega os dados em `useEffect` com `[id]` e só recarrega quando o `id` muda; `cadastrar.tsx` guarda os campos em `useForm` e não limpa ao sair; não há checagem de alteração pendente.

### Sugestão

- Aplicar o padrão de `administradores` (commit `7b903360`): `useFocusEffect` com `reset()` ao ganhar e ao perder o foco, e voltar à tela correta.
- Pedir confirmação ao sair de **Editar** com alterações.

### Critérios de aceite

- Setas de voltar levam à tela anterior.
- **Cadastrar** abre sempre vazio.
- **Editar** pede confirmação e reabre com os dados salvos.
- Reexecutar `CT-HU008-UI-001`, `CT-HU008-UI-002` e `CT-HU008-UI-009`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-26, ambiente local.
