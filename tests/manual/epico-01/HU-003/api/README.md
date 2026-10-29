# Como executar os testes manuais de API

Passo a passo para executar a suíte, registrar os resultados e reportar falhas. Os exemplos usam
a HU-003; troque pelo número da HU que você está testando.

```
tests/manual/epico-01/HU-003/
├── api/   ← suíte de API: este README e API-HU-003.md
└── ui/    ← testes de interface (futuro)
```

Modelo de issue: [`tests/manual/modelos/ISSUE-BUG-API.md`](../../../modelos/ISSUE-BUG-API.md).

---

## 1. Criar a branch (seguindo o CONTRIBUTING)

Nunca trabalhe direto em `develop` ou `main` ([CONTRIBUTING.md](../../../../../docs/CONTRIBUTING.md)).
Crie uma branch a partir da `develop` atualizada:

```bash
git checkout develop
git pull
git checkout -b feature/testes-api-hu-003
```

## 2. Selecionar a HU e usar a HU-001 como exemplo

1. Abra a pasta da HU que vai testar, por exemplo `tests/manual/epico-01/HU-003/api/`.
2. Leia antes o arquivo da **HU-001** (`HU-001/api/API-HU-001.md`): é o exemplo de como uma suíte
   preenchida fica (resumo, detalhamento, resultado obtido, defeitos).
3. Leia a suíte da sua HU: identificação, **pré-condições**, resumo e detalhamento dos casos.

Não altere o resultado esperado para fazer o teste passar. Se a API se comporta diferente, isso é
um defeito (ou uma divergência de requisito) e deve ser registrado.

## 3. Abrir o Insomnia/Postman ou o Swagger e executar

1. Suba a API e o banco (ou use o ambiente indicado pelo líder) e anote a **URL**.
2. Abra o Swagger em `<URL>/docs`, ou o Postman/Insomnia.
3. Prepare as contas fictícias das pré-condições.
4. Execute os casos **na ordem do resumo**, alterando somente o dado que cada caso manda alterar.

## 4. Anotar os resultados obtidos e os status codes

Para cada caso, anote:

- o **status HTTP** (200, 201, 400, 401, 403, 409, 422...);
- o **corpo da resposta** (principalmente `error.code` e a mensagem);
- se o dado foi mesmo gravado ou alterado, quando o caso pedir conferência (por exemplo com um `GET`).

Compare com o **Resultado esperado**. **Oculte** senhas, tokens e dados pessoais em qualquer
anotação ou print.

## 5. Pedir para a IA estruturar os testes e preencher o arquivo

Com as anotações em mãos, peça à IA para preencher o arquivo da suíte (`API-HU-003.md`), colando
os resultados. Exemplo de pedido:

> Preencha o arquivo `tests/manual/epico-01/HU-003/api/API-HU-003.md` com os resultados abaixo.
> Atualize o "Resultado obtido" e o "Status" de cada caso, o resumo da execução, o resultado geral,
> a última execução, o ambiente/commit e a tabela de defeitos. Não altere os resultados esperados.
>
> CT-HU003-API-001: 201, retornou id e status_cadastro "pendente".
> CT-HU003-API-002: 409, error.code EMAIL_ALREADY_REGISTERED.
> CT-HU003-API-003: 422 sem nome; 201 sem telefone (aceitou).

Revise o que a IA escreveu: cada status e cada código devem bater com o que você anotou.

## 6. Em caso de falha, pedir uma issue em `.md`

Para cada caso `❌ FALHOU`, peça à IA para criar a issue seguindo o modelo
[`ISSUE-BUG-API.md`](../../../modelos/ISSUE-BUG-API.md) e salve-a ao lado da suíte, em
`HU-003/api/issues/BUG-HU003-API-001-<resumo>.md` (numere em sequência). Exemplo de pedido:

> Crie a issue do CT-HU003-API-003 em `tests/manual/epico-01/HU-003/api/issues/`, seguindo o modelo
> `tests/manual/modelos/ISSUE-BUG-API.md`. Esperado: 400/422 ao omitir telefone. Obtido: 201.
> Referência: AC-02 da HU-003.

Depois, coloque o nome/link da issue na tabela **Defeitos encontrados** da suíte.

## 7. Subir a issue para o GitHub e marcar o responsável

1. Abra uma **nova issue** no GitHub, com o mesmo título e o conteúdo do `.md`.
2. Em **Assignees**, marque **João Vitor** ou **Radlei**, conforme combinado com o líder.
3. Anexe os prints (sem dados sensíveis).
4. Copie o link da issue para a tabela de defeitos.

## 8. Colocar as labels certas

Adicione à issue as labels abaixo:

| Tipo de label | Exemplos |
| --- | --- |
| Tipo | `bug` |
| Camada | `api` (ou `ui`) |
| História | `HU-003` |
| Severidade | `crítica`, `alta`, `média`, `baixa` (a mesma da issue) |

---

## Entrega

```bash
git add tests/manual/epico-01/HU-003
git commit -m "test: registra execução dos testes de API da HU-003"
git push -u origin feature/testes-api-hu-003
```

Abra um **Pull Request** para `develop` com título no padrão (`test: testes manuais de API da HU-003`),
os totais (passaram, falharam, pendentes) e os links das issues, e peça revisão de 1 pessoa.

## Checklist

- [ ] Branch criada a partir da `develop` atualizada
- [ ] Suíte da HU e exemplo da HU-001 lidos; pré-condições prontas
- [ ] Casos executados no Insomnia/Postman/Swagger, com status e corpo anotados
- [ ] Arquivo `API-HU-00X.md` preenchido e revisado (resumo, geral, defeitos)
- [ ] Issue `.md` criada para cada falha, a partir do modelo
- [ ] Issue no GitHub com João Vitor ou Radlei marcado e labels aplicadas
- [ ] Nenhuma senha, token ou dado pessoal nas evidências
- [ ] Commit no padrão e Pull Request para `develop`
