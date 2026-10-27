# Como executar os testes manuais de API

## Execução de 27/10/2026

13 casos: 8 aprovados, 2 falharam, 2 parciais e 1 bloqueado. Resultados completos em [API-HU-012.md](API-HU-012.md). As evidências JSON de requisição/resposta estão diretamente nas [issues dos defeitos](issues/), também publicadas no GitHub. Os demais casos mantêm seus resultados na suíte.

Execução HTTP real com login e PostgreSQL/MinIO isolados; sem mocks. Foram registradas 123 chamadas HTTP, incluindo a preparação da massa. O caso de agendamentos ficou bloqueado pela ausência da HU-013. A conta ativa de representante foi autenticada com os perfis legados `aluno/supervisor`, conforme registrado no resultado do caso de acesso.

O commit da aplicação testada foi `23d1063f09f13cc195da7e45422581f73e2ae6da`; o roteiro veio do planejamento `939921e3`.

---

Passo a passo para executar a suíte, registrar os resultados e reportar falhas. Os exemplos usam
a HU-012; troque pelo número da HU que você está testando.

```
tests/manual/epico-03/HU-012/
├── api/   ← suíte de API: este README e API-HU-012.md
└── ui/    ← suíte de UI: UI-HU-012.md
```

Modelo de issue: [`tests/manual/modelos/ISSUE-BUG-API.md`](../../../modelos/ISSUE-BUG-API.md).

---

## 1. Criar a branch (seguindo o CONTRIBUTING)

Nunca trabalhe direto em `develop` ou `main` ([CONTRIBUTING.md](../../../../../docs/CONTRIBUTING.md)).
Crie uma branch a partir da `develop` atualizada:

```bash
git checkout develop
git pull
git checkout -b feature/testes-api-hu-012
```

## 2. Selecionar a HU e usar a HU-001 como exemplo

1. Abra a pasta da HU que vai testar, por exemplo `tests/manual/epico-03/HU-012/api/`.
2. Leia antes o arquivo da **HU-001** ([`epico-01/HU-001/api/API-HU-001.md`](../../../epico-01/HU-001/api/API-HU-001.md)): é o exemplo de como uma suíte
   preenchida fica (resumo, detalhamento, resultado obtido, defeitos).
3. Leia a suíte da sua HU: identificação, **pré-condições**, resumo e detalhamento dos casos.
4. Leia as decisões do PO na [issue #208](https://github.com/GOUOCE/GOUCE-app/issues/208): os casos marcados com
   **#208** seguem essas regras.

Não altere o resultado esperado para fazer o teste passar. Se a API se comporta diferente, isso é
um defeito (ou uma divergência de requisito) e deve ser registrado.

## 3. Subir a API, preparar a massa e executar

1. Suba a API e o banco em **stack isolada com banco limpo** (ou use o ambiente indicado pelo líder) e anote a **URL**
   e o commit. As rotas da HU-012 estão na `develop` desde o commit `7c3d72d8`.
2. Abra o Swagger em `<URL>/docs` (grupo **Rotas Complementares**), ou o Postman/Insomnia.
3. Prepare a massa da PC-05 pela API, antes do CT-001, e anote os ids reais: `POST /rotas-principais` com
   **Rota Centro - UFC** e **Rota Campo Velho - IFCE** (usando o bairro Centro e a UFC / Campus Quixadá das migrations,
   ou a massa da HU-011) e **Rota Antiga**, inativada com `PATCH /rotas-principais/{id}/inativar`.
4. Prepare as contas das pré-condições (administrador A, aluno aprovado e representante).
5. Execute os casos **na ordem do resumo**, alterando somente o dado que cada caso manda alterar. Os itens que dependem
   de um caso posterior (por exemplo, o CT-004 com a complementar inativa do CT-008) estão indicados no próprio caso.

## 4. Anotar os resultados obtidos e os status codes

Para cada caso, anote:

- o **status HTTP** (200, 201, 401, 403, 404, 409, 422...);
- o **corpo da resposta** (principalmente `error.code`, `error.message` e `error.details`);
- se o dado foi mesmo gravado ou alterado, quando o caso pedir conferência (por exemplo com um `GET` ou no banco).

Compare com o **Resultado esperado**. **Oculte** senhas, tokens e dados pessoais em qualquer
anotação ou print.

## 5. Pedir para a IA estruturar os testes e preencher o arquivo

Com as anotações em mãos, peça à IA para preencher o arquivo da suíte (`API-HU-012.md`), colando
os resultados. Exemplo de pedido:

> Preencha o arquivo `tests/manual/epico-03/HU-012/api/API-HU-012.md` com os resultados abaixo.
> Atualize o "Resultado obtido" e o "Status" de cada caso, o resumo da execução, o resultado geral,
> a última execução, o ambiente/commit e a tabela de defeitos. Não altere os resultados esperados.
>
> CT-HU012-API-002: 201, “Operação realizada com sucesso”, RC1 ativa ligada a RP1.
> CT-HU012-API-003: 422 “Campo não permitido.” ao enviar `horario_retorno`.

Revise o que a IA escreveu: cada status e cada código devem bater com o que você anotou.

## 6. Em caso de falha, pedir uma issue em `.md`

Para cada caso `❌ FALHOU`, peça à IA para criar a issue seguindo o modelo
[`ISSUE-BUG-API.md`](../../../modelos/ISSUE-BUG-API.md) e salve-a ao lado da suíte, em
`HU-012/api/issues/BUG-HU012-API-001-<resumo>.md` (numere em sequência). Exemplo de pedido:

> Crie a issue do CT-HU012-API-004 em `tests/manual/epico-03/HU-012/api/issues/`, seguindo o modelo
> `tests/manual/modelos/ISSUE-BUG-API.md`. Esperado: 409 ao cadastrar complementar com o nome de uma
> rota principal. Obtido: 201. Referência: item 1 da issue #208.

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
| História | `HU-012` |
| Severidade | `Bloqueante` ou `Não bloqueante` (a mesma da issue) |

---

## Entrega

```bash
git add tests/manual/epico-03/HU-012
git commit -m "test: registra execução dos testes de API da HU-012"
git push -u origin feature/testes-api-hu-012
```

Abra um **Pull Request** para `develop` com título no padrão (`test: testes manuais de API da HU-012`),
os totais (passaram, falharam, pendentes) e os links das issues, e peça revisão de 1 pessoa.

## Checklist

- [ ] Branch criada a partir da `develop` atualizada
- [ ] Suíte da HU, exemplo da HU-001 e decisões da #208 lidos; pré-condições prontas
- [ ] Rotas principais da massa preparadas e ids anotados
- [ ] Casos executados no Insomnia/Postman/Swagger, com status e corpo anotados
- [ ] Arquivo `API-HU-012.md` preenchido e revisado (resumo, geral, defeitos)
- [ ] Issue `.md` criada para cada falha, a partir do modelo
- [ ] Issue no GitHub com João Vitor ou Radlei marcado e labels aplicadas
- [ ] Nenhuma senha, token ou dado pessoal nas evidências
- [ ] Commit no padrão e Pull Request para `develop`
