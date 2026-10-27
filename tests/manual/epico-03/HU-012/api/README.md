# Como executar os testes manuais de API — HU-012

A [suíte API-HU-012.md](API-HU-012.md) contém 13 casos essenciais, planejados **antes da implementação**. A base `5554bc90` não registra endpoints da HU-012. Não executar testes nem subir stack nesta entrega de planejamento.

## 1. Mapear a implementação antes da execução

Na branch da própria implementação/correção, registrar commit e consultar código/Swagger em `/docs`. Preencher a tabela com contrato real; não usar `/rotas-complementares` ou qualquer outra URL presumida.

| Operação lógica | Método e URL reais | Campos/Content-Type | Resposta de sucesso/recusa |
| --- | --- | --- | --- |
| OP-LISTAR | A confirmar | Filtros, se existirem | A confirmar |
| OP-CONSULTAR | A confirmar; ou consulta pela lista se não houver detalhe | Id real da complementar | A confirmar |
| OP-CADASTRAR | A confirmar | Nome, saída, conexão e principal | A confirmar |
| OP-EDITAR | A confirmar | Corpo integral/parcial e esvaziamento explícito | A confirmar |
| OP-INATIVAR | A confirmar | Ação própria ou contrato de status publicado | A confirmar |
| OP-REATIVAR | A confirmar | Ação própria ou contrato de status publicado | A confirmar |

Mapear separadamente identificadores de principal e complementar, tipo/representação da conexão, formato da hora, consultas de vínculos e auditoria. Os valores dos casos são dados de negócio e não chaves JSON aprovadas.

O mecanismo compartilhado atual autentica por `POST /auth/login`; não registrar credenciais/tokens no repositório. O BDD define 403 para gestão por aluno/representante; demais códigos da HU devem ser conferidos no contrato quando publicados.

## 2. Alinhar decisões e dependências

- Fonte principal: [requisitos, seção 7.4.2](../../../../../docs/requisitos.md), depois [BDD](../../../../../bdd/features/epico-03/HU-012.feature) e [pendências](../../../../../bdd/features/epico-03/README.md).
- Confirmar quantidade de horários/conexões, representação do ponto, nome único, relação temporal com principal e status inicial da listagem. Não criar regra nova para preencher lacuna.
- Para reativação, o caso essencial usa principal ativa. Principal inativa e cascata de status aguardam decisão.
- HU-011 ou massa local documentada para principais; HU-013 para agendamentos; dados históricos para RN-004. Seleção de inativas e operação diária/veículo de RN-010 são dependências separadas e não podem ser declaradas validadas só pelo cadastro.

## 3. Preparar massa em ambiente de teste

Na etapa futura de execução, usar stack isolada, Postman/Insomnia/Swagger e PC-01 a PC-07. Registrar ids, status, administrador executor, datas/fuso e origem da preparação local. A IA executa a API com validação de Cauan.

RP-A/RP-B são principais e RC0/RC1 são complementares. Não confundir ids, nem transformar preparo direto no banco em aprovação de cadastro/soft delete. Sem camada/contrato/dependência/decisão, registrar 🚫 na parte afetada.

## 4. Executar e registrar resultados

1. Validar a tabela de contrato, massa e pré-condições.
2. Executar na ordem da suíte; voltar ao CT-001 depois do cadastro da massa.
3. Registrar cada requisição real sem credenciais, código HTTP, mensagem, dados persistidos e evidência por variação.
4. Pedir conferência da API/banco nos pontos de PC-05.
5. Atualizar ambiente/commit, resultado obtido, status, resumo, geral e última execução; **não alterar o esperado para fazer passar**.

Um 500/503 não prova bloqueio de agenda. Não confundir resposta perdida após gravação com sucesso apenas local. Não contar evento de tentativa de auditoria como escrita efetiva.

## 5. Documentar falhas e revisar

Defeitos só após reprodução. Se autorizado na etapa de execução, usar o [modelo de bug de API](../../../modelos/ISSUE-BUG-API.md) e registrar ids dos casos, evidências e dependências. Esta entrega não abriu issues.

Conferir totais/links antes do commit dos resultados. A [suíte de UI](../ui/UI-HU-012.md) cobre seleção, confirmação, cancelamento e feedback, com apoio da IA para persistência/auditoria.
