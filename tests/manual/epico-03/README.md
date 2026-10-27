# Testes manuais — Épico 03 — Gestão de Rotas e Horários

Planejamento essencial das HU-011 e HU-012, elaborado antes da implementação das funcionalidades. São **52 casos: 26 de API e 26 de UI**, todos pendentes. Os documentos seguem o formato do [épico 02](../epico-02/README.md), sem declarar execução ou defeito reproduzido.

## Índice

| HU | Funcionalidade | API | UI | Guia de API |
| --- | --- | --- | --- | --- |
| HU-011 | Rotas Principais e Horários | [13 casos](HU-011/api/API-HU-011.md) | [13 casos](HU-011/ui/UI-HU-011.md) | [Contrato e execução](HU-011/api/README.md) |
| HU-012 | Rotas Complementares | [13 casos](HU-012/api/API-HU-012.md) | [13 casos](HU-012/ui/UI-HU-012.md) | [Contrato e execução](HU-012/api/README.md) |
| **Total** | **2 HUs** | **26** | **26** | **52 casos pendentes** |

Cada suíte contém identificação, resultado geral, pré-condições, resumo, casos detalhados, rastreabilidade, defeitos e riscos/decisões. UI organizada em seções A/B/C; IDs no padrão `CT-HU011-API-001`, `CT-HU011-UI-001`, `CT-HU012-API-001` e `CT-HU012-UI-001`.

## Fontes e situação da implementação

1. [Requisitos, seção 7.4](../../../docs/requisitos.md): HU-011 em 7.4.1 e HU-012 em 7.4.2.
2. [HU-011.feature](../../../bdd/features/epico-03/HU-011.feature) e [HU-012.feature](../../../bdd/features/epico-03/HU-012.feature).
3. [README do BDD](../../../bdd/features/epico-03/README.md), incluindo divergências e regras sem decisão.
4. Código da `develop` atualizada, base `5554bc90`, conferido em 24/10/2026.

Nessa base, [backend/main.py](../../../backend/main.py) não registra os routers de gestão dessas HUs, e contrato HTTP/DTO/service de rotas não foi identificado em `backend/src`. O frontend tem cards em [cadastros.tsx](../../../frontend/src/app/%28administrador%29/cadastros.tsx), apontando para telas ainda não identificadas:

- Rotas principais: `/(administrador)/cadastros/rotas-principais`.
- Rotas complementares: `/(administrador)/cadastros/rotas-complementares`.

Esses são alvos de navegação, não comprovação de funcionalidade. Os planos não inventam endpoints, payloads, tabelas de rotas ou códigos específicos de resposta ainda não publicados. Cada guia de API traz uma tabela a preencher com métodos, URLs, campos, formato de hora/conexão e consultas reais antes de executar.

## Organização da execução futura

- **API:** execução com apoio da IA (Claude Code), validada por Cauan, em ambiente isolado e banco de teste, usando Postman/Insomnia/Swagger em `/docs`.
- **UI:** Cauan executa no celular (Expo Go) ou web em `http://localhost:3000`; os rótulos internos são referências do BDD e precisam ser conferidos na entrega.
- **PC-05 — apoio da IA:** conferir dados persistidos, ids, vínculos, estado e auditoria na API/banco quando os casos pedirem. Massa não montável pela UI pode ser preparada localmente, com origem registrada.
- Anotar a branch/commit da própria implementação/correção em cada execução; este planejamento é mantido em `feature/testes-manuais-epico-03`, criada a partir da `develop` atualizada.
- Ausência de implementação, contrato, dependência ou decisão bloqueia somente a parte afetada na execução. Não marcar uma rota inexistente como proteção de acesso aprovada, nem erro genérico como aplicação correta da regra de agendamento.
- Preparo direto de massa não aprova cadastro/inativação. Conferir respostas e efeitos reais; não alterar o esperado para fazer o código passar.

## Dependências e riscos prioritários

| Verificação | Dependência | Risco a observar |
| --- | --- | --- |
| Cadastro de principal | Bairros/pontos e faculdades ativos (HU-007/008); contrato de HU-011 | Perder seleção múltipla, misturar ida/volta e aceitar referência inativa/inexistente |
| Cadastro de complementar | Principal ativa (HU-011) ou massa local documentada; contrato de HU-012 | Confundir ids, usar principal padrão ou manter vínculo atual antigo após troca |
| Mudança de estado | Implementação de inativar/reativar e auditoria | Exclusão física, estado parcial, auditoria sem executor/ação/timestamp |
| Bloqueio por agenda futura | HU-013 com agendamentos reais e datas/fuso registrados | Confundir passado com futuro, bloqueio fictício ou contorno por edição genérica de status |
| Preservação de histórico | Módulos e massa real de alocação/relatórios | Romper referências ao editar/inativar, apagar registros antigos ou entidade compartilhada |
| Agendamento com rota inativa | HU-013 **e decisão de regra** | BDD registra exclusão da seleção como inferência ainda a confirmar |
| RN-010 — uso da complementar | Agendamento e programação/alocação diária nas HUs operacionais | Confundir cadastro com prova de veículo/horário/conexão da operação do dia |
| Integração UI/API | Telas/services reais e contrato publicado | Sucesso apenas visual, perda de formulário, erro silencioso ou exemplos como dados reais |

Os riscos funcionais são preventivos: a ausência de implementação nesta base não permite atribuir bugs a código de rotas ainda não entregue. A documentação do épico 02 pode orientar a revisão, mas seus endpoints e defeitos não são automaticamente regras deste épico.

## Decisões e divergências abertas

| Ponto | Referência | Como o planejamento trata |
| --- | --- | --- |
| Listagem com ativas/inativas versus só ativas inicialmente | AC-01/fluxo versus BDD e AC-09 | Cobrir acesso aos dois estados; deixar mecanismo/padrão inicial para alinhamento |
| Auditoria só da inativação versus todas as escritas | AC-05 versus fluxo principal/BDD | Cobrir as quatro escritas com base no fluxo/BDD; mapear ações reais depois |
| Várias faculdades versus destino no singular | HU-011 AC-02/AC-10 versus fluxo/FA-003 | Múltiplas e volta independente; mínimo obrigatório da volta ainda sem definição |
| Bairro, ponto ou ambos | HU-011 AC-02/fluxo versus exemplos BDD por bairro | Não inventar payload; confirmar granularidade e validações de pertencimento |
| Um ou vários horários/conexões | HU-012 AC-02/fluxo versus BDD | Recorte atual com uma saída e uma conexão; confirmar estrutura e eventual retorno |
| Nome obrigatório na complementar | HU-012 AC-02 versus omissão no AC-08 | Incluir pelo AC-02/BDD e registrar a diferença de redação |
| Nome único e limites de texto | Não definidos | Não exigir bloqueio de duplicidade ou tamanho inventado |
| Ordem, faixa de horários e viagem que atravessa o dia | Não definidas | Validar formato confirmado; caracterizar fronteiras/cronologia sem regra operacional presumida |
| Inativar principal com complementares ativas | Não definido | Não presumir cascata, bloqueio ou manutenção; cenário essencial usa principal sem complementar ativa |
| Reativar complementar com principal inativa | Não definido | Caso essencial mantém principal ativa; variação pendente de decisão |
| Base inativada depois de vínculo salvo | README BDD; relação com HU-007/008 | Diferenciar vínculo antigo de nova associação inválida; política de atualização pendente |
| Inativa fora de novo agendamento | Inferência explícita no BDD | Sem decisão, não emitir aprovação/reprovação dessa parte |

As suítes registram essas lacunas sem alterar requisitos/BDD nem abrir issues. Mensagem de agenda futura deve informar agendamentos pendentes; não há texto literal definido. Na inativação bem-sucedida, o AC-07 exige “Operação realizada com sucesso”; para outras escritas, registrar também o texto esperado pelo BDD e alinhar a padronização.

## Resultados e validação documental

Todos os casos começam com **Não executado / ⏳ Pendente**. Antes da execução funcional, preencher contrato, ambiente e pré-condições; depois atualizar resumo, resultado geral e evidências por variação. Estado bloqueado só será contabilizado quando a execução verificar a dependência ausente.

Nesta entrega, a conferência é exclusivamente documental: IDs, quantidades, rastreabilidade, links e formatação. Não foram executados testes do produto nem iniciados serviços. A tabela de defeitos continua vazia até reprodução. Ocultar credenciais, tokens e dados pessoais nas futuras evidências.
