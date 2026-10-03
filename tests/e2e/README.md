# Testes E2E (Maestro)

Testes ponta a ponta do app mobile com o [Maestro](https://docs.maestro.dev). Cada fluxo roda o
APK real em um emulador Android, contra o backend real, e automatiza um caso da suíte manual
(`tests/manual/`).

Plataforma atual: **Android**. O iOS fica para depois, e os mesmos fluxos devem rodar lá.

```
tests/e2e/
├── config.yaml          ← configuração do Maestro (quais fluxos rodar)
├── flows/               ← os testes: 1 arquivo = 1 caso de teste
│   └── epico-01/
│       └── HU-001/
├── subflows/            ← passos reutilizáveis (abrir cadastro, preencher etapa, login...)
└── scripts/             ← scripts JS (ex.: gerar e-mail/CPF únicos por execução)
```

---

## Convenções

### Nome dos fluxos

Mesmo ID do caso manual, seguido de uma descrição curta:

```
flows/epico-01/HU-001/CT-HU001-UI-019-email-invalido.yaml
                      └── caso em tests/manual/epico-01/HU-001/ui/UI-HU-001.md
```

### Tags

| Tag              | Uso                                                                     |
|------------------|-------------------------------------------------------------------------|
| `hu-001`, ...    | HU a que o fluxo pertence                                               |
| `smoke`          | Fluxos principais, rodam em todo PR                                     |
| `regressao`      | Demais casos                                                            |
| `bug-conhecido`  | Reproduz um bug com issue aberta; falha até o bug ser corrigido         |

### Seletores

Prefira `testID` (no Maestro: `id:`) a texto da tela. Padrão: `<tela>-<tipo>-<campo>`.

```
cadastro-input-email
cadastro-btn-proximo
login-input-senha
```

### Subflows

Passos repetidos ficam em `subflows/` e são chamados com `runFlow`. Cada teste altera só o que
está testando.

---

## Como executar

Pré-requisitos: Java 17+, Android SDK com emulador, Maestro, backend rodando
(`docker-compose up`) e o APK do app instalado no emulador.

```bash
# todos os fluxos
maestro test tests/e2e

# só os principais
maestro test tests/e2e --include-tags smoke

# sem os bugs conhecidos
maestro test tests/e2e --exclude-tags bug-conhecido

# um fluxo específico
maestro test tests/e2e/flows/epico-01/HU-001/CT-HU001-UI-019-email-invalido.yaml

# inspetor visual de elementos
maestro studio
```

No emulador, o backend local é acessado por `http://10.0.2.2:<porta>`.
