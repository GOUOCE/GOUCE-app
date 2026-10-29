# Revisão técnica e reteste do PR #303

Base: 37e3a14af4cf4077095df811d573281fe6c952bc, branch original feat/front-hu009.
Correções locais: fix/hu009-pendencias-pr303. Análise de código e testes técnicos; aceitação visual pendente. Correções preparadas para envio ao PR #303 após reteste do solicitante.

| Issue | Parecer sobre o PR original | Ajuste local / reteste |
|---|---|---|
| #274 | A tela envia a placa real nas mudanças de status | Preservar resposta estruturada de erro da API; conferir status e auditoria do veículo correto |
| #275 | Reset e navegação implementados; edição ainda podia mostrar dados anteriores ou permitir interação durante carregamento | Instância por placa, indicador de carregamento e bloqueio de envio até carregar; ignorar erro de consulta antiga ao sair |
| #276 | Chave começa desligada | Confirmar visualmente |
| #277 | Mocks e bloqueio local das placas de exemplo removidos | Testes confirmam lista vazia; cadastrar OCR1234 em banco vazio |
| #278 | Pop-ups implementados nas quatro operações | Conferir visualmente título e fechamento |
| #279 | Campos vazios/espaços bloqueados antes de converter | Confirmar cadastro e edição; zero explícito em pé deve passar |
| #280 | Parcial: schema rejeitava @, mas campo apagava o símbolo antes da validação | Preservar caracteres digitados para rejeitar sem transformar em outra placa; hífen opcional só após três letras |
| #281 | Parcial: inteiros na tela, mas erros estruturados perdiam campo; DTO convertia 2.5 em 2 | Rótulos em português por campo, deduplicação por mensagem completa; removido int() que truncava decimais |
| #282 | Limite do banco no DTO, mas frontend inventava máximo de 1000; parte das mensagens de validação saía em inglês | Alinhar frontend ao limite integer 2147483647, mensagem de limite em português; POST/PATCH rejeitam excesso sem alterar dados |
| #283 | Fallbacks removidos; serviços propagam falha | Testes cobrem leitura e quatro escritas sem API; confirmar retenção dos campos e ausência de falso sucesso |

## Observação sobre a placa

Mantido o suporte a sete caracteres sem hífen ou oito com um hífen após as três letras, como os exemplos legados da própria issue. Não se remove símbolo para tornar placa inválida em válida. O critério de exatamente sete caracteres digitados conflita com o exemplo OCR-1234; a normalização produz sete caracteres para o envio. Não considerar esta interpretação uma decisão nova de produto.

## Evidências técnicas

- Frontend: 189 testes, 21 suítes aprovados; TypeScript aprovado.
- Backend: 21 testes unittest aprovados, com subcasos de DTO e HTTP/ASGI para decimais e excesso nas duas capacidades em POST e PATCH, preservando o registro salvo.
- Testes de API usam SQLite em memória e substituem autenticação e armazenamento. Não provam aparência das telas nem auditoria real de produção.
- Ambiente visual isolado criado com o código local; migrations completas aplicadas usando `alembic upgrade heads` devido às duas heads já existentes. Isso não altera as migrations do PR.

## Roteiro visual

1. Abrir Cadastros → Frota: lista vazia, chave desligada; voltar deve ir a Cadastros.
2. Novo: digitar, sair e reabrir; campos vazios. Criar OCR1234 com 40 assentos e 0 em pé; confirmar pop-up e persistência após recarregar.
3. Editar: alterar sem salvar e voltar, conferir confirmação; reabrir dados oficiais. Trocar rapidamente de ônibus e conferir ausência de dados antigos.
4. Inativar e reativar o veículo certo pela placa; conferir pop-up, estado após recarregar e auditoria.
5. Testar capacidade em pé vazia e com espaços, assentos zero, decimais 4.5/2.5 e excesso 883833333333: erro visível sem gravar. Valor 0 em pé explicitamente deve passar.
6. GHI@3J45, emoji e hífen fora da posição: não podem virar placa válida por remoção silenciosa. ghi3j45 e GHI-3J45 devem enviar GHI3J45.
7. Offline: listar, cadastrar, editar, inativar e reativar; erro em português, nenhum dado fictício, nenhum sucesso falso e formulário mantido.

Nenhuma issue foi fechada por esta análise. Os resultados acima indicam prontidão técnica para reteste, sem afirmar aprovação visual.

## Decisão de produto no reteste — 2026-10-28

Solicitante aprovou o máximo de 100 em cada campo, de forma independente (1–100 assentos; 0–100 em pé). O código e o AC-10 em docs/requisitos.md foram atualizados. Esta decisão substitui o limite técnico do banco mencionado na análise original acima. Retestar 100 (aceito), 101 (rejeitado com mensagem específica), zero em pé (aceito), zero assentos (rejeitado), campos vazios e decimais.

## Conclusão do reteste

Solicitante aprovou os ajustes e autorizou commit/push para o PR #303. Confirmou #275, #280, #281 e #282, pop-ups de sucesso no cadastro/edição, hífen na placa e apresentação sem número fictício. Os demais critérios permanecem sustentados pela revisão técnica e testes; este registro não inventa evidência visual individual para ações não relatadas. Nenhuma issue foi fechada automaticamente.
