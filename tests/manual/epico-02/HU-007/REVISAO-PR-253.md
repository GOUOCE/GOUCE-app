# Pendências técnicas do PR #253 — issue #265

Base das correções: `0d1b2c568319fb79cbbf1795d30072fa6827823b`, branch `fix/issues-hu007`.

## Comportamento esperado após os ajustes

- A listagem de bairros consulta a API ao abrir e ao mudar a busca, sem repetir a consulta a cada renderização.
- A chave “Mostrar inativos” também mostra os pontos inativos dos bairros ativos, identificados como tais.
- Falha ao inativar bairro apresenta a mensagem de conexão em português.
- Os seletores de bairro e instituição carregam cadastros ativos, mostram seus nomes e guardam seus IDs. Não há opções de exemplo nem substituição automática por ID 1.
- Como os vínculos são referências a cadastros existentes, “Outro/Outra” deixa de ser uma opção para bairro e instituição. Ausência de cadastros orienta o aluno a procurar a administração. A opção “Outro” de curso é preservada.
- Consulta indisponível mostra erro e permite tentar novamente; lista vazia permanece vazia.
- Cadastro e renovação revalidam os vínculos antes de enviar e não prosseguem se a consulta falhar ou o vínculo tiver sido inativado.
- A API aceita IDs inteiros ou strings numéricas, normaliza para inteiro e devolve 422 em português para ID inválido, inexistente ou inativo. No cadastro multipart, essa validação ocorre antes dos uploads.

## Verificações automatizadas

- `bairrosList.test.tsx`: ausência do ciclo de consultas, exibição dos pontos inativos e erro de conexão na inativação.
- `cadastroVinculos.test.tsx`: seleção por ID, lista vazia e recuperação após falha de conexão.
- `vinculoAlunoService.test.ts`: FormData do cadastro/renovação, vínculos inválidos/inativos e falha de consulta sem envio.
- `test_cadastro_api_responses.py`: cadastro JSON e multipart com IDs válidos/inválidos/inativos, incluindo 422 e ausência de criação do aluno nas falhas.
- `test_vinculos_aluno.py`: consultas reais do repositório em SQLite em memória e validação do formato de IDs.
- `test_renovacao_vinculo_use_case.py`: vínculos inativos impedem salvar arquivos e atualizar o aluno.
- `test_bairros_crud.py`: inativar e reativar ponto preserva o registro e o ID.

Os testes da API substituem armazenamento/autenticação quando necessário e não usam o banco de desenvolvimento.

Resultado local: **192 testes do frontend** (23 suítes), **52 testes do backend** e **49 subcasos**, todos aprovados. `npm run typecheck` aprovado. Lint dos arquivos alterados sem erros; os dois avisos já existentes na tela de renovação permanecem.

## Reteste manual pendente

1. Abrir a listagem e conferir no painel de rede que as respostas não provocam novas consultas sucessivas. Alterar a busca e conferir a atualização.
2. Inativar um ponto de bairro ativo, salvar e ligar “Mostrar inativos”. Conferir seu nome e identificação; reativar na edição e conferir a persistência com o mesmo ID.
3. Sem conexão, tentar inativar bairro. Conferir erro em português e manutenção do status. Reconectar e tentar novamente.
4. Cadastrar aluno selecionando bairro e instituição reais; conferir IDs no envio e conclusão do cadastro. Repetir na renovação.
5. Abrir a etapa de vínculo com a API indisponível e depois usar “Tentar novamente”. Conferir ausência de dados de exemplo e recuperação das opções.
6. Em ambiente de teste com listas vazias, conferir a orientação para procurar a administração e ausência de seleções fictícias.
7. Inativar um vínculo depois da seleção e antes do envio; conferir que o cadastro/renovação é bloqueado, sem trocar o vínculo silenciosamente.

Estes ajustes e testes técnicos não substituem o reteste visual das issues originais.
