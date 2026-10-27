# Telas de representantes não são recriadas: o cadastro reabre com a instituição e o discente da vez anterior e a seta volta ao Painel

| Campo | Valor |
|---|---|
| **Tipo** | Bug de UX |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-030` a partir da `develop` (`88eb19dc`), com as mudanças do PR #195 aplicadas |
| **Issue** | A definir |
| **Caso relacionado** | `CT-HU030-UI-001`, `CT-HU030-UI-007` |
| **Documentação** | [HU-030 — Testes manuais de UI](https://github.com/GOUOCE/GOUCE-app/blob/test/manual-ui-hu-030/tests/manual/epico-02/HU-030/ui/UI-HU-030.md#ct-hu030-ui-001--listar-ativos-e-revogados-sem-representantes-fictícios) |
| **Issue relacionada** | [#288](https://github.com/GOUOCE/GOUCE-app/issues/288) (motoristas), [#275](https://github.com/GOUOCE/GOUCE-app/issues/275) (frota), [#256](https://github.com/GOUOCE/GOUCE-app/issues/256) (faculdades) e [#245](https://github.com/GOUOCE/GOUCE-app/issues/245) (bairros) |

---

### Pré-condição

Administrador logado.

### Passos para reproduzir

1. Em **Cadastros → Representantes → + Novo**, escolher uma instituição, selecionar um discente e sair da tela sem concluir.
2. Voltar à lista e tocar em **+ Novo** de novo.
3. Tocar na seta de voltar da lista e da tela de cadastro.

### ✅ Resultado esperado

- **Cadastrar Representante** abre limpo: instituição inicial padrão, busca vazia e nenhum discente selecionado.
- A seta de voltar leva para a tela anterior.

### ❌ Resultado obtido

- Ao chegar em **Cadastrar Representante**, a tela abriu com a instituição **IFCE - Campus Quixadá** já escolhida e com o discente **QA Teste Aluno Sete** já selecionado, sem a busca preenchida (print enviado pelo testador, tirado em 2026-10-27 02:25). Eram dados da vez anterior, que não foram digitados nessa abertura.
- O testador relatou que a seta de voltar leva ao **Painel**, e não à tela anterior, como nas outras gestões.

### ⚠️ Impacto

- O administrador pode tornar representante o discente errado, com a instituição errada, sem perceber que os campos vieram preenchidos de antes. Na tela do print, a instituição escolhida (IFCE) e a do discente (UFC) nem coincidem.

### Causa aparente

- As telas ficam em abas ocultas e não são recriadas. `representantes/cadastrar.tsx` guarda `instituicao`, `busca` e o discente selecionado em estado local e usa `router.back()`; nada reinicia o estado ao entrar ou sair.

### Sugestão

- Mesma correção das #245, #256, #275 e #288: recriar as telas ao abrir, limpar o formulário (instituição padrão, busca e discente) ao entrar e ao sair, e voltar para a rota certa.

### Critérios de aceite

- **Cadastrar Representante** abre sempre limpo, sem discente nem instituição da vez anterior.
- A seta volta para a tela anterior.
- Reexecutar `CT-HU030-UI-001` e `CT-HU030-UI-007`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-27, ambiente local. O print deve ser anexado à issue pelo testador.
