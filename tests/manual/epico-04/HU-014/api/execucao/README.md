# Reprodução da execução HTTP — HU-014

Este material auxilia a execução dos dez casos da [suíte manual](../API-HU-014.md). Envia requisições HTTP por TCP ao Uvicorn real e consulta PostgreSQL em novas conexões. Não altera o código do produto, não usa mocks nem sobrescreve autenticação/dependências. Os esperados continuam definidos na suíte; os arquivos JSON guardam os resultados reais por variação.

## Ambiente isolado

Usar checkout do commit a testar, Docker Compose, imagens `postgres:15-alpine`, `quay.io/minio/minio` e uma imagem de dependências do backend (`atu-app-backend:latest`). A pasta `backend/` do checkout é montada integralmente como somente leitura em `/app`; a imagem não substitui o código testado. Conferir as versões efetivas em `ambiente.json`.

Se a imagem de dependências não existir, construí-la a partir de `backend/Dockerfile`. O compose aplica `alembic upgrade head` em banco novo; não usa `create_all`, `stamp` nem restaura banco de demonstração. Tem volumes, rede e porta próprios, sem acessar os outros ambientes da máquina.

Na raiz do checkout, para uma **nova** rodada (usar outro runtime/diretório de evidências se já existirem):

```bash
python3 tests/manual/epico-04/HU-014/api/execucao/preparar_ambiente.py
docker compose --env-file /tmp/hu014-runtime/runtime.env -p atu-qa-hu014-oficial -f tests/manual/epico-04/HU-014/api/execucao/compose.yaml up -d
docker compose --env-file /tmp/hu014-runtime/runtime.env -p atu-qa-hu014-oficial -f tests/manual/epico-04/HU-014/api/execucao/compose.yaml logs --tail 15 api
```

Confirmar migrations e `Application startup complete` antes de executar. API exposta apenas em `http://127.0.0.1:8014`. Segredos aleatórios ficam em `/tmp/hu014-runtime/runtime.env`, modo 0600, fora do Git. As contas são sintéticas em `example.com`; login passa pelo endpoint real e os tokens ficam somente na memória do executor.

## Ordem da execução

```bash
docker compose --env-file /tmp/hu014-runtime/runtime.env -p atu-qa-hu014-oficial -f tests/manual/epico-04/HU-014/api/execucao/compose.yaml exec -T api python /qa/executar.py consulta
docker compose --env-file /tmp/hu014-runtime/runtime.env -p atu-qa-hu014-oficial -f tests/manual/epico-04/HU-014/api/execucao/compose.yaml exec -T api python /qa/executar.py cancelamento
docker compose --env-file /tmp/hu014-runtime/runtime.env -p atu-qa-hu014-oficial -f tests/manual/epico-04/HU-014/api/execucao/compose.yaml exec -T api python /qa/executar.py integridade
```

- `consulta`: CT-001 a CT-003; cria massa e guarda o mapa de ids. Requer banco novo e sem massa anterior da rodada. O cenário do CT-002 sem rota é coletado antes da criação da rota para não alterar reservas existentes.
- `cancelamento`: CT-004 a CT-009; consome a massa da primeira fase, prepara reservas de hoje e completa 22 ativos pela API. Executar no mesmo dia local da primeira fase; o executor interrompe se atravessar a meia-noite.
- `integridade`: CT-010; injeta uma falha real de PostgreSQL ao inserir o log de cancelamento, antes do commit, e verifica rollback da reserva/log/contador. Remove o trigger em `finally`, repete com sucesso e registra a ausência da alocação real como parte bloqueada. Não cria alocação fictícia nem afirma comprovar atomicidade com tabela inexistente.

Cadastros de bairro, ponto, IES, rota e reservas futuras passam pela API. Somente as contas/documentos sintéticos, histórico de ontem e feriado/recesso são fixtures diretas. Não se altera o relógio do sistema. Para o CT-005, muda-se pela API o horário da rota de teste: uma saída futura no dia e depois uma já passada, com registro da hora local real e restauração ao final.

Cada caso grava requisições sem headers/tokens, respostas, duração, verificações e snapshots do banco. Falha de uma verificação produz `FAIL`; ausência de dependência é registrada separadamente. Medições são HTTP local em um único ambiente, não teste de carga nem medição da renderização móvel. A conclusão é revisada e transcrita para a suíte com links às evidências.

## Preservação e encerramento

Não executar a primeira fase novamente sobre a massa consumida nem sobrescrever evidências de uma rodada concluída. Para repetir, criar outro projeto/volumes e outro diretório de saída, preservando o anterior. Se a execução for interrompida durante a instrumentação do CT-010, verificar e remover apenas `qa_hu014_fail_cancel` da própria stack de QA antes de continuar.

Ao terminar, parar os containers do projeto de teste, mantendo seus volumes para revisão:

```bash
docker compose --env-file /tmp/hu014-runtime/runtime.env -p atu-qa-hu014-oficial -f tests/manual/epico-04/HU-014/api/execucao/compose.yaml stop
```

Versionar evidências sanitizadas e resultados. Não versionar `runtime.env`, tokens, senhas ou dados de ambientes compartilhados.
