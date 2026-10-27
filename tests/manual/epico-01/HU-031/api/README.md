# Como executar os testes manuais de API

Passo a passo para executar a suíte, registrar os resultados e reportar falhas. Os exemplos usam
a HU-031; troque pelo número da HU que você está testando.

```
tests/manual/epico-01/HU-031/
├── api/   ← suíte de API: este README e API-HU-031.md
└── ui/    ← suíte de UI: UI-HU-031.md
```

Modelo de issue: [`tests/manual/modelos/ISSUE-BUG-API.md`](../../../modelos/ISSUE-BUG-API.md).

---

## 1. Criar a branch (seguindo o CONTRIBUTING)

Nunca trabalhe direto em `develop` ou `main` ([CONTRIBUTING.md](../../../../../docs/CONTRIBUTING.md)).
Crie uma branch a partir da `develop` atualizada:

```bash
git checkout develop
git pull
git checkout -b feature/testes-api-hu-031
```

## 2. Selecionar a HU e usar a HU-001 como exemplo

1. Abra a pasta da HU que vai testar, por exemplo `tests/manual/epico-01/HU-031/api/`.
2. Leia antes o arquivo da **HU-001** ([`HU-001/api/API-HU-001.md`](../../HU-001/api/API-HU-001.md)): é o exemplo de como uma suíte
   preenchida fica (resumo, detalhamento, resultado obtido, defeitos).
3. Leia a suíte da sua HU: identificação, **pré-condições**, resumo e detalhamento dos casos.
4. A HU-031 depende da reprovação feita pelo administrador na HU-027
   ([`API-HU-027.md`](../../HU-027/api/API-HU-027.md)): a massa de alunos reprovados é criada pela API dela.

Não altere o resultado esperado para fazer o teste passar. Se a API se comporta diferente, isso é
um defeito (ou uma divergência de requisito) e deve ser registrado.

## 3. Subir a API, preparar a massa e executar

1. Suba a API e o banco em **stack isolada com banco limpo** (ou use o ambiente indicado pelo líder) e anote a **URL**
   e o commit. A suíte foi planejada sobre a `develop` `939921e3`.
2. O Mailpit é opcional nesta suíte: os casos não conferem e-mail. Sem ele, a reprovação só registra um aviso no log.
3. Abra o Swagger em `<URL>/docs` (grupos **Usuários e Alunos**, **Autenticação** e **Arquivos**), ou o Postman/Insomnia.
4. Prepare a massa da PC-03 pelo fluxo real de cadastro (`POST /usuarios/cadastro`, com comprovantes e foto) e
   reprove R1 e R2 com `PATCH /usuarios/alunos/{id}/status`, com os documentos e motivos da PC-03. Anote os ids.
5. Separe os arquivos da PC-04 (PDF de 1 MB, JPG, PDF de 6 MB, `.txt` e arquivo vazio).
6. Execute os casos **na ordem do resumo**, alterando somente o dado que cada caso manda alterar.

## 4. Anotar os resultados obtidos e os status codes

Para cada caso, anote:

- o **status HTTP** (200, 400, 401, 403, 404, 409, 422...);
- o **corpo da resposta** (principalmente `detail`, `mensagem`, `status` e `documentos`);
- se o dado foi mesmo gravado ou alterado, quando o caso pedir conferência (por exemplo com um `GET` ou no banco).

Compare com o **Resultado esperado**. **Oculte** senhas, tokens e dados pessoais em qualquer
anotação ou print.

## 5. Pedir para a IA estruturar os testes e preencher o arquivo

Com as anotações em mãos, peça à IA para preencher o arquivo da suíte (`API-HU-031.md`), colando
os resultados. Exemplo de pedido:

> Preencha o arquivo `tests/manual/epico-01/HU-031/api/API-HU-031.md` com os resultados abaixo.
> Atualize o "Resultado obtido" e o "Status" de cada caso, o resumo da execução, o resultado geral,
> a última execução, o ambiente/commit e a tabela de defeitos. Não altere os resultados esperados.
>
> CT-HU031-API-001: R1 e AP 200; P1 401 “Sua conta está pendente de aprovação pela coordenação.”.
> CT-HU031-API-004: 200, “Documentos enviados com sucesso! Seu cadastro foi encaminhado para análise.”, R1 pendente.

Revise o que a IA escreveu: cada status e cada código devem bater com o que você anotou.

## 6. Em caso de falha, pedir uma issue em `.md`

Para cada caso `❌ FALHOU`, peça à IA para criar a issue seguindo o modelo
[`ISSUE-BUG-API.md`](../../../modelos/ISSUE-BUG-API.md) e salve-a ao lado da suíte, em
`HU-031/api/issues/BUG-HU031-API-001-<resumo>.md` (numere em sequência). Exemplo de pedido:

> Crie a issue do CT-HU031-API-001 em `tests/manual/epico-01/HU-031/api/issues/`, seguindo o modelo
> `tests/manual/modelos/ISSUE-BUG-API.md`. Esperado: aluno pendente consegue logar e ver o status (AC-01, FA-002).
> Obtido: 401 “Sua conta está pendente de aprovação pela coordenação.”.

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
| História | `HU-031` (ainda não existe no repositório: peça ao líder para criar) |
| Severidade | `Bloqueante` ou `Não bloqueante` (a mesma da issue) |

---

## Entrega

```bash
git add tests/manual/epico-01/HU-031
git commit -m "test: registra execução dos testes de API da HU-031"
git push -u origin feature/testes-api-hu-031
```

Abra um **Pull Request** para `develop` com título no padrão (`test: testes manuais de API da HU-031`),
os totais (passaram, falharam, pendentes) e os links das issues, e peça revisão de 1 pessoa.

## Checklist

- [ ] Branch criada a partir da `develop` atualizada
- [ ] Suíte da HU e exemplo da HU-001 lidos; pré-condições prontas
- [ ] Massa de alunos (R1, R2, P1, AP) e arquivos de teste prontos, com ids anotados
- [ ] Casos executados no Insomnia/Postman/Swagger, com status e corpo anotados
- [ ] Arquivo `API-HU-031.md` preenchido e revisado (resumo, geral, defeitos)
- [ ] Issue `.md` criada para cada falha, a partir do modelo
- [ ] Issue no GitHub com João Vitor ou Radlei marcado e labels aplicadas
- [ ] Nenhuma senha, token ou dado pessoal nas evidências
- [ ] Commit no padrão e Pull Request para `develop`
