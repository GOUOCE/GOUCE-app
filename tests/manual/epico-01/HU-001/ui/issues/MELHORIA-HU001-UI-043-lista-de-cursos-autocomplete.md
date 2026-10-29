# Lista de cursos limitada e “Outro” sem campo para informar o curso

| Campo | Valor |
|---|---|
| **Tipo** | Melhoria |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo) |
| **Caso relacionado** | `CT-HU001-UI-043` |
| **Documentação** | HU-001 — Testes manuais de UI: [CT-HU001-UI-043](../UI-HU-001.md#ct-hu001-ui-043--selecionar-e-alterar-dados-acadêmicos) |
| **Issue relacionada** | [IDEIA-HU001-UI-043-base-oficial-de-cursos](IDEIA-HU001-UI-043-base-oficial-de-cursos.md) |

---

### Pré-condição

Usuário sem sessão autenticada em **Criar conta** no iPhone, com os demais campos preenchidos com a massa válida das pré-condições PC-02 a PC-04 da suíte.

### Passos para reproduzir

1. Na etapa **Contato e Vínculo**, abrir o seletor **Curso**.
2. Escolher **Outro**.

### ✅ Resultado esperado

Permitir encontrar o curso real do aluno e, em “Outro”, informar o nome do curso.

### ❌ Resultado obtido

Há apenas 4 cursos (Engenharia de Software, Sistemas de Informação, Ciência da Computação e Medicina) e a opção Outro, que não permite informar o curso. O formulário original tinha muito mais opções.

### ⚠️ Impacto

- Alunos da maioria dos cursos não encontram o próprio curso e o cadastro fica sem essa informação.

### Causa aparente

Opções fixas em `frontend/src/components/cadastro/Passo3ContatoVinculo.tsx:133`.

### Critérios de aceite

- O campo Curso usa busca com autocomplete: o usuário digita as primeiras letras e a lista é filtrada em tempo real.
- Ao escolher Outro, aparece um campo para digitar o nome do curso.
- Reexecutar `CT-HU001-UI-043`.

### 📎 Evidência
