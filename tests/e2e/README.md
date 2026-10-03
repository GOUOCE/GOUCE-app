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

Seguindo a [recomendação do Maestro para React Native](https://docs.maestro.dev/get-started/supported-platform/react-native):

| O que | Seletor | Por quê |
|---|---|---|
| Elementos que o teste **aciona** (campos, botões, selects, checkbox) | `id:` (o `testID` do componente) | Não quebra se o texto mudar ou o app for traduzido |
| Mensagens que o teste **confere** (erros, popups, títulos) | texto | O texto é o comportamento testado: se a mensagem mudar, o teste deve falhar |
| Opções de listas (ex.: "Parda", "Noite") | texto | São os valores do domínio e já são estáveis |

Para conferir uma mensagem de erro, combine os dois. Assim o teste garante que a mensagem certa
apareceu no campo certo:

```yaml
- assertVisible:
    id: "cadastro-erro-email"
    text: "E-mail inválido"
```

Padrão dos `testID`s: `<tela>-<tipo>-<campo>`.

| Tipo | Exemplo |
|---|---|
| `input` | `cadastro-input-email` |
| `select` | `cadastro-select-curso` |
| `btn` | `cadastro-btn-proximo`, `cadastro-btn-ver-senha` |
| `checkbox` | `cadastro-checkbox-termos` |
| `erro` | `cadastro-erro-email` (mensagem de validação do campo) |
| `txt` | `cadastro-txt-passo` |

O popup genérico (`AppPopup`) usa `popup-titulo`, `popup-mensagem`, `popup-btn-confirmar`,
`popup-btn-cancelar` e `popup-btn-fechar`.

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

---

## Armadilhas conhecidas

- **`env` remove espaços nas pontas.** Um valor como `"   "` passado para um subflow chega vazio.
  Para testar espaços, digite direto no fluxo e confira o campo antes de seguir (veja
  `CT-HU001-UI-009-nome-so-espacos.yaml`, que usa `copyTextFrom` + `assertTrue`).
- **`eraseText` é lento** (~0,2 s por caractere). Apague só o necessário e, quando possível,
  deixe o campo testado vazio no preenchimento inicial em vez de preencher e apagar.
- **Confira que o teste falharia.** Um fluxo verde pode estar passando pelo motivo errado.
  Ao conferir mensagens de erro, use `id` + `text` para garantir a mensagem certa no campo certo.
