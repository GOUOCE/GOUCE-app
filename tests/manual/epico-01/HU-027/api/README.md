# Como executar os testes manuais de API

Passo a passo para executar a suíte, registrar os resultados e reportar falhas. Os exemplos usam
a HU-027; troque pelo número da HU que você está testando.

```
tests/manual/epico-01/HU-027/
├── api/   ← suíte de API: este README e API-HU-027.md
└── ui/    ← suíte de UI: UI-HU-027.md
```

Modelo de issue: [`tests/manual/modelos/ISSUE-BUG-API.md`](../../../modelos/ISSUE-BUG-API.md).

---

## 1. Criar a branch (seguindo o CONTRIBUTING)

Nunca trabalhe direto em `develop` ou `main` ([CONTRIBUTING.md](../../../../../docs/CONTRIBUTING.md)).
Crie uma branch a partir da `develop` atualizada:

```bash
git checkout develop
git pull
git checkout -b feature/testes-api-hu-027
```

## 2. Selecionar a HU e usar a HU-001 como exemplo

1. Abra a pasta da HU que vai testar, por exemplo `tests/manual/epico-01/HU-027/api/`.
2. Leia antes o arquivo da **HU-001** ([`HU-001/api/API-HU-001.md`](../../HU-001/api/API-HU-001.md)): é o exemplo de como uma suíte
   preenchida fica (resumo, detalhamento, resultado obtido, defeitos).
3. Leia a suíte da sua HU: identificação, **pré-condições**, resumo e detalhamento dos casos.
4. A HU-031 (pendências do aluno) começa depois da reprovação feita aqui: execute a HU-027 primeiro. A HU-031 cria
   os próprios alunos reprovados pela mesma API.

Não altere o resultado esperado para fazer o teste passar. Se a API se comporta diferente, isso é
um defeito (ou uma divergência de requisito) e deve ser registrado.

## 3. Subir a API, preparar a massa e executar

1. Suba a API e o banco em **stack isolada com banco limpo** (ou use o ambiente indicado pelo líder) e anote a **URL**
   e o commit. A suíte foi planejada sobre a `develop` `939921e3`.
2. Ligue o **Mailpit** (`http://localhost:8025`): sem ele, a reprovação não envia o e-mail e os CT-004 e CT-005 não
   podem ser conferidos.
3. Abra o Swagger em `<URL>/docs` (grupos **Usuários e Alunos**, **Alunos** e **Arquivos**), ou o Postman/Insomnia.
4. Prepare a massa da PC-03 pelo fluxo real de cadastro (`POST /usuarios/cadastro`, com comprovantes e foto), um aluno
   por vez e na ordem A1, A2, A3, A4. Anote os ids e a `data_hora_envio_analise` de cada um.
5. Prepare as contas da PC-04 (aluno aprovado e representante).
6. Execute os casos **na ordem do resumo**, alterando somente o dado que cada caso manda alterar.

## 4. Anotar os resultados obtidos e os status codes

Para cada caso, anote:

- o **status HTTP** (200, 400, 401, 403, 404, 409, 422...);
- o **corpo da resposta** (principalmente `detail`, `mensagem` e `status_cadastro`);
- se o dado foi mesmo gravado ou alterado, quando o caso pedir conferência (por exemplo com um `GET` ou no banco).

Compare com o **Resultado esperado**. **Oculte** senhas, tokens e dados pessoais em qualquer
anotação ou print.

## 5. Pedir para a IA estruturar os testes e preencher o arquivo

Com as anotações em mãos, peça à IA para preencher o arquivo da suíte (`API-HU-027.md`), colando
os resultados. Exemplo de pedido:

> Preencha o arquivo `tests/manual/epico-01/HU-027/api/API-HU-027.md` com os resultados abaixo.
> Atualize o "Resultado obtido" e o "Status" de cada caso, o resumo da execução, o resultado geral,
> a última execução, o ambiente/commit e a tabela de defeitos. Não altere os resultados esperados.
>
> CT-HU027-API-003: 200, “Cadastro do aluno aprovado com sucesso!”, A1 ativado e fora da fila.
> CT-HU027-API-004: nenhum e-mail no Mailpit para o A1.

Revise o que a IA escreveu: cada status e cada código devem bater com o que você anotou.

## 6. Em caso de falha, pedir uma issue em `.md`

Para cada caso `❌ FALHOU`, peça à IA para criar a issue seguindo o modelo
[`ISSUE-BUG-API.md`](../../../modelos/ISSUE-BUG-API.md) e salve-a ao lado da suíte, em
`HU-027/api/issues/BUG-HU027-API-001-<resumo>.md` (numere em sequência). Exemplo de pedido:

> Crie a issue do CT-HU027-API-004 em `tests/manual/epico-01/HU-027/api/issues/`, seguindo o modelo
> `tests/manual/modelos/ISSUE-BUG-API.md`. Esperado: e-mail ao aluno aprovado (AC-04). Obtido: nenhum e-mail.

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
| Camada | `Back` (ou `Front`) |
| História | `HU-027` (ainda não existe no repositório: peça ao líder para criar) |
| Severidade | `Bloqueante` ou `Não bloqueante` (a mesma da issue) |

---

## Entrega

```bash
git add tests/manual/epico-01/HU-027
git commit -m "test: registra execução dos testes de API da HU-027"
git push -u origin feature/testes-api-hu-027
```

Abra um **Pull Request** para `develop` com título no padrão (`test: testes manuais de API da HU-027`),
os totais (passaram, falharam, pendentes) e os links das issues, e peça revisão de 1 pessoa.

## Checklist

- [ ] Branch criada a partir da `develop` atualizada
- [ ] Suíte da HU e exemplo da HU-001 lidos; pré-condições prontas
- [ ] Mailpit ligado e massa de alunos criada na ordem, com ids anotados
- [ ] Casos executados no Insomnia/Postman/Swagger, com status e corpo anotados
- [ ] Arquivo `API-HU-027.md` preenchido e revisado (resumo, geral, defeitos)
- [ ] Issue `.md` criada para cada falha, a partir do modelo
- [ ] Issue no GitHub com João Vitor ou Radlei marcado e labels aplicadas
- [ ] Nenhuma senha, token ou dado pessoal nas evidências
- [ ] Commit no padrão e Pull Request para `develop`
