# Nome com apóstrofo, como D'Ávila, é rejeitado

| Campo | Valor |
|---|---|
| **Tipo** | Bug de validação |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo) |
| **Caso relacionado** | `CT-HU001-UI-017` |
| **Documentação** | HU-001 — Testes manuais de UI: [CT-HU001-UI-017](../UI-HU-001.md#ct-hu001-ui-017--nome-com-apóstrofo) |
| **Issue relacionada** | [BUG-HU001-UI-018-nome-com-hifen-rejeitado](BUG-HU001-UI-018-nome-com-hifen-rejeitado.md) |

---

### Pré-condição

Usuário sem sessão autenticada em **Criar conta** no iPhone, com os demais campos preenchidos com a massa válida das pré-condições PC-02 a PC-04 da suíte.

### Passos para reproduzir

1. Na etapa **Dados básicos**, informar `Ana D'Ávila` (apóstrofo reto).
2. Tocar em **Próximo**.
3. Repetir com `Ana D’Ávila` (apóstrofo tipográfico, o padrão do teclado do iPhone).

### ✅ Resultado esperado

Aceitar os dois apóstrofos, já que nomes como D'Ávila, D'Angelo e O'Neil existem.

### ❌ Resultado obtido

O app rejeitou as duas variantes.

### ⚠️ Impacto

- Pessoas com apóstrofo no nome não conseguem se cadastrar com o nome do documento.

### Causa aparente

A regex do formulário em `frontend/src/schemas/alunoSchema.ts:13` aceita apenas letras e espaços, e a do backend (`backend/src/shared/validators/string_sem_numero_validator.py:6`) aceita letras, espaços e hífen. Nenhuma das duas aceita apóstrofo.

### Critérios de aceite

- Os dois apóstrofos (`'` e `’`) são aceitos, de preferência normalizados para um só antes de salvar.
- A regra é aplicada no formulário e no backend, para não haver recusa só no envio.
- Reexecutar `CT-HU001-UI-017`.

### 📎 Evidência
