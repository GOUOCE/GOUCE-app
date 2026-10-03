# Semestre atual vai só até o 10º, mas o backend aceita até o 16º

| Campo | Valor |
|---|---|
| **Tipo** | Divergência de requisito — discutir com o time |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo) |
| **Caso relacionado** | `CT-HU001-UI-044` |
| **Documentação** | HU-001 — Testes manuais de UI: [CT-HU001-UI-044](../UI-HU-001.md#ct-hu001-ui-044--quantidade-de-semestres-extremos-do-seletor) |
| **Issue relacionada** | [MELHORIA-HU001-UI-043-coerencia-periodo-semestre](MELHORIA-HU001-UI-043-coerencia-periodo-semestre.md) |

---

### Pré-condição

Usuário sem sessão autenticada em **Criar conta** no iPhone, com os demais campos preenchidos com a massa válida das pré-condições PC-02 a PC-04 da suíte.

### Passos para reproduzir

1. Na etapa **Contato e Vínculo**, abrir o seletor **Semestre Atual**.
2. Conferir a última opção disponível.

### ✅ Resultado esperado

Tela e backend com o mesmo limite de semestres, definido pelo time.

### ❌ Resultado obtido

A tela oferece de 1º a 10º semestre, enquanto o backend aceita de 1 a 16. Alunos de cursos longos, como Medicina (12 semestres), não conseguem informar o semestre.

### ⚠️ Impacto

- Alunos de cursos com mais de 10 semestres, ou que atrasaram o curso, ficam sem opção válida.

### Causa aparente

`frontend/src/components/cadastro/Passo3ContatoVinculo.tsx:204` oferece de 1º a 10º; `backend/src/modulos/usuarios/application/use_cases/validar_etapa_3_use_case.py:75` aceita de 1 a 16.

### Critérios de aceite

- O time define o limite (sugestão: 16 na tela, igual ao backend; ou 12, se só cursos regulares forem considerados).
- Tela e backend usam o mesmo limite.
- Reexecutar `CT-HU001-UI-044`.

### 📎 Evidência
