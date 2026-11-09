# Como executar os testes manuais de API — HU-014

Execução pela **LLM**, com revisão de **Cauan Ricardo**. Esta entrega planeja os testes; nenhuma chamada funcional foi executada e nenhum defeito foi reproduzido.

```text
tests/manual/epico-04/
├── README.md
└── HU-014/
    ├── api/
    │   ├── README.md
    │   └── API-HU-014.md
    └── ui/
        └── UI-HU-014.md
```

## 1. Preparar a branch e o ambiente

Após revisão e merge do planejamento em `develop`, criar a branch de execução conforme [CONTRIBUTING](../../../../../docs/CONTRIBUTING.md):

```bash
git switch develop
git pull --ff-only
git switch -c feature/testes-api-hu-014
```

Se a árvore tiver alterações locais, usar worktree separada para preservá-las. Não misturar planejamento e execução nem incorporar a feature inteira à branch de documentação.

Ler a [suíte](API-HU-014.md), o [índice do épico](../../README.md) e a [HU-001 preenchida](../../../epico-01/HU-001/api/API-HU-001.md). Usar API e PostgreSQL reais em stack isolada, com migrations aplicadas, anotando URL, SHA e fuso do servidor. Verificar `/docs`: as quatro operações centrais são `GET /meus`, `GET /calendario?mes=YYYY-MM`, `GET /{id}` e `DELETE /{id}`, sob `/transporte/agendamentos`.

## 2. Preparar massa reproduzível

1. Autenticar alunos A e B aprovados e com vínculo válido via `POST /auth/login`. Preparar também administrador e aluno sem acesso regular para o CT-008. Guardar tokens fora dos arquivos versionados.
2. Pela API, preparar bairro/pontos, IES e rota principal ativa que atenda a ida e a volta (HU-007/008/011). Usar os ids retornados; não presumir `id = 1`.
3. Definir D como a data local do servidor; anotar D, hora e fuso. Selecionar dias válidos, sem feriado, na janela de 30 dias; recalcular as datas se a execução atravessar a meia-noite.
4. Criar reservas via `POST /transporte/agendamentos`. Exemplo com marcadores que devem ser substituídos por valores reais:

   ```json
   {
     "data": "<D+1 em YYYY-MM-DD>",
     "usa_ida": true,
     "usa_volta": true,
     "ponto_embarque_id": 123,
     "ies_destino_id": 456,
     "ies_origem_id": 456,
     "ponto_desembarque_id": 123
   }
   ```

5. Registrar um mapa de ids/data/dono/trechos/status para cada caso. Criar reservas de A e B de modo que tenham ids distintos; o teste de UI deve incluir reserva cujo id não seja um id fixo da grade do app.
6. Para ontem, feriado/recesso e eventual alocação, usar fixture documentada exclusivamente no banco isolado. Sem fixture ou funcionalidade dependente, registrar o bloqueio. Nunca tentar criar histórico pela API de novos agendamentos nem alterar o relógio do host.

Sem rotas funcionais na HU-013, registrar a dependência que impediu a preparação. Não tratar o erro de preparação como resultado de cancelamento da HU-014.

## 3. Executar e registrar

Executar os CT-001 a CT-010 na ordem. Os detalhes dizem quando criar massa adicional e quais registros preservar. A LLM pode usar cliente HTTP, Postman, Insomnia ou Swagger. Usar `Authorization: Bearer <token>`; DELETE não tem corpo.

Para cada variação, registrar requisição sem credenciais, HTTP, corpo, estado antes/depois e evidência de persistência por GET/consulta ao banco. Não inferir persistência pelo toast, por mocks ou pelos testes unitários existentes. Medir uma consulta e um cancelamento sob conexão normal (RNF-001); registrar duração e condições, sem alegar teste de carga.

No CT-010, a falha deve ocorrer dentro da transação real, antes do commit, por mecanismo controlado do ambiente de teste. Não introduzir endpoint de falha em código de produto nem deixar alterações de instrumentação na branch. Sem essa possibilidade, registrar o impedimento e manter a conclusão limitada.

## 4. Preencher e revisar os resultados

Atualizar em `API-HU-014.md`: ambiente/SHA, última execução, resultado obtido e status de cada caso, resumo, resultado geral e defeitos. Usar ✅ passou, ❌ falhou, ⚠️ parcial, 🚫 bloqueado e ⏳ pendente. Resultados de subitens devem continuar identificáveis.

Não alterar os esperados para adaptar ao comportamento da API. Para falha reproduzida, criar relato em `api/issues/BUG-HU014-API-001-<resumo>.md`, usando o [modelo de bug de API](../../../modelos/ISSUE-BUG-API.md), e referenciá-lo na suíte. Cauan revisa os registros antes da publicação dos relatos.

## 5. Entregar a execução

Versionar apenas os resultados e relatos da HU-014. Fazer commit no padrão do projeto, sem trailer de coautoria, e enviar a branch de execução para revisão em PR com base `develop`. O PR deve informar SHA testado, totais reais e partes bloqueadas, especialmente liberação de alocação. A execução de UI é de Cauan e usa a [suíte separada](../ui/UI-HU-014.md).
