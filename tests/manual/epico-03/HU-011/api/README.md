# Como executar os testes manuais de API — HU-011

A [suíte API-HU-011.md](API-HU-011.md) contém 13 casos essenciais. Ela foi planejada **antes da implementação** a partir de requisitos e BDD; não há endpoints de rotas registrados na base `5554bc90`. Este guia não instrui executar testes nesta entrega de planejamento.

## 1. Confirmar a entrega e preencher o contrato real

Quando a HU estiver disponível, usar a branch da própria implementação/correção, registrar commit e consultar o código e o Swagger `/docs`. Não copiar URLs ou DTOs de outras HUs nem criar uma API fictícia para executar a suíte.

| Operação lógica | Método e URL reais | Campos/Content-Type | Resposta de sucesso/recusa |
| --- | --- | --- | --- |
| OP-LISTAR | A confirmar na implementação | Filtros de status e paginação, se existirem | A confirmar |
| OP-CONSULTAR | A confirmar; ou consulta pela lista se não houver detalhe | Identificador real da rota | A confirmar |
| OP-CADASTRAR | A confirmar | Nome, saída/retorno, bairros/pontos, faculdades de ida/volta | A confirmar |
| OP-EDITAR | A confirmar | Edição integral/parcial e esvaziamento explícito | A confirmar |
| OP-INATIVAR | A confirmar | Ação própria ou contrato documentado de status | A confirmar |
| OP-REATIVAR | A confirmar | Ação própria ou contrato documentado de status | A confirmar |

Mapear também nome/estrutura das listas de associações, ids, representação de horário e consulta de auditoria. Os valores de negócio nos casos não são chaves JSON. O mecanismo compartilhado atual usa `POST /auth/login`; credenciais de seed e tokens ficam fora dos documentos.

## 2. Confirmar decisões e dependências

- Fonte principal: [requisitos, seção 7.4.1](../../../../../docs/requisitos.md); depois [BDD](../../../../../bdd/features/epico-03/HU-011.feature) e [pontos de alinhamento](../../../../../bdd/features/epico-03/README.md).
- Sem tela/API/contrato, não executar por adivinhação: registrar 🚫 na camada correspondente quando a execução ocorrer.
- Nome único, faixas/ordem de horários, volta obrigatória, pontos, cascata principal/complementar e seleção de inativas no agendamento têm decisões pendentes documentadas na suíte. Não criar um resultado rígido onde a regra ainda não existe.
- HU-013 é necessária para agenda futura; RN-004 exige histórico real. Ausência de dependência bloqueia só a parte correspondente.
- Requisitos e BDD não publicam os códigos de todas as respostas. Registrar o código real, confrontar o contrato e o efeito funcional; 403 para escrita por aluno/representante está expresso no BDD.

## 3. Preparar ambiente e massa na etapa de execução

Usar stack isolada com banco de teste, Postman/Insomnia/Swagger e pré-condições da suíte. Anotar administrador executor, ids da massa, datas/fuso e versão. A IA executa API com validação de Cauan; qualquer preparo direto no banco deve ser registrado e não conta como sucesso funcional.

Os casos reutilizam RP1/RP2/RP3; preservar a sequência e não reutilizar registro aceito indevidamente para esconder um erro posterior. Não apagar registros históricos para fazer um teste passar.

## 4. Executar e registrar cada variação

1. Conferir PC-01 a PC-07 e o mapeamento acima.
2. Executar os casos na sequência, retornando ao CT-001 depois da criação da massa.
3. Registrar requisição efetiva (sem credenciais), código HTTP, mensagem, resultado persistido e evidência por variação.
4. Conferir banco/API por PC-05 nos pontos indicados.
5. Atualizar resultado obtido, status, resumo, resultado geral, ambiente e última execução. O esperado não deve ser alterado para aprovar o código.

Não confundir 500/503 com bloqueio válido de agendamento. Sucesso visual/local não comprova persistência. Evento de auditoria de tentativa não é log de escrita concluída.

## 5. Documentar falhas e revisar

A tabela Defeitos encontrados só recebe falhas reproduzidas; esta etapa de planejamento não abriu issues. Quando houver execução, usar o [modelo de bug de API](../../../modelos/ISSUE-BUG-API.md) se autorizado pelo responsável, registrando casos afetados e evidências sem tokens/dados pessoais.

Conferir quantidades e links antes do commit dos resultados. A [suíte de UI](../ui/UI-HU-011.md) cobre ações de tela; ela usa apoio da IA para persistência, auditoria e histórico.
