# Edição de bairro não permite inativar nem reativar um ponto, e “Mostrar inativos” não mostra pontos inativos

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / requisito |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-007` a partir da `develop` (`5445f7b4`) |
| **Issue** | [#247](https://github.com/GOUOCE/GOUCE-app/issues/247) |
| **Caso relacionado** | `CT-HU007-UI-007`, `CT-HU007-UI-009` |
| **Documentação** | [HU-007 — Testes manuais de UI](../UI-HU-007.md#ct-hu007-ui-007--inativar-ponto-e-último-ponto) |
| **Issue relacionada** | #211 (Back) — a API apaga o ponto removido em vez de inativá-lo |

---

### Pré-condição

Administrador logado. Bairro `Centro QA` com os pontos `Praça José de Barros`, `Mercado Público` e `Posto de Saúde`.

### Passos para reproduzir

1. Abrir o `Centro QA` em **Editar**, tocar na lixeira do ponto `Mercado Público` e salvar.
2. Na listagem, ligar **Mostrar inativos** e procurar o ponto.
3. Abrir o `Centro QA` de novo e adicionar outra vez `Mercado Público`.

### ✅ Resultado esperado

- O ponto fica **inativo** (não apagado) e aparece identificado como inativo com **Mostrar inativos** ligado (AC-04, AC-05, AC-09).
- Existe ação para **reativar** o ponto.
- Readicionar o nome de um ponto inativo é bloqueado com “Esta localidade já está cadastrada.” ou a tela oferece reativá-lo (AC-03).

### ❌ Resultado obtido

- A lixeira só tira o ponto da lista do formulário; não há ação de inativar nem de reativar ponto.
- O ponto não aparece em nenhum lugar com **Mostrar inativos** ligado, e foi possível cadastrar `Mercado Público` de novo sem aviso.

### ⚠️ Impacto

- A regra de soft delete de pontos (AC-05, RF-014) não pode ser usada pela tela.
- Mesmo depois de corrigir a #211, a tela continuaria sem mostrar nem reativar pontos inativos.

### Causa aparente

- `bairros/editar.tsx`: `handleRemoverPonto` apenas remove o item da lista local e a tela envia a lista completa de nomes; não existe status de ponto no formulário.
- `bairros/index.tsx`: a seção **Inativos** lista só bairros.

### Sugestão

- Depois da #211 (a API passa a inativar e devolver o status do ponto): mostrar o status de cada ponto no formulário, com ação de inativar e de reativar, e listar pontos inativos identificados em **Mostrar inativos**.
- Ao readicionar um nome inativo, bloquear ou oferecer a reativação.

### Critérios de aceite

- Ponto retirado fica inativo, aparece identificado e pode ser reativado.
- Readicionar um nome inativo é bloqueado ou oferece reativar.
- Reexecutar `CT-HU007-UI-007` e `CT-HU007-UI-009`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-26, ambiente local.
