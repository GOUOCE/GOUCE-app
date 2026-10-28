# HU-007 — acompanhamento do reteste visual

Ambiente: branch local `fix/hu007-pendencias-pr253`, web `http://localhost:18070`, API `http://localhost:18007`.
Este arquivo registra os ajustes locais e os resultados do reteste visual, posteriormente preparados para envio ao PR #253.

| Issue | Resultado informado pelo usuário | Próximo passo |
|---|---|---|
| #245 | Passou no reteste visual do usuário após ajuste da edição | Sem nova pendência relatada |
| #246 | Passou: chave inicialmente desligada | Sem nova pendência relatada |
| #247 | Passou: ponto inativo aparece dentro do bairro | Sem nova pendência relatada |
| #248 | Lista vazia e aviso de duplicidade passaram; orientação duplicada encontrada na edição | Placeholder redundante removido; retestar modal na edição |
| #249 | Passou: aviso de servidor e ausência de dados fictícios | Sem nova pendência relatada |
| #250 | Seleção de bairro real passou e aviso incorreto desapareceu; usuário interrompeu conclusão por campo campus da próxima HU | Conclusão do cadastro e renovação não comprovadas por esse reteste |
| #251 | Nome longo bloqueava envio sem mensagem; modal aceitava caracteres inválidos | Validar nome ao adicionar ponto, exibir erro no modal e erros indexados na lista; aviso no envio inválido; retestar |
| #210 | Bloqueio indevido de mesmo nome de ponto em bairros diferentes permanece nesta versão | Pendência independente: não declarar aprovação desse cenário |

## Causas confirmadas e mudanças locais

- Há três bairros ativos no banco do reteste (Centro, Castelo, Jurema) e nenhuma instituição cadastrada. A falta de instituição é real; o aviso anterior misturava a ausência de bairros e de instituições. Agora cada orientação fica junto ao respectivo campo vazio. O botão Atualizar opções permite consultar novamente após a administração cadastrar os dados.
- O modal de ponto conferia apenas tamanho mínimo. Agora usa a mesma validação do formulário: de 2 a 100 caracteres após remover espaços nas extremidades; letras, números, espaços, hífen, apóstrofo e ponto. Emojis e símbolos fora dessa regra geram erro no modal. Nada é cortado ou substituído silenciosamente.
- Erros de pontos eram indexados pelo validador e a tela lia apenas a mensagem da lista. Agora a primeira mensagem indexada também aparece; envio inválido mostra aviso e mantém os dados para correção.

## Reteste focado

1. No cadastro e na edição de bairro, adicionar `Praça 7 de Setembro`: deve aceitar.
2. Tentar adicionar `Ponto 😀`: deve manter o modal aberto e explicar os caracteres aceitos.
3. Adicionar nome com exatamente 100 letras: deve aceitar. Com 101 letras: deve rejeitar com mensagem de limite no modal.
4. Usar o nome longo relatado pelo usuário no nome do bairro e tentar finalizar: deve mostrar erro no campo e aviso; não enviar a gravação.
5. Com bairros disponíveis e sem instituições, conferir que só aparece a orientação de ausência de instituições.
6. Cadastrar uma instituição ativa pela administração. Voltar ao cadastro do aluno e tocar em Atualizar opções: deve carregar a instituição e preservar o bairro válido já escolhido.
7. Concluir cadastro e renovação com vínculos reais. Essa aceitação visual permanece pendente.

Não foi feita aprovação visual pelo agente. Os resultados de aprovação nesta tabela são relatos do usuário.

## Ajuste visual solicitado em 2026-10-28

Removidos contador e orientação permanente do modal de ponto em cadastro e edição. A mensagem vermelha aparece após tentativa inválida de adicionar; durante a correção, permanece atualizada enquanto o nome for inválido e desaparece assim que ficar válido.

## Descarte do rascunho do modal de ponto

Usuário informou aprovação dos ajustes anteriores, permanecendo o cenário da #210 bloqueado. Encontrou texto não salvo preservado após cancelar/voltar no modal. Ajuste local em cadastro e edição: abrir limpa o campo e seu erro; Cancelar e o fechamento pelo sistema (voltar/Escape, via onRequestClose) descartam o rascunho. Retestar digitando sem adicionar, cancelando/fechando e reabrindo.
