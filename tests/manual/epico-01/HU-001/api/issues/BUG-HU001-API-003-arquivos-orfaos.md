# Comprovantes não são removidos quando o cadastro é rejeitado

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / segurança |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Branch `feature/testes-api-hu-001` — Docker local, URL `http://localhost:8000`, commit `9cd5d3da` |
| **Caso relacionado** | `CT-HU001-API-002`, `CT-HU001-API-004`, `CT-HU001-API-005` e `CT-HU001-API-006` |
| **Documentação** | [HU-001 — Testes manuais de API](../API-HU-001.md#investigação-de-persistência) |
| **Issue relacionada** | [Issue #85](https://github.com/GOUOCE/GOUCE-app/issues/85) |

---

### Pré-condição

API, PostgreSQL e MinIO disponíveis em Docker local. Preparar uma requisição `multipart/form-data` com dois PDFs válidos, usando valores fictícios e sem registrar dados pessoais, e alterar somente o campo correspondente ao cenário negativo.

### Passos para reproduzir

1. Preparar a massa válida com dois comprovantes e executar, em tentativas separadas, as variações dos casos relacionados: e-mail duplicado (`CT-HU001-API-002`), e-mail inválido e data inexistente (`CT-HU001-API-004`), senha sem número (`CT-HU001-API-005`) e `termos_de_uso=false` (`CT-HU001-API-006`).
2. Enviar cada tentativa para `POST /usuarios/cadastrar` por `multipart/form-data`, alterando somente a variação em teste.
3. Conferir o status HTTP, `success`, `error.code`, os campos identificados e as mensagens disponíveis, conforme a tabela do resultado obtido.
4. Consultar a tabela `arquivos` em modo somente leitura e verificar se os registros novos aparecem associados a alguma coluna de arquivo da tabela `aluno`.
5. Consultar o bucket `smp-fotos` em modo somente leitura, relacionando cada objeto ao registro pelo prefixo `<id_do_arquivo>_`. Consultar `email_hash` somente para verificar a criação de usuários adicionais, sem exibir hashes, e-mails ou outros dados pessoais.

### ✅ Resultado esperado

- `CT-HU001-API-002`: HTTP `409`, `success: false`, `error.code: "EMAIL_ALREADY_REGISTERED"` e mensagem de e-mail já cadastrado; nenhum segundo usuário e nenhum registro/objeto órfão.
- `CT-HU001-API-004`: e-mail inválido com HTTP `422` e `error.code: "REQUEST_VALIDATION_ERROR"`; data inexistente com HTTP `400` e `error.code: "VALIDATION_ERROR"`; nenhum usuário, registro ou objeto órfão.
- `CT-HU001-API-005`: a tentativa rejeitada por senha sem número deve retornar HTTP `400`, `success: false`, `error.code: "VALIDATION_ERROR"` e mensagem informando a regra do número; nenhum usuário, registro ou objeto órfão.
- `CT-HU001-API-006`: HTTP `400`, `success: false`, `error.code: "VALIDATION_ERROR"` e detalhe referente a `termos_de_uso`; nenhum usuário, registro ou objeto órfão.
- Cadastros aceitos devem manter os comprovantes corretamente associados ao aluno.
- Os textos completos de algumas mensagens não foram preservados no registro disponível; não foram inventados.

### ❌ Resultado obtido

Os uploads ocorreram antes da conclusão das validações do cadastro. Quando uma validação posterior rejeitou a requisição, os registros e objetos permaneceram armazenados sem associação a um aluno.

Foram identificados 10 registros órfãos na tabela `arquivos`, todos com `content_type=application/pdf`, distribuídos em cinco pares. Os 10 registros possuem exatamente um objeto correspondente no bucket `smp-fotos` do MinIO, também com metadado `Content-Type: application/pdf`.

| Caso | Variação | Horário UTC | Resposta HTTP | Código/mensagem registrada | Evidência de armazenamento |
|---|---|---:|---:|---|---|
| `CT-HU001-API-002` | E-mail duplicado | `21:20:48` | `409` | `EMAIL_ALREADY_REGISTERED`; mensagem descrita como e-mail já cadastrado, sem texto completo preservado | 2 registros órfãos e 2 objetos |
| `CT-HU001-API-004` | E-mail inválido | `21:38:28` | `422` | `REQUEST_VALIDATION_ERROR`; `error.details` identifica `email`; texto completo da mensagem não preservado | 2 registros órfãos e 2 objetos |
| `CT-HU001-API-004` | Data inexistente | `21:39:51` | `400` | `VALIDATION_ERROR`; `error.details` identifica `data_nascimento`; mensagem registrada: `Data de nascimento inválida (verifique dia e mês).` | 2 registros órfãos e 2 objetos |
| `CT-HU001-API-005` | Senha sem número | `21:48:30` | `400` | `VALIDATION_ERROR`; mensagem descrita como exigência de pelo menos um número, sem texto completo preservado | 2 registros órfãos e 2 objetos |
| `CT-HU001-API-006` | Termos não aceitos | `22:05:32` | `400` | `VALIDATION_ERROR`; `error.details` referente a `termos_de_uso`; mensagem não preservada | 2 registros órfãos e 2 objetos |

As consultas posteriores por `email_hash` não encontraram usuários adicionais associados aos e-mails rejeitados, exceto a consulta do `CT-HU001-API-002`, que encontrou somente o usuário ID `2`. Não há evidência de arquivos órfãos atribuível aos casos `CT-HU001-API-003`, `CT-HU001-API-007` ou `CT-HU001-API-008`.

Não foram preservados trechos JSON das respostas nesta investigação. Os códigos, campos e mensagens acima reproduzem somente o que foi registrado; nenhum corpo JSON foi reconstruído.

As consultas foram realizadas após a execução dos testes e registram o estado encontrado naquele momento; não comprovam, isoladamente, a ausência de persistência de usuário durante todo o intervalo entre cada requisição e a consulta posterior.

### Impacto

- Acúmulo de arquivos sem associação com alunos.
- Consumo desnecessário de armazenamento.
- Possível retenção indevida de documentos pessoais.
- Possível descumprimento do RNF-012, que exige impedir registros órfãos e relacionamentos inválidos.

### Causa aparente

A rota realiza os uploads dos comprovantes antes de montar o DTO e concluir as validações do cadastro. O salvamento de cada arquivo faz o `put_object` no MinIO e o `commit` do registro no PostgreSQL separadamente. Quando uma validação posterior falha, não existe limpeza compensatória dos objetos e registros.

Referências técnicas: [rota de cadastro](../../../../../../backend/src/modulos/usuarios/interface/http/usuario_routes.py#L300-L362), [caso de uso de arquivo](../../../../../../backend/src/modulos/arquivos/application/use_cases/salvar_arquivo_use_case.py#L49-L63) e [repositório de arquivos](../../../../../../backend/src/modulos/arquivos/infrastructure/repositories/arquivo_repository.py#L11-L15). A redação do RNF-012 está em [docs/requisitos.md](../../../../../../docs/requisitos.md#L484).

### Critérios de aceite

- Reexecutar o `CT-HU001-API-002` e confirmar que a rejeição por e-mail duplicado não deixa registros órfãos nem objetos no MinIO.
- Reexecutar as duas variações do `CT-HU001-API-004` e confirmar a mesma condição.
- Reexecutar a variação do `CT-HU001-API-005` com senha sem número e confirmar a mesma condição.
- Reexecutar o `CT-HU001-API-006` com termos não aceitos e confirmar a mesma condição.
- Manter os códigos HTTP e mensagens de validação esperados.
- Confirmar que cadastros aceitos continuam com os comprovantes associados.
- Incluir teste automatizado para a limpeza transacional ou compensatória.

### 📎 Evidência

Investigação realizada por Radlei Doroth em 2026-10-02, em ambiente Docker local, URL `http://localhost:8000`, branch `feature/testes-api-hu-001`, commit `9cd5d3da`, com consultas somente leitura ao PostgreSQL, logs da API e metadados do MinIO. Não foram exibidos credenciais, chaves, senhas, e-mails, hashes ou conteúdo dos documentos. Não há print anexado no repositório.
