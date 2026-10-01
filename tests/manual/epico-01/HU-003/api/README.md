# Como executar os testes manuais de API

Passo a passo para executar a suíte desta pasta e entregar o resultado. Os exemplos usam a
HU-003; troque pelo número da HU que você está testando.

Estrutura de cada HU:

```
tests/manual/epico-01/HU-003/
├── api/   ← suíte de API (este README + API-HU-003.md)
└── ui/    ← testes de interface (futuro)
```

---

## 1. Criar a branch (seguindo o CONTRIBUTING)

Nunca trabalhe direto em `develop` ou `main` (veja [CONTRIBUTING.md](../../../../../docs/CONTRIBUTING.md)).
Crie uma branch por HU, a partir da `develop` atualizada:

```bash
git checkout develop
git pull
git checkout -b feature/testes-api-hu-003
```

## 2. Ler a suíte antes de testar

Abra `API-HU-003.md` e leia, nesta ordem:

1. **Identificação da suíte**: endpoints e total de casos.
2. **Pré-condições**: contas, tokens e massa de dados necessários. Prepare tudo antes do primeiro caso.
3. **Resumo da execução**: a lista dos casos, na ordem em que devem rodar.
4. **Detalhamento dos casos**: passos e resultado esperado de cada um.

Se algo estiver ambíguo ou parecer errado, pergunte ao líder. **Não altere o resultado esperado
para fazer o teste passar**: se a API se comporta diferente do esperado, isso é um defeito
(ou uma divergência de requisito) e deve ser registrado.

## 3. Preparar o ambiente

1. Suba a API e o banco (ou use o ambiente que o líder indicar) e anote a **URL**.
2. Abra o Swagger em `<URL>/docs`, ou use Postman/Insomnia.
3. Preencha **Ambiente** na tabela de identificação com a URL e o commit testado
   (`git rev-parse --short HEAD`).
4. Crie as contas fictícias pedidas nas pré-condições. Use sempre dados fictícios.

## 4. Executar os casos, um por vez

Para cada caso, na ordem do resumo:

1. Monte a requisição exatamente como descrito em **Dados de entrada** e **Passos**.
2. Altere **somente** o dado que o caso manda alterar.
3. Envie e anote o **status HTTP** e o **corpo (JSON)** da resposta.
4. Compare com o **Resultado esperado**: status, `error.code`, mensagem e o que ficou (ou não) gravado.
5. Quando o caso pedir, confira no sistema (por exemplo com `GET`) se o dado foi mesmo alterado.

## 5. Registrar o resultado

Em cada caso, preencha:

- **Resultado obtido**: o que aconteceu de fato (status, `error.code`, mensagem, observações).
- **Status**: `✅ PASSOU`, `❌ FALHOU` ou `⏳ PENDENTE` (se não deu para executar, diga o motivo).

Depois de executar todos, atualize o resto do arquivo:

| Onde | O que fazer |
| --- | --- |
| **Resumo da execução** | Troque o status e a observação de cada linha. |
| **Resultado geral** | Atualize os totais de passaram, falharam e pendentes. |
| **Última execução** | Data da execução. |
| **Defeitos encontrados** | Uma linha por falha: caso, descrição curta e link da issue. |

Regras para as evidências:

- Cole o status e o trecho relevante do JSON. **Oculte** senhas, tokens e dados pessoais.
- Quando a observação do caso pedir (por exemplo, "registrar divergência"), anote mesmo que o caso passe.

## 6. Reportar defeitos

Para cada `❌ FALHOU`, abra uma issue no GitHub com: caso (ex.: `CT-HU003-API-003`), passos,
esperado, obtido e a URL/commit testado. Coloque o link da issue na tabela **Defeitos encontrados**.

## 7. Commit

Commits seguem o padrão do CONTRIBUTING (`tipo: descrição no imperativo`, com o ID da HU):

```bash
git add tests/manual/epico-01/HU-003
git commit -m "test: registra execução dos testes de API da HU-003"
```

Faça commits pequenos e só com arquivos de `tests/`.

## 8. Push e Pull Request

```bash
git push -u origin feature/testes-api-hu-003
```

Abra um **Pull Request** de `feature/testes-api-hu-003` para `develop`:

- **Título** no padrão dos commits: `test: testes manuais de API da HU-003`.
- **Descrição**: HU testada, ambiente/commit, totais (passaram, falharam, pendentes) e links das issues abertas.
- Peça revisão de pelo menos 1 pessoa do time antes do merge.

## Checklist rápido

- [ ] Branch criada a partir da `develop` atualizada
- [ ] Pré-condições e contas de teste prontas
- [ ] Todos os casos executados (ou marcados como pendentes com motivo)
- [ ] Resultado obtido e status preenchidos em cada caso
- [ ] Resumo, resultado geral, última execução e defeitos atualizados
- [ ] Nenhuma senha, token ou dado pessoal nas evidências
- [ ] Issues abertas para cada falha
- [ ] Commit no padrão e Pull Request para `develop`
