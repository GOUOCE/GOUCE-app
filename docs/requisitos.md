# Especificações de Requisitos — Gestão de Ônibus Universitários de Ocara-CE

**Universidade Federal do Ceará — Campus Quixadá**
Documento de Especificação de Requisitos apresentado à disciplina de Projeto Integrado em Engenharia de Software III do curso de Engenharia de Software da UFC — Campus de Quixadá.
**Professor(a):** Leonara Braz

**Autores:**

- Clidenor Lopes Martins Filho — 566434
- Cauan Ricardo — 569566
- Felipe da Silva Maia — 514914
- João Vitor Rodrigues — 567428
- Maria José Pinho Barros — 556324
- Radlei Eugenio Doroth — 568379

Quixadá - CE, 2026

## Histórico de Versões

| Versão | Data       | Autor          | Descrição                                   |
| ------ | ---------- | -------------- | ------------------------------------------- |
| 0.1    | 16/08/2026 | Clidenor Lopes | Iniciando escopo do projeto                 |
| 0.2    | 17/08/2026 | Clidenor Lopes | Elicitando requisitos do projeto legado web |
| 1.0    | 25/08/2026 | Clidenor Lopes | Terminando Épicos e HUs                     |

---

## 1. Introdução

### 1.1 Objetivo do Documento

Este documento tem como objetivo especificar os requisitos do sistema App de Transporte Universitário de Ocara-CE, descrevendo suas funcionalidades, requisitos funcionais e não funcionais, regras de negócio, restrições, riscos e demais informações necessárias para orientar o desenvolvimento, testes e manutenção do software.

Este documento serve como referência para desenvolvedores, analistas, testadores, gestores de projeto e demais partes interessadas, garantindo uma compreensão sobre o comportamento esperado do sistema.

### 1.2 Escopo

O sistema App de Transporte Universitário de Ocara-CE tem como finalidade gerenciar o transporte universitário do município de Ocara-CE, permitindo controle de estudantes, ônibus, rotas, motoristas e acompanhamento da frequência diária.

Estão contempladas neste documento as funcionalidades previstas para esta versão do projeto, bem como suas restrições, requisitos e critérios de aceitação.

As funcionalidades não descritas neste documento não fazem parte do escopo desta versão do sistema.

### 1.3 Público-alvo

Este documento destina-se aos envolvidos no desenvolvimento e utilização do sistema, incluindo:

- Desenvolvedores
- Analistas de Softwares
- Testadores (QA)
- Professores
- Stakeholders
- Usuários responsáveis pela validação do sistema (Alunos, Motoristas e Administração)

---

## 2. Visão Geral do Projeto

### 2.1 Contexto do Projeto

Este sistema foi desenvolvido para solucionar a descentralização de informações, o excesso de trabalho manual na gestão das rotas e a falha de comunicação no controle do transporte universitário.

Atualmente, o processo de agendamento e alocação é realizado de forma inteiramente manual. Os alunos preenchem formulários semanais para informar os dias em que utilizarão o transporte, e a equipe administrativa consolida esses dados em planilhas. A definição de qual motorista e veículo farão determinada rota (faculdade) também é registrada nessas planilhas. A comunicação das rotas diárias é feita através de mensagens em grupos de WhatsApp, o que gera ruídos e dificulta a consulta rápida. As principais dificuldades incluem: a alta suscetibilidade a erros humanos no manuseio das planilhas, o esforço repetitivo da administração para avisar os alunos nos grupos, e a péssima experiência do usuário final, já que os estudantes frequentemente ficam perdidos no momento do embarque por não conseguirem identificar visualmente qual é o seu ônibus ou motorista designado.

Com a implementação deste sistema, espera-se proporcionar maior eficiência, confiabilidade e facilidade na execução das atividades relacionadas.

### 2.2 Objetivos do Sistema

O sistema possui os seguintes objetivos:

- Automatizar o processo de agendamento de uso do transporte e o controle de presença (frequência) dos estudantes.
- Otimizar a alocação logística de veículos e motoristas de forma inteligente, mitigando a superlotação e a ociosidade dos ônibus.
- Melhorar a experiência do usuário final, fornecendo informações claras e em tempo real sobre qual veículo, rota e motorista foram designados para ele naquele dia específico.
- Centralizar a comunicação oficial entre a coordenação de transportes e os estudantes por meio de um mural de avisos integrado ao aplicativo.
- Disponibilizar dados precisos sobre a ocupação de rotas e quilometragem dos motoristas para apoiar a tomada de decisão gerencial e garantir rodízios justos.

### 2.3 Perfis de Usuário

Os principais perfis de usuário previstos para o sistema são:

**Tabela 1 — Perfis de Usuário**

| Perfil        | Descrição                                                                                                                                                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Administrador | Perfil destinado aos gestores da coordenação de transportes. Possui acesso total ao sistema para gerenciar alunos, frota de ônibus, motoristas e faculdades, além de definir rotas, visualizar relatórios de frequência e gerenciar o mural de avisos. |
| Aluno         | Perfil principal do aplicativo mobile, destinado aos estudantes universitários. Requer autenticação e permite visualizar a sua alocação (ônibus, rota e motorista do dia) e acessar os comunicados.                                                    |
| Motorista     | Perfil no aplicativo mobile destinado aos condutores dos veículos. Requer autenticação e permite acesso focado exclusivamente na visualização da sua rota do dia e no controle (checagem) da lista de embarque dos alunos.                             |

_Fonte: Elaborado pelo Clidenor (2026)._

### 2.4 Integrações Externas

O sistema poderá integrar-se com serviços externos necessários ao seu funcionamento. As integrações previstas são apresentadas na tabela abaixo.

**Tabela 2 — Integrações Externas**

| Sistema                        | Finalidade                                                                                                                                                           |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API RESTful (Back-end Próprio) | Comunicação estruturada entre o aplicativo mobile (Front-end) e o servidor central do projeto para consumo de dados, autenticação e validação das regras de negócio. |
| Serviços de notificação push   | Serviço responsável pelo envio de notificações push diretamente para os smartphones dos alunos para alertas do mural de avisos.                                      |
| Serviço de Mapas               | Serviço responsável por fornecer recursos de localização e mapas quando necessários ao sistema.                                                                      |

_Fonte: Elaborado pelo autor (2026)._

---

## 3. Requisitos Funcionais

### 3.1 Definição

Os requisitos funcionais descrevem as funcionalidades e os comportamentos esperados do sistema. Cada requisito representa uma necessidade que haverá de ser implementada para atender os objetivos definidos neste documento.

**Tabela 3 — Requisitos Funcionais**

| ID     | Nome                                  | Descrição                                                                                                                                                                                                                                               | Prioridade | Status    |
| ------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------- |
| RF-001 | Autenticação (Login)                  | O sistema deve permitir o login de alunos, motoristas e administradores com credenciais válidas.                                                                                                                                                        | Alta       | A definir |
| RF-002 | Recuperação de Senha                  | O sistema deve permitir que os usuários redefinam suas senhas esquecidas de forma segura (ex: via e-mail ou código SMS).                                                                                                                                | Alta       | A definir |
| RF-003 | Controle de Acesso por Perfil         | O sistema deve restringir o acesso a menus e funções com base no perfil logado (Aluno, Motorista ou Administrador).                                                                                                                                     | Alta       | A definir |
| RF-004 | Aceite de Termos de Uso               | O sistema deve exigir que o aluno leia e aceite os termos de uso e política de privacidade no momento do cadastro.                                                                                                                                      | Alta       | A definir |
| RF-005 | Cadastro de Aluno                     | O sistema deve permitir que os estudantes realizem uma solicitação de cadastro no aplicativo, informando seus dados e anexando os documentos obrigatórios (comprovante de residência e matrícula).                                                      | Alta       | A definir |
| RF-006 | Edição de Perfil                      | O sistema deve permitir que o aluno logado edite seus dados pessoais, como telefone e bairro de residência.                                                                                                                                             | Média      | A definir |
| RF-007 | Gerenciamento de Administradores      | O sistema deve permitir criar, editar e inativar perfis com privilégios administrativos.                                                                                                                                                                | Alta       | A definir |
| RF-008 | Gerenciamento de Frota                | O sistema deve permitir ao administrador cadastrar, editar e inativar ônibus.                                                                                                                                                                           | Alta       | A definir |
| RF-009 | Gerenciamento de Motoristas           | O sistema deve permitir ao administrador cadastrar, editar e inativar motoristas.                                                                                                                                                                       | Alta       | A definir |
| RF-010 | Gerenciamento de Faculdades           | O sistema deve permitir ao administrador cadastrar, editar e inativar as faculdades de destino.                                                                                                                                                         | Alta       | A definir |
| RF-011 | Gerenciamento de Bairros e Pontos     | O sistema deve permitir ao administrador cadastrar e manter os bairros e seus respectivos pontos de parada.                                                                                                                                             | Alta       | A definir |
| RF-012 | Definição de Rotas e Bairros          | O sistema deve permitir ao administrador estruturar as rotas, vinculando os bairros correspondentes.                                                                                                                                                    | Alta       | A definir |
| RF-013 | Gerenciamento de Horários             | O sistema deve permitir ao administrador definir os horários de saída e retorno associados a cada rota.                                                                                                                                                 | Alta       | A definir |
| RF-014 | Inativação de Entidades (Soft Delete) | O sistema deve permitir inativar cadastros (ônibus, motoristas, etc.) sem apagá-los do banco de dados, preservando relatórios antigos, e permitir que o administrador visualize os registros inativos quando necessário.                                | Alta       | A definir |
| RF-015 | Agendamento de Transporte             | O sistema deve permitir que o aluno informe, para cada dia de utilização do transporte, se utilizará o ônibus, a rota complementar, o horário, o ponto de embarque e a instituição de ensino de destino, bem como as informações referentes ao retorno. | Alta       | A definir |
| RF-016 | Cancelamento de Agendamento           | O sistema deve permitir que o aluno cancele seu agendamento de utilização do transporte para determinado dia.                                                                                                                                           | Alta       | A definir |
| RF-017 | Distribuição de Alunos                | O sistema deve permitir a distribuição dos alunos confirmados nos ônibus disponíveis, considerando a capacidade de cada veículo e permitindo a realocação de alunos para outro ônibus quando a capacidade máxima for atingida.                          | Alta       | A definir |
| RF-018 | Alocação de Motoristas                | O sistema deve permitir ao administrador definir qual motorista fará qual rota no dia.                                                                                                                                                                  | Alta       | A definir |
| RF-019 | Consulta de Alocação Diária           | O sistema deve exibir para o aluno qual ônibus, motorista, rota, letreiro e placa do ônibus foram designados para ele no dia.                                                                                                                           | Alta       | A definir |
| RF-020 | Visualização da Lista de Embarque     | O sistema deve permitir ao administrador visualizar a lista detalhada de alunos distribuídos por cada ônibus/rota, e permitir ao motorista visualizar exclusivamente a lista do seu veículo designado para o dia.                                       | Alta       | A definir |
| RF-021 | Acompanhamento de Frequência          | O sistema deve permitir ao motorista registrar a presença (check-in) dos estudantes no momento do embarque, e permitir ao administrador visualizar esse controle em tempo real.                                                                         | Alta       | A definir |
| RF-022 | Geração de Relatórios                 | O sistema deve gerar relatórios quantitativos de alunos por dia, faculdade e localidade, incluindo informações sobre a quantidade de alunos que utilizam efetivamente o transporte.                                                                     | Média      | A definir |
| RF-023 | Rotatividade Inteligente              | O sistema deve permitir o gerenciamento do rodízio semanal dos ônibus entre diferentes rotas, visando equilibrar a quilometragem percorrida pelos veículos.                                                                                             | Média      | A definir |
| RF-024 | Publicação de Avisos                  | O sistema deve permitir ao administrador criar e publicar comunicados no mural de avisos.                                                                                                                                                               | Média      | A definir |
| RF-025 | Recebimento de Notificações Push      | O sistema móvel deve receber e exibir alertas push no celular do aluno sempre que houver aviso urgente ou alteração de rota.                                                                                                                            | Média      | A definir |
| RF-028 | Gerenciamento de Rotas Complementares | O sistema deve permitir ao administrador cadastrar e manter as rotas complementares e suas respectivas opções de utilização, horários e pontos de conexão com as rotas principais.                                                                      | Alta       | A definir |
| RF-029 | Consulta de Rota Complementar         | O sistema deve permitir que o aluno consulte, quando aplicável, a rota complementar que deverá utilizar e as informações necessárias para realizar a transferência para a rota principal.                                                               | Alta       | A definir |
| RF-030 | Upload de Comprovantes                | O sistema deve permitir que o aluno envie arquivos (PDF ou imagem) referentes aos comprovantes de vínculo institucional e residência.                                                                                                                   | Alta       | A definir |
| RF-031 | Avaliação de Solicitação de Cadastro  | O sistema deve permitir ao administrador visualizar a fila de solicitações pendentes, consultar os documentos anexados pelo aluno e aprovar ou reprovar o cadastro.                                                                                     | Alta       | A definir |
| RF-032 | Emissão de Carteirinha Digital        | O sistema deve gerar automaticamente uma carteirinha de identificação digital para os alunos com status 'Aprovado', exibindo foto, dados do aluno, instituição e QR Code.                                                                               | Alta       | A definir |
| RF-033 | Renovação Semestral                   | O sistema deve bloquear o agendamento de transporte no início de cada semestre letivo até que o aluno envie um novo comprovante de matrícula para revalidação.                                                                                          | Alta       | A definir |

_Fonte: Elaborado pelo Clidenor (2026)._

> **Nota:** os IDs RF-026 e RF-027 não constam no documento original.

---

## 4. Requisitos Não Funcionais

### 4.1 Definição

Os requisitos não funcionais descrevem as características de qualidade, desempenho, segurança, confiabilidade, usabilidade e demais restrições que o sistema deverá atender durante suas operações.

**Tabela 4 — Requisitos Não Funcionais**

| ID      | Nome                                        | Descrição                                                                                                                                                                                                                                       | Prioridade | Status    |
| ------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------- |
| RNF-001 | Desempenho (Tempo de Resposta)              | O sistema deve processar as requisições e retornar os dados na interface móvel em até 3 segundos em condições normais de conexão com a internet.                                                                                                | Alta       | A definir |
| RNF-002 | Segurança (Armazenamento)                   | As senhas dos usuários devem ser armazenadas no banco de dados utilizando um algoritmo de hash seguro e irreversível.                                                                                                                           | Alta       | A definir |
| RNF-003 | Segurança (Tráfego de Dados)                | Toda a comunicação entre o aplicativo móvel e a API (back-end) deve ser criptografada utilizando o protocolo HTTPS.                                                                                                                             | Alta       | A definir |
| RNF-004 | Usabilidade (Adaptação de Interface)        | A interface do aplicativo deve adaptar-se corretamente aos diferentes tamanhos e resoluções de telas de smartphones, mantendo a legibilidade e usabilidade.                                                                                     | Alta       | A definir |
| RNF-005 | Compatibilidade (Sistemas Operacionais)     | O aplicativo deve ser compatível com versões dos sistemas operacionais móveis que atendam à maioria dos dispositivos utilizados pelos alunos, considerando inclusive dispositivos mais antigos compatíveis com o aplicativo.                    | Alta       | A definir |
| RNF-006 | Disponibilidade                             | O sistema deve apresentar disponibilidade mínima de 99% mensalmente, exceto durante os períodos previamente programados de manutenção.                                                                                                          | Alta       | A definir |
| RNF-007 | Escalabilidade                              | O sistema deve suportar pelo menos 500 usuários simultâneos mantendo o tempo de resposta definido no RNF-001.                                                                                                                                   | Média      | A definir |
| RNF-008 | Manutenibilidade                            | O código-fonte deve seguir os padrões arquiteturais estabelecidos pela equipe e implementar testes automatizados para as principais regras de negócio.                                                                                          | Média      | A definir |
| RNF-009 | Segurança (Controle de Acesso)              | O sistema deve implementar mecanismos rigorosos de autorização para garantir que os alunos e motoristas não consigam acessar endpoints e rotas administrativas na API.                                                                          | Alta       | A definir |
| RNF-010 | Privacidade e Proteção de Dados             | O sistema deve garantir a proteção dos dados pessoais dos usuários (LGPD), permitindo acesso e tratamento das informações somente por usuários autorizados.                                                                                     | Alta       | A definir |
| RNF-011 | Confiabilidade (Backup)                     | O sistema deve realizar cópias de segurança (backups) periódicas do banco de dados, garantindo a recuperação integral em caso de falhas.                                                                                                        | Alta       | A definir |
| RNF-012 | Integridade dos Dados                       | O sistema deve garantir a consistência do banco de dados, impedindo operações que resultem em registros órfãos ou relacionamentos inválidos entre alunos, rotas e alocações.                                                                    | Alta       | A definir |
| RNF-013 | Segurança (Auditoria)                       | O sistema deve registrar um log das operações administrativas críticas (ex: quem alterou o motorista da rota, quem inativou um ônibus), contendo usuário, ação e timestamp.                                                                     | Média      | A definir |
| RNF-014 | Confiabilidade das Notificações             | O sistema deve garantir o disparo das notificações push sempre que os eventos configurados ocorrerem, repassando-os adequadamente para os serviços nativos (Firebase/APNs).                                                                     | Média      | A definir |
| RNF-015 | Disponibilidade das Informações de Alocação | O aplicativo deve permitir a consulta das informações de alocação previamente disponibilizadas ao aluno, mesmo quando o dispositivo estiver temporariamente sem conexão com a internet.                                                         | Alta       | A definir |
| RNF-016 | Armazenamento de Arquivos em Nuvem          | Os documentos e comprovantes enviados pelos usuários devem ser armazenados em um serviço de armazenamento de arquivos em nuvem, separado do banco de dados relacional, evitando o armazenamento direto dos arquivos binários no banco de dados. | Alta       | A definir |

_Fonte: Elaborado pelo Clidenor (2026)._

---

## 5. Regras de Negócio

### 5.1 Definição

As regras de negócio representam políticas, restrições e condições que devem ser respeitadas pelo sistema durante sua operação. Essas regras garantem que os processos implementados estejam em conformidade com as necessidades do domínio da aplicação.

**Tabela 5 — Regras de Negócio**

| ID     | Nome                                | Descrição                                                                                                                                                                                                                                          | Requisitos Relacionados  |
| ------ | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| RN-001 | Limite de Capacidade                | O sistema não deve permitir que a quantidade de alunos alocados em um veículo ultrapasse a capacidade máxima de assentos cadastrada para aquele ônibus específico.                                                                                 | RF-017                   |
| RN-002 | Prevenção de Conflito de Motorista  | O sistema deve impedir que um mesmo motorista seja alocado para mais de uma rota ou veículo no mesmo dia e horário.                                                                                                                                | RF-018                   |
| RN-003 | Prevenção de Conflito de Veículo    | O sistema deve impedir que um mesmo ônibus seja alocado para mais de uma rota no mesmo dia e horário.                                                                                                                                              | RF-017                   |
| RN-004 | Preservação de Histórico            | A inativação de ônibus, motoristas, faculdades, rotas e demais entidades que utilizem soft delete não deve alterar ou apagar os registros de alocações e relatórios de períodos anteriores.                                                        | RF-014, RF-022           |
| RN-005 | Cancelamento de Agendamento         | O aluno poderá cancelar seu agendamento de utilização do transporte para determinado dia, sem a obrigatoriedade de um horário limite previamente estabelecido.                                                                                     | RF-016                   |
| RN-006 | Exclusividade Administrativa        | Apenas usuários com perfil de Administrador poderão criar, editar ou inativar entidades centrais (ônibus, motoristas, rotas, faculdades) e publicar avisos.                                                                                        | RF-003, RF-007 ao RF-013 |
| RN-007 | Realocação por Capacidade           | Quando a capacidade máxima de um ônibus for atingida, os alunos excedentes deverão ser realocados para outro ônibus disponível.                                                                                                                    | RF-017                   |
| RN-008 | Rodízio de Ônibus                   | O rodízio deve ocorrer entre os ônibus e as diferentes rotas ao longo das semanas, buscando equilibrar a quilometragem percorrida pelos veículos.                                                                                                  | RF-023                   |
| RN-009 | Informações de Alocação Atualizadas | O sistema deve atualizar as informações de ônibus, motorista, rota e placa apresentadas ao aluno sempre que houver alteração em sua alocação.                                                                                                      | RF-019, RF-024           |
| RN-010 | Rotas Complementares                | Quando o aluno utilizar uma rota complementar, o sistema deve considerar a rota, o horário e o ponto de conexão definidos para sua transferência para a rota principal.                                                                            | RF-015, RF-028, RF-029   |
| RN-011 | Status de Cadastro Pendente         | Um aluno cuja solicitação de cadastro (ou renovação semestral) ainda não foi aprovada pelo Administrador não poderá acessar o menu de agendamento de rotas.                                                                                        | RF-005                   |
| RN-012 | Reprovação de Cadastro              | Caso a solicitação de cadastro do aluno seja reprovada, o sistema deve exigir que o administrador informe o motivo (ex: documento ilegível) e permitir que o aluno edite sua solicitação original e reenvie os documentos para uma nova avaliação. | RF-031                   |
| RN-013 | Validade do Vínculo Institucional   | O status de 'Aprovado' possui validade atrelada ao semestre acadêmico. Ao término do período configurado pela administração, a conta do aluno volta ao status 'Pendente', exigindo a etapa de Renovação Semestral.                                 | RF-033                   |
| RN-014 | Restrição de Check-in               | O registro de presença (check-in) na lista de embarque só pode ser habilitado e realizado no dia exato em que a viagem está agendada.                                                                                                              | RF-021                   |

_Fonte: Elaborado pelo Clidenor (2026)._

---

## 6. Riscos e Premissas

### 6.1 Definição

Esta seção apresenta os principais riscos identificados para o projeto, bem como as premissas consideradas durante o levantamento dos requisitos. Essas informações auxiliam na identificação de possíveis impactos ao desenvolvimento do sistema.

### 6.2 Riscos Identificados

**Tabela 6 — Riscos do Projeto**

| ID    | Risco                                                                     | Impacto | Probabilidade | Plano de Mitigação                                                                                                                                                                                |
| ----- | ------------------------------------------------------------------------- | ------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-001 | Baixa adesão dos alunos ao uso diário do aplicativo.                      | Alto    | Média         | Realizar campanhas de conscientização e configurar notificações push automáticas lembrando o aluno de confirmar a presença.                                                                       |
| R-002 | Indisponibilidade da API do Back-end.                                     | Alto    | Média         | Implementar tratamento de erros no mobile informando o usuário de forma clara e estruturar mecanismos de timeout adequados.                                                                       |
| R-003 | Falha na entrega das notificações push.                                   | Médio   | Baixa         | Garantir que o mural de avisos na tela inicial do aplicativo esteja sempre atualizado para que o aluno veja o alerta ao abrir o app, mesmo sem receber o push.                                    |
| R-004 | Atraso nas entregas técnicas por incompatibilidade de horários da equipe. | Médio   | Alta          | Acompanhar rigorosamente o andamento das tarefas pelo quadro Kanban no ClickUp e focar no desenvolvimento das funcionalidades principais (MVP) primeiro.                                          |
| R-005 | Alteração de requisitos pelo cliente.                                     | Alta    | Médio         | Validar e documentar os requisitos junto ao cliente antes do desenvolvimento e registrar formalmente alterações solicitadas durante o projeto, avaliando seus impactos no cronograma e no escopo. |
| R-006 | Dados incorretos cadastrados pela administração.                          | Alta    | Médio         | Implementar validações nos formulários administrativos e permitir a revisão dos dados cadastrados antes de sua utilização nas operações de transporte.                                            |

_Fonte: Elaborado pelo Clidenor (2026)._

### 6.3 Premissas

Durante o desenvolvimento deste projeto, considera-se que as seguintes premissas sejam verdadeiras:

- Os alunos possuem smartphones compatíveis e acesso à internet móvel ou Wi-Fi para realizar a confirmação diária e receber notificações.
- A equipe administrativa responsável pelo transporte em Ocara se comprometerá a manter os cadastros de ônibus, motoristas e rotas atualizados no sistema.
- O back-end estará funcional e disponibilizará os endpoints necessários para a integração com o aplicativo móvel e acesso aos dados do sistema.
- As tecnologias e bibliotecas selecionadas permanecerão disponíveis e adequadas ao desenvolvimento durante o ciclo do projeto.

---

## 7. Especificação das Funcionalidades

### 7.1 Introdução

Esta seção apresenta a especificação detalhada das funcionalidades do sistema, organizadas em Épicos e Histórias de Usuário. Cada funcionalidade descreve o comportamento esperado, seus critérios de aceitação e demais informações necessárias para orientar o desenvolvimento e a validação do sistema.

> Cada Épico (EP) agrupa um conjunto de Histórias de Usuário (HU) relacionadas. Cada HU segue a estrutura: História de Usuário, Critérios de Aceite, Fluxo Principal, Fluxos Alternativos, Regras de Negócio Relacionadas, Requisitos Relacionados e Protótipo da Interface (a maioria ainda marcada como **[A inserir]** no documento original).

7 ESPECIFICAÇÃO DAS FUNCIONALIDADES 7.1 Introdução Esta seção apresenta a especificação detalhada das funcionalidades do sistema, organizadas em Épicos e Histórias de Usuário. Cada funcionalidade descreve o comportamento esperado, seus critérios de aceitação e demais informações necessárias para orientar o desenvolvimento e a validação do sistema.

### EP-001 - Autenticação e Gestão de Conta

Este épico reúne todas as funcionalidades relacionadas ao processo de autenticação e gerenciamento de acesso ao sistema.

#### HU-001 - Solicitação de Cadastro de Aluno

**ID:** HU-001 &nbsp;·&nbsp; **Épico:** EP-001

_Link do formulário legado: https://docs.google.com/forms/d/e/1FAIpQLSdA-BW8qkz4Qf0KT5XubNMIyTnvuB8MbQYKSP_

**História de Usuário:** Como aluno, quero solicitar meu cadastro no aplicativo informando meus dados e anexando meus comprovantes, aceitando os termos de uso, para passar pela avaliação da coordenação e ter acesso às funcionalidades do sistema.

**Critérios de Aceite:**

1. Tela de cadastro exibe todos os campos do fluxo: e-mail, nome completo, senha, confirmação de senha, data de nascimento, raça, identificação de gênero, identificação sexual, "tem filhos" (sim/não), bairro/localidade, WhatsApp, instituição, curso, campus, período de ingresso e turno do curso, Upload do Comprovante de Matrícula (ou Histórico)", "Upload do Comprovante de Residência e quantidade de semestres.
2. Todos os campos do cadastro são obrigatórios: e-mail, nome completo, senha, confirmação de senha, data de nascimento, raça, identificação de gênero, identificação sexual, "tem filhos", bairro/localidade, WhatsApp, instituição, curso, campus, período de ingresso, turno do curso e quantidade de semestres. O sistema bloqueia o envio se qualquer um ficar em branco e sinaliza os campos pendentes.
3. Senha deve ter mínimo 8 caracteres, incluir pelo menos 1 maiúscula, 1 minúscula e 1 número; divergência com confirmação de senha ou não atendimento dessa regra bloqueia o envio e exibe mensagem de erro.
4. E-mail deve ser único no sistema; tentativa de cadastro com e-mail já existente bloqueia a conclusão e exibe mensagem orientando login ou recuperação de senha.
5. Sistema não avança para criação da conta sem o aceite explícito dos Termos de Uso e Política de Privacidade.
6. Falha de comunicação com a API durante o envio exibe mensagem de erro de conexão e mantém os dados já preenchidos na tela (sem exigir novo preenchimento).
7. Cadastro concluído exibe mensagem de sucesso e o status da conta do aluno fica como 'Pendente de Aprovação', impedindo o uso do agendamento até a validação do administrador
8. Senha é armazenada no banco com hash seguro e irreversível, nunca em texto puro (RNF-002).
9. Toda comunicação entre app e API durante o cadastro ocorre via HTTPS (RNF-003).

**Fluxo Principal:**

1. Usuário acessa a tela de cadastro pelo aplicativo
2. Usuário informa dados pessoais (nome, telefone, data de nascimento, raça, identificação de gênero, identificação sexual, filho), bairro de residência e informações acadêmicas (faculdade, curso, período que iniciou curso, turno do curso e quantidade de semestres.), além do comprovante de matrícula e de residência. (formulário anexado ao final)
3. O sistema exibe os termos de uso e política de privacidade.
4. Usuário aceita os termos de uso.
5. Sistema valida os dados informados.
6. O sistema salva a solicitação com status Pendente e exibe mensagem de envio para análise.

**Fluxos Alternativos:**

- **FA-001 - E-mail já cadastrado no sistema.**
  - O sistema identifica que o e-mail informado já possui cadastro.
  - O sistema exibe mensagem informando que o e-mail já está em uso e orienta o usuário a realizar login ou recuperar a senha.
- **FA-002 - Dados obrigatórios não preenchidos.**
  - O usuário tenta prosseguir sem preencher algum campo obrigatório.
  - O sistema bloqueia o envio e sinaliza os campos pendentes.
- **FA-003 - Usuário não aceita os termos de uso.**
  - O usuário opta por não aceitar os termos.
  - O sistema impede a conclusão do cadastro até que os termos sejam aceitos.
- **FA-004 - Falha na Conexão.**
  - O Sistema não consegue se comunicar com a API durante o envio do cadastro.
  - O sistema exibe mensagem de erro de conexão.
  - O sistema preserva os dados já preenchidos para nova tentativa.

**Regras de Negócio Relacionadas:**
_A definir._

**Requisitos Relacionados:**

- _Funcionais:_
  - RF-005
  - RF-004

- _Não funcionais:_
  - RNF-002 (Segurança - Armazenamento de senha com hash)
  - RNF - 003 (Segurança - HTTPs)
  - RNF-010(Privacidade e Proteção de Dados - LDPD

**Protótipo da Interface:** [A inserir]

#### HU-002 - Login de Usuários

**ID:** HU-002 &nbsp;·&nbsp; **Épico:** EP-001

**História de Usuário:** Como usuário (aluno, motorista ou administrador), quero acessar o sistema utilizando meu e-mail e senha, para autenticar minha identidade e acessar as funcionalidades restritas à minha conta.

**Critérios de Aceite:**

1. Tela de login exibe os campos "E-mail" e "Senha" e um botão para entrar.
2. Ambos os campos são obrigatórios; tentar entrar com algum vazio bloqueia a ação e destaca os campos pendentes.
3. Credenciais inválidas (e-mail não cadastrado ou senha incorreta) bloqueiam o acesso e exibem mensagem genérica: "E-mail ou senha incorretos. Tente novamente." (sem indicar qual dos dois campos está errado, por segurança).
4. Usuário com cadastro inativado (soft delete) não consegue logar mesmo com credenciais corretas; sistema exibe mensagem específica orientando contato com a coordenação.
5. Login bem-sucedido gera token de sessão e redireciona o usuário para a interface correspondente ao seu perfil (Aluno, Motorista ou Administrador).
6. Falha de comunicação com a API durante o login exibe mensagem de erro de conexão e permite nova tentativa sem perder os dados já digitados.
7. Tempo de resposta do login deve ser de até 3 segundos em condições normais de conexão (RNF-001).

**Fluxo Principal:**

1. O usuário acessa a tela de login do aplicativo.
2. O usuário preenche os campos "E-mail" e "Senha".
3. O usuário aciona o botão para entrar.
4. O sistema processa e valida as credenciais informadas.
5. O sistema autentica o usuário e gera o token de sessão.
6. O sistema redireciona o usuário para a interface apropriada ao seu perfil.

**Fluxos Alternativos:**

- **FA-001 - Credenciais inválidas.**
  - O usuário informa um e-mail não cadastrado ou uma senha incorreta.
  - O sistema impede o acesso e exibe a mensagem: "E-mail ou senha incorretos. Tente novamente."
- **FA-002 - Campos obrigatórios não preenchidos.**
  - O usuário tenta prosseguir com um ou ambos os campos em branco.
  - O sistema bloqueia a ação e destaca os campos obrigatórios pendentes.
- **FA-003 - Usuário inativado.**
  - O usuário tenta fazer login, mas seu cadastro sofreu soft delete (ex: administrador desativado).
  - O sistema impede o login e exibe a mensagem: "Usuário inativo. Entre em contato com a coordenação."
- **FA-004 - Falha na Conexão.**
  - O sistema não consegue se comunicar com a API durante a tentativa de login.
  - O sistema exibe uma mensagem clara de erro de conexão e orienta nova tentativa

**Regras de Negócio Relacionadas:**
_A definir._

**Requisitos Relacionados:**

- _Funcionais:_
  - RF-001 (Autenticação/Login)

- _Não funcionais:_
  - RNF-001 (Desempenho - Tempo de Resposta de 3 segundos).
  - RNF-002 (Segurança - Armazenamento de hash para a validação da senha).
  - RNF-003 (Segurança - Tráfego de Dados via HTTPS).

**Protótipo da Interface:** [A inserir]

#### HU-003 - Controle de Acesso por Perfil

**ID:** HU-003 &nbsp;·&nbsp; **Épico:** EP-001

**História de Usuário:** Como administrador do sistema, quero que o aplicativo restrinja o acesso a menus, telas e ações de acordo com o perfil do usuário logado (Aluno, Motorista ou Administrador), para garantir a integridade dos dados e impedir operações não autorizadas.

**Critérios de Aceite:**

1. Após login bem-sucedido (HU-002), o sistema identifica o perfil do usuário (Aluno ou Administrador) e renderiza a interface correspondente a esse perfil.
2. Usuário com perfil "Aluno" visualiza apenas menus e funcionalidades destinadas a alunos (ex: agendamento, consulta de alocação, mural de avisos), sem acesso a telas administrativas.
3. Usuário com perfil "Administrador" visualiza os menus de gestão (frota, motoristas, rotas, faculdades, relatórios, mural), conforme exclusividade administrativa definida em RN-006.
4. Usuário com perfil 'Motorista' visualiza apenas a tela da rota que lhe foi designada para o dia atual e a respectiva lista de embarque para realizar a chamada, sem acesso aos módulos de alunos ou configurações administrativas.
5. Tentativa de um usuário com perfil "Aluno" ou “Motorista” de acessar diretamente uma tela ou endpoint administrativo (via URL direta ou requisição manual à API) é bloqueada pelo sistema, sem exposição de dados sensíveis.
6. Requisição bloqueada por falta de privilégio retorna erro 403 (Forbidden) na API e exibe mensagem de "Acesso Negado" no app.
7. Toda requisição à API é validada quanto ao token e perfil do usuário, mesmo após o carregamento inicial da tela (não só no momento do login).
8. Se o perfil de um usuário logado for alterado (ex: promovido a administrador, ou inativado) durante uma sessão ativa, o sistema não aplica a mudança imediatamente na sessão em curso; a próxima requisição identifica a divergência, revoga o acesso atual e exige novo login para atualizar as permissões.

**Fluxo Principal:**

1. O usuário realiza o login com sucesso no sistema (conforme o fluxo da HU-002).
2. O sistema identifica o tipo de perfil vinculado à conta autenticada.
3. O sistema renderiza a interface customizada para aquele perfil.
4. O sistema libera apenas as funcionalidades, menus e botões correspondentes ao nível de acesso do usuário (ex: Aluno vê suas alocações; Administrador vê a gestão de frotas e usuários).
5. A API (back-end) valida o token e o perfil em todas as requisições subsequentes para garantir que a ação é permitida.

**Fluxos Alternativos:**

- **FA-001 - Tentativa de acesso a rota/tela não autorizada.**
  - Um usuário com perfil "Aluno" tenta acessar uma tela administrativa ou enviar uma requisição direta para um endpoint restrito na API.
  - O sistema intercepta a requisição e identifica a falta de privilégios.
  - O sistema bloqueia a ação, não expõe nenhum dado sensível e exibe uma mensagem de "Acesso Negado" (ou retorna erro 403 Forbidden no back-end).
- **FA-002 - Alteração de perfil durante a sessão.**
  - O perfil de um usuário logado é alterado no banco de dados por um administrador (ex: de Aluno para Administrador, ou inativado).
  - Na próxima requisição que o usuário fizer, o sistema identifica a divergência de permissões.
  - O sistema revoga o acesso atual e exige um novo login para atualizar as permissões da interface.

**Regras de Negócio Relacionadas:**

- RN-006

**Requisitos Relacionados:**

- _Funcionais:_
  - RF-003

- _Não funcionais:_
  - RNF-009

**Protótipo da Interface:** [Inserir imagem, print do figma ou Wireframe]

#### HU-004 - Recuperação de Senha

**ID:** HU-004 &nbsp;·&nbsp; **Épico:** EP-001

**História de Usuário:** Como usuário com conta previamente cadastrada, quero solicitar a recuperação da minha senha esquecida através do meu e-mail, para poder cadastrar uma nova credencial e recuperar o acesso ao sistema de forma segura.

**Critérios de Aceite:**

1. Tela de login exibe a opção "Esqueci minha senha", que leva a um campo solicitando o e-mail da conta.
2. Ao confirmar a solicitação com um e-mail cadastrado no sistema, o sistema gera um link/código de recuperação com tempo de expiração e envia para o e-mail informado.
3. Ao confirmar a solicitação com um e-mail não cadastrado, o sistema exibe a mesma mensagem genérica usada para e-mails válidos ("Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação"), sem revelar se a conta existe ou não.
4. Link/código de recuperação expirado ou já utilizado bloqueia o acesso à tela de nova senha e exibe mensagem orientando a solicitar novamente.
5. Tela de redefinição exige os campos "Nova Senha" e "Confirmar Nova Senha"; nova senha segue a mesma regra de complexidade da HU-001 (mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número).
6. Divergência entre "Nova Senha" e "Confirmar Nova Senha" desabilita o botão de envio e sinaliza o erro, sem permitir prosseguir.
7. Falha na comunicação com o serviço de envio de e-mail (SMTP) exibe mensagem orientando o usuário a tentar novamente em alguns minutos, sem travar a aplicação.
8. Redefinição concluída com sucesso exibe mensagem de confirmação e redireciona o usuário para a tela de login.
9. Após redefinição bem-sucedida, o usuário consegue fazer login imediatamente com a nova senha; tentativa de login com a senha antiga é rejeitada.

**Fluxo Principal:**

1. Na tela de login, o usuário aciona a opção "Esqueci minha senha".
2. O sistema exibe um campo solicitando o e-mail associado à conta.
3. O usuário informa o e-mail e confirma a solicitação.
4. O sistema verifica a existência da conta associada àquele e-mail.
5. O sistema gera um código ou link de recuperação seguro (com tempo de expiração) e envia para o e-mail do usuário.
6. O usuário acessa o link/código recebido e é direcionado para a tela de redefinição de senha.
7. O usuário digita a nova senha e a confirmação da nova senha.
8. O sistema valida as informações, aplica a criptografia (hash) na nova senha e atualiza o registro no banco de dados.
9. O sistema exibe uma mensagem de sucesso e redireciona o usuário para a tela de login.

**Fluxos Alternativos:**

- **FA-001 - E-mail não encontrado na base de dados.**
  - O usuário informa um e-mail que não está cadastrado.
  - O sistema processa a requisição, mas, por segurança (evitar varredura de contas), exibe uma mensagem genérica: "Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação".
- **FA-002 - Token ou link expirado/inválido.**
  - O usuário tenta acessar o link de recuperação após o tempo limite de segurança ter expirado ou tenta usar um código já utilizado.
  - O sistema bloqueia a tela de nova senha e exibe a mensagem: "Link de recuperação expirado ou inválido. Por favor, solicite novamente."
- **FA-003 - Divergência na confirmação da nova senha.**
  - Na tela de redefinição, o usuário digita senhas diferentes nos campos "Nova Senha" e "Confirmar Nova Senha".
  - O sistema desabilita o botão de envio e sinaliza que as senhas não coincidem, solicitando a correção antes de prosseguir.
- **FA-004 - Falha no envio do e-mail.**
  - O sistema back-end não consegue se comunicar com o serviço de envio de e-mails (SMTP).
  - O sistema exibe uma mensagem orientando o usuário a tentar novamente em alguns minutos.

**Regras de Negócio Relacionadas:**
_A definir._

**Requisitos Relacionados:**

- _Funcionais:_
  - RF-002

- _Não funcionais:_
  - RNF-002
  - RNF-003

**Protótipo da Interface:** [Inserir imagem, print do figma ou Wireframe]

#### HU-005 - Edição de Perfil do Aluno

**ID:** HU-005 &nbsp;·&nbsp; **Épico:** EP-001

**História de Usuário:** Como aluno autenticado no aplicativo, quero acessar e editar os dados do meu perfil (como telefone e bairro de residência), para manter minhas informações de contato e localização sempre atualizadas no sistema.

**Critérios de Aceite:**

1. Aluno autenticado acessa a área "Perfil" (ou "Minha Conta") e visualiza seus dados cadastrais atuais.
2. Aluno consegue editar telefone/WhatsApp e bairro de residência; ao salvar, o sistema valida e atualiza esses dados no banco.
3. Campos não editáveis pelo app (ex: e-mail, e demais dados que exigem intervenção administrativa) aparecem desabilitados/somente leitura na tela de edição, impedindo alteração direta pelo aluno.
4. Inserir telefone em formato inválido (ex: incompleto ou com letras) bloqueia o salvamento e exibe alerta de validação no campo correspondente.
5. Falha de comunicação com a API no momento do salvamento exibe mensagem de erro orientando verificar a conexão, mantendo os dados preenchidos na tela para nova tentativa.
6. Atualização concluída com sucesso exibe mensagem de confirmação ("Perfil atualizado com sucesso") e retorna o aluno para a visualização com os dados já atualizados.

**Fluxo Principal:**

1. O aluno acessa a área de "Perfil" (ou "Minha Conta") através do menu do aplicativo.
2. O sistema recupera e exibe as informações cadastrais atuais do aluno.
3. O aluno aciona a opção para editar os dados e altera as informações desejadas (ex: atualiza o número de telefone ou seleciona um novo bairro).
4. O aluno aciona o botão de salvar alterações.
5. O sistema valida as novas informações inseridas.
6. O sistema atualiza o registro do aluno no banco de dados.
7. O sistema exibe uma mensagem de sucesso ("Perfil atualizado com sucesso") e retorna o aluno para a visualização dos dados atualizados.

**Fluxos Alternativos:**

- **FA-001 - Dados inseridos com formato inválido.**
  - O aluno insere uma informação em um formato não aceito (ex: telefone incompleto ou letras no lugar de números).
  - O sistema impede o salvamento e exibe um alerta de validação no respectivo campo, orientando o usuário a corrigir o dado.
- **FA-002 - Tentativa de edição de dados não permitidos.**
  - O aluno tenta alterar dados que não são editáveis pelo aplicativo (como e-mail, CPF ou matrícula, se aplicável, que possam requerer intervenção administrativa).
  - O sistema deve manter esses campos desabilitados (modo leitura) na interface, impedindo a alteração direta.
- **FA-003 - Falha de comunicação na atualização.**
  - O aplicativo perde conexão com a internet ou não consegue se comunicar com a API no momento do salvamento.
  - O sistema exibe uma mensagem de erro ("Não foi possível salvar as alterações. Verifique sua conexão e tente novamente") e mantém os dados preenchidos na tela para nova tentativa.

**Regras de Negócio Relacionadas:**
_A definir._

**Requisitos Relacionados:**

- _Funcionais:_
  - RF-006

- _Não funcionais:_
  - RNF-003
  - RNF-010

**Protótipo da Interface:** [Inserir imagem, print do figma ou Wireframe]

#### HU-006 - Gerenciamento de Administradores

**ID:** HU-006 &nbsp;·&nbsp; **Épico:** EP-001

**História de Usuário:** Como administrador logado, quero acessar um painel para criar, visualizar, editar e inativar perfis com privilégios administrativos, para gerenciar os membros da equipe que têm acesso restrito e controle sobre as operações de transporte.

**Critérios de Aceite:**

1. Administrador acessa o menu "Gestão de Administradores" no painel gerencial e visualiza a listagem de perfis administrativos cadastrados (ativos e inativos).
2. Administrador consegue criar um novo perfil administrativo preenchendo nome e e-mail no formulário; o sistema valida se o e-mail é único.
3. E-mail duplicado (já utilizado por aluno ou outro administrador) bloqueia a criação e exibe mensagem: "Este e-mail já está em uso por outro usuário no sistema."
4. Administrador consegue editar dados de um perfil administrativo existente (nome, e-mail e demais informações).
5. Administrador consegue inativar (soft delete) um perfil administrativo, sem apagar o registro do banco de dados; operação é registrada no log de auditoria (usuário, ação, timestamp).
6. Tentativa de auto-inativação (administrador tenta inativar sua própria conta logada) é bloqueada com mensagem: "Não é possível inativar a conta atualmente em uso."
7. Inativação bem-sucedida exibe mensagem de confirmação ("Operação realizada com sucesso") e atualiza a listagem.
8. Administrador consegue visualizar perfis inativos na listagem quando necessário.
9. Acesso ao menu "Gestão de Administradores" é restrito a usuários com perfil de Administrador; tentativa de acesso sem privilégios retorna erro 403 (Acesso Negado) e redireciona para fora da área.

**Fluxo Principal:**

1. O administrador acessa o menu de "Gestão de Administradores" no painel gerencial.
2. O sistema exibe uma listagem com os perfis administrativos cadastrados (ativos e inativos).
3. O administrador seleciona a ação desejada: "Novo Administrador", "Editar" ou "Inativar" em um registro existente.
4. O administrador preenche os dados necessários no formulário (nome, e-mail, etc.) ou confirma a inativação do usuário selecionado.
5. O sistema valida as informações e as permissões do usuário logado.
6. O sistema executa a operação, salva no banco de dados (aplicando o soft delete em caso de inativação) e gera um registro no log de auditoria.
7. O sistema exibe uma mensagem de sucesso ("Operação realizada com sucesso") e atualiza a listagem na tela.

**Fluxos Alternativos:**

- **FA-001 - E-mail já utilizado em outro cadastro.**
  - Durante a criação ou edição, o administrador informa um e-mail que já pertence a outra conta (aluno ou outro admin).
  - O sistema bloqueia a ação e exibe a mensagem: "Este e-mail já está em uso por outro usuário no sistema."
- **FA-002 - Auto-inativação.**
  - O administrador tenta inativar o seu próprio perfil logado.
  - O sistema impede a ação e exibe um alerta, informando que não é possível inativar a conta atualmente em uso.
- **FA-003 - Restrição de acesso por perfil incorreto.**
  - Um usuário tenta forçar o acesso à rota de gerenciamento de administradores sem o token administrativo válido.
  - O sistema nega o acesso instantaneamente e redireciona o usuário para fora da área restrita (Acesso Negado).

**Regras de Negócio Relacionadas:**

- RN-001
- RN-003

**Requisitos Relacionados:**

- RF-001
- RNF-003

**Protótipo da Interface:** [Inserir imagem, print do figma ou Wireframe]

#### HU-027 - Avaliação de Solicitação de Cadastro

**ID:** HU-027 &nbsp;·&nbsp; **Épico:** EP-001

**História de Usuário:** Como administrador, quero acessar a fila de solicitações de cadastro pendentes, visualizar os dados preenchidos e os documentos anexados pelo aluno, para decidir se aprovo ou reprovo o pedido, garantindo que apenas estudantes elegíveis utilizem o transporte.

**Critérios de Aceite:**
_A definir._

**Fluxo Principal:**

1. O administrador acessa o menu de "Solicitações Pendentes".
2. Seleciona o cadastro de um aluno específico.
3. Visualiza os dados e clica nos anexos para conferir a validade dos documentos.
4. O administrador clica em "Aprovar".
5. O sistema atualiza o status no banco de dados e notifica o aluno.
6. O sistema retorna o administrador para a fila de pendentes, que é recarregada.

**Fluxos Alternativos:**

- **FA-001 - Reprovação do Cadastro**
  - O administrador identifica que um documento é inválido ou ilegível e clica em "Reprovar".
  - O sistema exibe um campo de texto obrigatório solicitando o motivo.
  - O administrador descreve o motivo (ex: "Comprovante de matrícula desatualizado") e confirma.
  - O sistema salva o status como Reprovado, armazena o motivo e notifica o aluno para correção.

**Regras de Negócio Relacionadas:**

- RN-012
- RN-006

**Requisitos Relacionados:**

- RF-031
- RNF-016

**Protótipo da Interface:** [Inserir imagem, print do figma ou Wireframe]

#### HU-028 - Renovação de Vínculo Institucional

**ID:** HU-028 &nbsp;·&nbsp; **Épico:** EP-001

**História de Usuário:** Como aluno com cadastro previamente aprovado, quero realizar o upload do meu comprovante de matrícula atualizado no início de um novo semestre letivo, para revalidar meu vínculo institucional e voltar a ter o direito de agendar o transporte.

**Critérios de Aceite:**
1. Aluno com vínculo vencido (início de novo semestre letivo) faz login e visualiza um aviso destacado de necessidade de renovação, com a opção de iniciar o processo de revalidação.
2. Sistema exige a seleção de um arquivo (comprovante de matrícula) antes de habilitar ou permitir a ação de envio; tentativa de enviar sem anexo bloqueia a tela e exibe alerta de obrigatoriedade.
3. Sistema valida formato e tamanho do arquivo anexado (ex: permite apenas PDF, JPG, PNG e tamanho máximo de 5MB); arquivos fora da regra bloqueiam o envio e exibem mensagem indicando "Formato inválido" ou "Arquivo excede o limite de tamanho".
4. Falha de conexão ou erro de comunicação com a API durante o upload (FA-001) interrompe o processo, exibe mensagem de erro ("Falha no envio. Verifique sua conexão e tente novamente") e mantém a tela de renovação ativa para nova tentativa.
5. Envio concluído com sucesso exibe mensagem de confirmação ("Comprovante enviado com sucesso") e altera o status do aluno para "Em Análise", encaminhando o documento para a fila do administrador.
6. Enquanto o status do aluno for "Em Análise" (aguardando a aprovação do administrador), o sistema mantém o acesso ao menu de agendamentos bloqueado, exibindo apenas um informativo de que a liberação depende da validação do documento.


**Fluxo Principal:**

1. O aluno faz login e visualiza o aviso de necessidade de renovação.
2. O aluno seleciona a opção de renovar vínculo.
3. O sistema solicita o envio do arquivo do comprovante de matrícula.
4. O aluno faz o upload do documento e envia.
5. O sistema exibe mensagem de sucesso e envia o cadastro para a fila do administrador.

**Fluxos Alternativos:**

- **FA-001 - Falha de Conexão no Envio**
  - O aplicativo perde a conexão durante o upload.
  - O sistema exibe mensagem de erro e orienta a tentar novamente, mantendo a tela de renovação ativa.

**Regras de Negócio Relacionadas:**

- RN-013
- RN-011

**Requisitos Relacionados:**

- _Funcionais:_
  - RF-033
  - RF-030

**Protótipo da Interface:** [A inserir]

#### HU-029 - Carteirinha Digital do Aluno

**ID:** HU-029 &nbsp;·&nbsp; **Épico:** EP-001

**História de Usuário:** Como aluno com status aprovado, quero acessar minha carteirinha digital diretamente no aplicativo, exibindo minha foto, dados e um QR Code, para comprovar minha identidade e meu direito de utilizar o ônibus no momento do embarque.

**Critérios de Aceite:**
1. Aluno com status "Aprovado" acessa a opção "Carteirinha Digital" e visualiza a interface do documento contendo obrigatoriamente: foto de perfil do aluno, dados de identificação (ex: nome completo, curso, instituição) e o QR Code gerado.
2. Tentativa de acesso à carteirinha por um aluno que não possua o status "Aprovado" (ex: status "Em Análise" da HU-028, ou "Inativo") oculta o documento e exibe uma mensagem informativa (ex: "Carteirinha indisponível. Seu cadastro está inativo ou em análise.").
3. (FA-001) Se o aluno acessar a funcionalidade sem conexão com a internet (offline), o sistema não deve exibir erro de conexão; em vez disso, deve carregar instantaneamente a versão em cache da carteirinha (salva na última conexão válida), exibindo normalmente a foto, dados e o QR Code.
4. O QR Code exibido na tela deve possuir nitidez, tamanho e contraste adequados para garantir a leitura/escaneamento pelos validadores físicos (câmeras/celulares) no momento do embarque, mesmo no modo offline.
5. O tempo de carregamento e renderização da carteirinha na tela (quando online) deve ser rápido, não travando a navegação do usuário no momento em que ele estiver na fila de embarque.

**Fluxo Principal:**

1. O aluno aprovado acessa o aplicativo.
2. No menu principal ou tela inicial, o aluno seleciona "Carteirinha Digital".
3. O sistema carrega e exibe a interface gráfica da carteirinha com os dados do aluno.

**Fluxos Alternativos:**

- **FA-001 - Consulta de Carteirinha Offline**
  - O aluno tenta acessar a carteirinha no momento do embarque sem conexão de internet.
  - O sistema exibe a versão em cache da carteirinha gerada na última conexão válida.

**Regras de Negócio Relacionadas:**

- Nenhuma restritiva

**Requisitos Relacionados:**

- _Funcionais:_
  - RF-032

**Protótipo da Interface:** [A inserir]

### EP-002 - Gestão de Cadastros Base

Este épico reúne todas as funcionalidades relacionadas ao cadastro e manutenção das entidades estruturais essenciais para o funcionamento do transporte. Ele centraliza a gestão da infraestrutura básica do sistema incluindo bairros, pontos de parada, faculdades, veículos e motoristas , fornecendo a base de dados necessária para a posterior criação de rotas e alocação logística.

#### HU-007 - Gerenciamento de Administradores

**ID:** HU-007 &nbsp;·&nbsp; **Épico:** EP-002

**História de Usuário:** Como administrador, quero acessar um painel para cadastrar, visualizar, editar e inativar bairros e seus respectivos pontos de parada, para estruturar a base geográfica de embarque e desembarque dos estudantes.

**Critérios de Aceite:**

1. Administrador acessa o menu "Bairros e Pontos de Parada" e visualiza a listagem de bairros cadastrados com seus respectivos pontos de parada associados (ativos e inativos).
2. Administrador consegue criar um novo bairro preenchendo o nome e adicionando ao menos um ponto de parada; o sistema valida se o nome do bairro é único.
3. Bairro ou ponto de parada com nome já existente no sistema (ativo ou inativo) bloqueia o salvamento e exibe mensagem: "Esta localidade já está cadastrada."
4. Administrador consegue editar dados de um bairro existente (nome, pontos de parada associados).
5. Administrador consegue inativar (soft delete) um bairro ou ponto de parada, sem apagar o registro do banco de dados; operação é registrada no log de auditoria.
6. Tentativa de inativar um bairro que está vinculado a uma rota ativa é bloqueada com mensagem: "Este bairro não pode ser inativado pois pertence a uma rota ativa. Remova-o da rota antes de continuar."
7. Inativação bem-sucedida exibe mensagem de confirmação ("Operação realizada com sucesso") e atualiza a listagem.
8. Campos obrigatórios (nome do bairro e ao menos um ponto de parada) são destacados se vazios; sistema bloqueia salvamento até preenchimento.
9. Administrador consegue visualizar bairros e pontos inativos na listagem quando necessário.

**Fluxo Principal:**

1. O administrador acessa o menu de "Bairros e Pontos de Parada".
2. O sistema exibe a listagem dos bairros já cadastrados e seus respectivos pontos associados (ativos e inativos).
3. O administrador seleciona a ação: "Novo Cadastro", "Editar" ou "Inativar" em um registro existente.
4. O administrador preenche as informações (nome do bairro, nome/referência do ponto de parada) ou confirma a inativação.
5. O sistema valida os dados e aplica a operação no banco de dados (em caso de inativação, executando o soft delete para ocultar o registro sem apagá-lo definitivamente).
6. O sistema registra a operação no log de auditoria.
7. O sistema exibe uma mensagem de sucesso e recarrega a listagem atualizada.

**Fluxos Alternativos:**

- **FA-001 - Inativação de bairro/ponto vinculado a uma rota ativa.**
  - O administrador tenta inativar um bairro que está atualmente associado a uma rota estruturada.
  - O sistema bloqueia a inativação temporariamente e exibe um alerta: "Este bairro não pode ser inativado pois pertence a uma rota ativa. Remova-o da rota antes de continuar."
- **FA-002 - Cadastro duplicado.**
  - O administrador tenta salvar um bairro ou ponto de parada com um nome idêntico a um registro já existente e ativo.
  - O sistema bloqueia o salvamento e informa que a localidade já está cadastrada.
- **FA-003 - Campos obrigatórios ausentes.**
  - O administrador tenta salvar o formulário sem inserir o nome do bairro ou sem definir ao menos um ponto de parada.
  - O sistema destaca os campos pendentes e impede a conclusão.

**Regras de Negócio Relacionadas:**

- RN-004
- RN-006

**Requisitos Relacionados:**

- _Funcionais:_
  - RNF-011
  - RF-014

- _Não funcionais:_
  - RNF-012
  - RNF-013

**Protótipo da Interface:** [A inserir]

#### HU-008 - Gerenciamento de Faculdades

**ID:** HU-008 &nbsp;·&nbsp; **Épico:** EP-002

**História de Usuário:** Como administrador, quero acessar um painel para cadastrar, visualizar, editar e inativar as faculdades de destino, para organizar as instituições de ensino que são atendidas pelas rotas de transporte.

**Critérios de Aceite:**

1. Administrador acessa o menu "Faculdades" e visualiza a listagem das faculdades cadastradas (ativas e inativas).
2. Administrador consegue criar uma nova faculdade preenchendo nome e campus no formulário; o sistema valida se a combinação (nome + campus) é única.
3. Faculdade com mesmo nome e campus já existente no sistema (ativa ou inativa) bloqueia o cadastro: "Esta faculdade já está cadastrada."
4. Administrador consegue editar dados de uma faculdade existente (nome, campus e demais informações).
5. Administrador consegue inativar (soft delete) uma faculdade, sem apagar o registro do banco de dados; operação é registrada no log de auditoria (usuário, ação, timestamp).
6. Tentativa de inativar uma faculdade que possui alunos agendados para datas futuras é bloqueada com mensagem: "Esta instituição possui viagens programadas pendentes. Não é possível inativar no momento."
7. Inativação bem-sucedida exibe mensagem de confirmação ("Operação realizada com sucesso") e atualiza a listagem.
8. Campos obrigatórios (nome e campus da instituição) são destacados se vazios; sistema bloqueia salvamento até preenchimento.
9. Administrador consegue visualizar faculdades inativas na listagem quando necessário.

**Fluxo Principal:**

1. O administrador acessa o menu de "Faculdades".
2. O sistema exibe a listagem das faculdades já cadastradas (ativas e inativas).
3. O administrador seleciona a ação desejada: "Novo Cadastro", "Editar" ou "Inativar" em um registro existente.
4. O administrador preenche as informações da faculdade (nome, campus, etc.) ou confirma a inativação do registro.
5. O sistema valida os dados e aplica a operação no banco de dados (executando o soft delete em caso de inativação).
6. O sistema registra a operação no log de auditoria.
7. O sistema exibe uma mensagem de sucesso e atualiza a listagem na tela.

**Fluxos Alternativos:**

- **FA-001 - Inativação de faculdade com agendamentos futuros.**
  - O administrador tenta inativar uma faculdade que possui alunos agendados para datas futuras.
  - O sistema bloqueia a inativação temporariamente e exibe um alerta informando que a instituição possui viagens programadas pendentes.
- **FA-002 - Cadastro duplicado.**
  - O administrador tenta salvar uma faculdade com o mesmo nome e campus de uma instituição já ativa no sistema.
  - O sistema bloqueia o cadastro e informa que a faculdade já existe.
- **FA-003 - Campos obrigatórios ausentes.**
  - O administrador tenta salvar o formulário sem preencher os dados principais da instituição.
  - O sistema sinaliza os campos vazios e impede o salvamento.

**Regras de Negócio Relacionadas:**

- RN-004
- RN-006

**Requisitos Relacionados:**

- _Funcionais:_
  - RF-010
  - RF-014

- _Não funcionais:_
  - RNF-012
  - RNF-013

**Protótipo da Interface:** [A inserir]

#### HU-009 - Gerenciamento de Frota (Ônibus)

**ID:** HU-009 &nbsp;·&nbsp; **Épico:** EP-002

**História de Usuário:** Como administrador, quero acessar um painel para cadastrar, visualizar, editar e inativar os ônibus, para gerenciar os veículos da frota disponíveis para o transporte universitário e suas respectivas capacidades.

**Critérios de Aceite:**

1. Administrador acessa o menu "Frota" ou "Ônibus" e visualiza a listagem dos veículos cadastrados com informações de placa e capacidade (ativos e inativos).
2. Administrador consegue criar um novo ônibus preenchendo placa e capacidade máxima de assentos no formulário; o sistema valida se a placa é única.
3. Placa de veículo já existente no sistema (ativa ou inativa) bloqueia o cadastro e exibe mensagem: 'Este veículo já está registrado
4. Administrador consegue editar dados de um ônibus existente (placa, capacidade, demais informações).
5. Administrador consegue inativar (soft delete) um ônibus, sem apagar o registro do banco de dados; operação é registrada no log de auditoria (usuário, ação, timestamp).
6. Tentativa de inativar um ônibus que está escalado para realizar rotas em dias futuros é bloqueada com mensagem: "Este veículo possui alocações pendentes e não pode ser inativado no momento."
7. Inativação bem-sucedida exibe mensagem de confirmação ("Operação realizada com sucesso") e atualiza a listagem.
8. Campos obrigatórios (placa e capacidade máxima) são destacados se vazios; sistema bloqueia salvamento até preenchimento.
9. Administrador consegue visualizar ônibus inativos na listagem quando necessário.

**Fluxo Principal:**

1. O administrador acessa o menu de "Frota" ou "Ônibus".
2. O sistema exibe a listagem dos veículos cadastrados, detalhando informações como placa e capacidade (ativos e inativos).
3. O administrador seleciona a ação desejada: "Novo Cadastro", "Editar" ou "Inativar" em um registro existente.
4. O administrador preenche as informações do veículo (placa, capacidade máxima de assentos, etc.) ou confirma a inativação do registro.
5. O sistema valida os dados e aplica a operação no banco de dados (executando o soft delete em caso de inativação).
6. O sistema registra a operação no log de auditoria.
7. O sistema exibe uma mensagem de sucesso e atualiza a listagem na tela.

**Fluxos Alternativos:**

- **FA-001 - Inativação de ônibus alocado em rota futura.**
  - O administrador tenta inativar um veículo que já está escalado para realizar uma rota em um dia futuro.
  - O sistema bloqueia a inativação e exibe um alerta informando que o veículo possui alocações pendentes.
- **FA-002 - Placa de veículo duplicada.**
  - O administrador tenta cadastrar ou editar um ônibus inserindo uma placa que já existe e está ativa no sistema.
  - O sistema bloqueia o cadastro e informa que o veículo já está registrado.
- **FA-003 - Campos obrigatórios ausentes.**
  - O administrador tenta salvar o formulário sem preencher a capacidade máxima ou a placa do ônibus.
  - O sistema sinaliza os campos vazios e impede o salvamento.

**Regras de Negócio Relacionadas:**

- RN-004
- RN-006

**Requisitos Relacionados:**

- _Funcionais:_
  - RF-008
  - RF-014

- _Não funcionais:_
  - RNF-012
  - RNF-013

**Protótipo da Interface:** [A inserir]

#### HU-010 - Gerenciamento de Motoristas

**ID:** HU-010 &nbsp;·&nbsp; **Épico:** EP-002

**História de Usuário:** Como administrador, quero acessar um painel para cadastrar, visualizar, editar e inativar motoristas, para gerenciar a equipe de profissionais responsáveis por conduzir os veículos nas rotas do transporte universitário.

**Critérios de Aceite:**

1. Administrador acessa o menu "Motoristas" e visualiza a listagem dos motoristas cadastrados (ativos e inativos).
2. Administrador consegue criar um novo motorista preenchendo nome, telefone e CNH no formulário; o sistema valida se o documento (CNH ou CPF) é único.
3. Documento (CNH ou CPF) já existente no sistema (ativo ou inativo) bloqueia o cadastro e exibe mensagem: 'Este profissional já está registrado."
4. Administrador consegue editar dados de um motorista existente (nome, telefone, CNH e demais informações).
5. Administrador consegue inativar (soft delete) um motorista, sem apagar o registro do banco de dados; operação é registrada no log de auditoria (usuário, ação, timestamp).
6. Tentativa de inativar um motorista que está escalado para realizar rotas em dias futuros é bloqueada com mensagem: "Este profissional possui alocações pendentes e não pode ser inativado no momento."
7. Inativação bem-sucedida exibe mensagem de confirmação ("Operação realizada com sucesso") e atualiza a listagem.
8. Campos obrigatórios (nome, telefone, CNH) são destacados se vazios; sistema bloqueia salvamento até preenchimento.
9. Administrador consegue visualizar motoristas inativos na listagem quando necessário.

**Fluxo Principal:**

1. O administrador acessa o menu de "Motoristas".
2. O sistema exibe a listagem dos motoristas cadastrados (ativos e inativos).
3. O administrador seleciona a ação desejada: "Novo Cadastro", "Editar" ou "Inativar" em um registro existente.
4. O administrador preenche as informações do motorista (nome, telefone, CNH, etc.) ou confirma a inativação do registro.
5. O sistema valida os dados e aplica a operação no banco de dados (executando o soft delete em caso de inativação).
6. O sistema registra a operação no log de auditoria.
7. O sistema exibe uma mensagem de sucesso e atualiza a listagem na tela.

**Fluxos Alternativos:**

- **FA-001 - Inativação de motorista com alocação futura.**
  - O administrador tenta inativar um motorista que já está escalado para realizar rotas em dias futuros.
  - O sistema bloqueia a inativação e exibe um alerta informando que o profissional possui alocações pendentes.
- **FA-002 - Cadastro duplicado.**
  - O administrador tenta cadastrar um motorista inserindo um documento (ex: CNH ou CPF) que já existe e está ativo no sistema.
  - O sistema bloqueia o cadastro e informa que o profissional já está registrado.
- **FA-003 - Campos obrigatórios ausentes.**
  - O administrador tenta salvar o formulário sem preencher os dados principais do motorista.
  - O sistema sinaliza os campos vazios e impede o salvamento.

**Regras de Negócio Relacionadas:**

- RN-004
- RN-006

**Requisitos Relacionados:**

- _Funcionais:_
  - RF-009
  - RF-014

- _Não funcionais:_
  - RNF-012
  - RNF-013

**Protótipo da Interface:** [A inserir]

### EP-003 - Gestão de Rotas e Horários

Este épico reúne todas as funcionalidades relacionadas à estruturação logística dos trajetos oferecidos pelo sistema. Ele permite que a administração crie rotas principais e complementares, associando os bairros e pontos de parada às faculdades de destino, além de definir os respectivos horários de saída e retorno, preparando o sistema para receber os agendamentos dos alunos.

#### HU-011 - Gerenciamento de Rotas Principais e Horários

**ID:** HU-011 &nbsp;·&nbsp; **Épico:** EP-003

**História de Usuário:** Como administrador, quero acessar um painel para cadastrar, visualizar, editar e inativar rotas principais e seus respectivos horários, vinculando os bairros de origem às faculdades de destino, para estruturar os trajetos e horários oficiais disponibilizados para o agendamento dos estudantes.

**Critérios de Aceite:**

1. administrador acessa o menu "Rotas" e visualiza a listagem das rotas cadastradas com seus horários de saída e retorno (ativas e inativas).
2. Administrador consegue criar uma nova rota preenchendo nome, faculdade de destino e horários de saída/retorno, e vinculando ao menos um bairro/ponto de parada já cadastrado.
3. Campos de seleção de bairro e faculdade exibem apenas registros ativos; bairros ou faculdades inativados não aparecem como opção, impedindo vínculo inválido.
4. Administrador consegue editar dados de uma rota existente (nome, horários, faculdade de destino, bairros vinculados).
5. Administrador consegue inativar (soft delete) uma rota, sem apagar o registro do banco de dados; operação é registrada no log de auditoria (usuário, ação, timestamp).
6. Tentativa de inativar uma rota que possui agendamentos futuros de alunos é bloqueada com mensagem informando que a rota possui agendamentos pendentes.
7. Inativação bem-sucedida exibe mensagem de confirmação ("Operação realizada com sucesso") e atualiza a listagem.
8. Campos obrigatórios (horários, faculdade de destino, ao menos um bairro vinculado) são destacados se vazios; sistema bloqueia salvamento até preenchimento.
9. Administrador consegue visualizar rotas inativas na listagem quando necessário.

**Fluxo Principal:**

1. O administrador acessa o menu de "Rotas".
2. O sistema exibe a listagem das rotas cadastradas com seus horários de saída e retorno (ativas e inativas).
3. O administrador seleciona a ação desejada: "Nova Rota", "Editar" ou "Inativar" em um registro existente.
4. O administrador preenche as informações da rota (nome, faculdade de destino, horários de saída e retorno) e vincula os bairros/pontos de parada previamente cadastrados.
5. O sistema valida os dados e aplica a operação no banco de dados (executando o soft delete em caso de inativação).
6. O sistema registra a operação no log de auditoria.
7. O sistema exibe uma mensagem de sucesso e atualiza a listagem na tela.

**Fluxos Alternativos:**

- **FA-001 - Inativação de rota com agendamentos futuros.**
  - O administrador tenta inativar uma rota que já possui alunos agendados para viagens em datas futuras.
  - O sistema bloqueia a inativação temporariamente e exibe um alerta informando que a rota possui agendamentos pendentes.
- **FA-002 - Entidade de base inativa ou inexistente.**
  - O administrador tenta criar ou editar uma rota vinculando um bairro ou faculdade que foi inativado.
  - O sistema não exibe as opções inativas nos campos de seleção, impedindo o vínculo inválido.
- **FA-003 - Campos obrigatórios ausentes.**
  - O administrador tenta salvar o formulário sem definir os horários, a faculdade de destino ou sem vincular ao menos um bairro.
  - O sistema sinaliza os campos vazios e impede o salvamento.

**Regras de Negócio Relacionadas:**

- RN-004
- RN-006

**Requisitos Relacionados:**

- _Funcionais:_
  - RF-012
  - RF-013
  - RF-014

- _Não funcionais:_
  - RNF-012
  - RNF-013

**Protótipo da Interface:** [A inserir]

#### HU-012 - Gerenciamento de Rotas Complementares

**ID:** HU-012 &nbsp;·&nbsp; **Épico:** EP-003

**História de Usuário:** Como administrador, quero acessar um painel para cadastrar, visualizar, editar e inativar rotas complementares, definindo seus horários e pontos de conexão com as rotas principais, para garantir que alunos de áreas não cobertas pelo trajeto principal consigam utilizar o transporte.

**Critérios de Aceite:**

1. Administrador acessa o menu "Rotas Complementares" e visualiza a listagem das rotas complementares cadastradas (ativas e inativas).
2. Administrador consegue criar uma nova rota complementar preenchendo nome, horários e ponto de conexão, vinculando-a a uma rota principal já existente.
3. Campo de seleção de rota principal exibe apenas rotas ativas; rota principal inativada não aparece como opção, impedindo vínculo inválido.
4. Administrador consegue editar dados de uma rota complementar existente (nome, horários, ponto de conexão, rota principal vinculada).
5. Administrador consegue inativar (soft delete) uma rota complementar, sem apagar o registro do banco de dados; operação é registrada no log de auditoria (usuário, ação, timestamp).
6. Tentativa de inativar uma rota complementar que possui agendamentos futuros de alunos é bloqueada com mensagem informando que a rota possui agendamentos pendentes.
7. Inativação bem-sucedida exibe mensagem de confirmação ("Operação realizada com sucesso") e atualiza a listagem.
8. Campos obrigatórios (horários, ponto de conexão, rota principal vinculada) são destacados se vazios; sistema bloqueia salvamento até preenchimento.
9. Administrador consegue visualizar rotas complementares inativas na listagem quando necessário.

**Fluxo Principal:**

1. O administrador acessa o menu de "Rotas Complementares".
2. O sistema exibe a listagem das rotas complementares cadastradas (ativas e inativas).
3. O administrador seleciona a ação desejada: "Nova Rota", "Editar" ou "Inativar" em um registro existente.
4. O administrador preenche as informações da rota (nome, horários, pontos de conexão) e a vincula a uma rota principal já existente.
5. O sistema valida os dados e aplica a operação no banco de dados (executando o soft delete em caso de inativação).
6. O sistema registra a operação no log de auditoria.
7. O sistema exibe uma mensagem de sucesso e atualiza a listagem na tela.

**Fluxos Alternativos:**

- **FA-001 - Inativação de rota complementar com agendamentos futuros.**
  - O administrador tenta inativar uma rota complementar que já possui alunos agendados para viagens em datas futuras.
  - O sistema bloqueia a inativação temporariamente e exibe um alerta informando que a rota possui agendamentos pendentes.
- **FA-002 - Rota principal inválida ou inativa.**
  - O administrador tenta vincular a rota complementar a uma rota principal que foi inativada.
  - O sistema não exibe rotas principais inativas no campo de seleção, impedindo um vínculo que impossibilitaria a transferência do aluno.
- **FA-003 - Campos obrigatórios ausentes.**
  - O administrador tenta salvar o formulário sem definir os horários, o ponto de conexão ou sem vincular a rota principal.
  - O sistema sinaliza os campos vazios e impede o salvamento.

**Regras de Negócio Relacionadas:**

- RN-004
- RN-006
- RN-010

**Requisitos Relacionados:**

- _Funcionais:_
  - RF-028
  - RF-014

- _Não funcionais:_
  - RNF-012
  - RNF-013

**Protótipo da Interface:** [A inserir]

### EP-004 - Agendamento de Transporte (Aluno)

Este épico reúne todas as funcionalidades voltadas para a experiência diária do estudante ao solicitar o uso do transporte universitário. Ele centraliza o processo de reserva de vagas, permitindo que o aluno realize seus agendamentos, informando os dias, rotas, horários e pontos de embarque, efetue cancelamentos quando necessário e consulte as diretrizes de utilização de rotas complementares. É o módulo central de interação do usuário final (aluno) com o aplicativo, substituindo o antigo processo manual de preenchimento de formulários e garantindo previsibilidade para a logística.

#### HU-013 - Agendamento de Transporte

**ID:** HU-013 &nbsp;·&nbsp; **Épico:** EP-004

_Link do formulário legado: https://docs.google.com/forms/d/e/1FAIpQLSfONfUZbgCZ4WRnP_77biJ1ES7p9mSsiu8-vOvEnUhw__

**História de Usuário:** Como aluno, quero acessar um formulário inteligente no aplicativo para agendar meus dias de utilização do transporte, informando a faculdade de destino, horários de ida e volta, e o ponto de embarque através de opções padronizadas, para garantir minha vaga de forma rápida e sem erros de digitação.

**Critérios de Aceite:**

1. Aluno acessa "Agendamento de Transporte" e visualiza os dias disponíveis para reserva.
2. Ao selecionar uma data, o sistema pergunta se o aluno utilizará o ônibus na ida (Sim/Não).
3. "Se 'Sim' para ida, o sistema exibe os campos (em lista suspensa, puxando apenas dados ativos cadastrados pelo admin): horário de ida, ponto de embarque, faculdade (IES) de destino e rota complementar de ida (se aplicável)
4. Se "Não" para ida, o sistema não exige preenchimento dos campos de ida.
5. Independente da resposta sobre a ida, o sistema pergunta se o aluno utilizará o ônibus na volta (Sim/Não).
6. Se "Sim" para volta, o sistema exibe os campos: faculdade de origem, horário de volta e rota complementar de volta (se aplicável).
7. Aluno consegue confirmar um agendamento com qualquer combinação válida: apenas ida, apenas volta, ou ida e volta.
8. Se o aluno responder "Não" tanto para ida quanto para volta, o sistema não cria agendamento para aquele dia e informa isso de forma clara (sem erro).
9. Tentativa de agendar um dia que já possui uma solicitação ativa é bloqueada, com mensagem orientando o aluno a editar ou cancelar o agendamento existente (FA-001).
10. Selecionar uma faculdade/ponto de embarque sem rotas ativas cadastradas para aquele horário bloqueia a seleção ou exibe mensagem de indisponibilidade (FA-002).
11. Responder "Sim" para ida ou volta e tentar salvar sem preencher a IES ou o ponto de embarque correspondente bloqueia o salvamento e destaca os campos pendentes (FA-003).
12. Confirmação bem-sucedida exibe mensagem de sucesso ("Agendamento realizado com sucesso") e atualiza visualmente o status do dia selecionado na tela.
13. Tempo de resposta do agendamento deve ser de até 3 segundos em condições normais de conexão (RNF-001)
14. Se o aluno editar um agendamento existente e alterar as respostas de ida e volta para 'Não' em ambas, o sistema deve tratar essa ação como um cancelamento (equivalente à HU-014), exibindo o mesmo alerta de confirmação antes de remover a alocação vinculada.

**Fluxo Principal:**

1. O aluno acessa o menu de "Agendamento de Transporte" no aplicativo.
2. O sistema exibe os dias disponíveis para reserva.
3. O aluno seleciona a data desejada.
4. O sistema questiona se o aluno utilizará o ônibus na ida. Se "Sim", o sistema exibe os seguintes campos (todos em formato de lista suspensa/seleção, puxando dados cadastrados pelo admin): ○ - Horário de ida. ○ - Ponto de embarque. ○ - Faculdade (IES) de destino. ○ - Rota complementar de ida (se aplicável).
5. O sistema questiona se o aluno utilizará o ônibus na volta. Se "Sim", exibe os campos correspondentes para o retorno (Faculdade de origem, horário, rota complementar).
6. O aluno aciona o botão para confirmar o agendamento.
7. O sistema valida os dados e vincula o agendamento ao perfil logado do aluno.
8. O sistema exibe uma mensagem de sucesso ("Agendamento realizado com sucesso") e atualiza o status do dia selecionado.

**Fluxos Alternativos:**

- **FA-001 - Sobreposição de agendamento.**
  - O aluno tenta registrar um agendamento para um dia onde já possui uma solicitação ativa.
  - O sistema bloqueia a ação e exibe um alerta informando que já existe um agendamento para este período, orientando-o a editar ou cancelar o existente.
- **FA-002 - Opções não disponíveis para o dia/horário.**
  - O aluno seleciona uma faculdade ou bairro que não possui rotas ativas cadastradas para aquele horário.
  - O sistema bloqueia a seleção ou exibe uma mensagem informando que não há rotas disponíveis para o trajeto selecionado.
- **FA-003 - Campos condicionais obrigatórios ausentes.**
  - O aluno marca "Sim" para ida ou volta, mas tenta salvar sem preencher a IES ou o ponto de embarque correspondente.
  - O sistema destaca os campos pendentes e bloqueia o salvamento.

**Regras de Negócio Relacionadas:**

- RN-010

**Requisitos Relacionados:**

- _Funcionais:_
  - RF-015

- _Não funcionais:_
  - RNF-001
  - RNF-012

**Protótipo da Interface:** [A inserir]

#### HU-014 - Cancelamento de Agendamento

**ID:** HU-014 &nbsp;·&nbsp; **Épico:** EP-004

**História de Usuário:** Como aluno, quero poder cancelar um agendamento de transporte previamente realizado, para avisar a coordenação de que não utilizarei a vaga em determinado dia e liberá-la para a logística.

**Critérios de Aceite:**

1. Aluno acessa "Meus Agendamentos" e visualiza a lista de dias com viagens agendadas e ativas.
2. Aluno consegue acionar o botão "Cancelar" em um agendamento futuro específico.
3. Ao acionar "Cancelar", o sistema exibe alerta de confirmação ("Tem certeza que deseja cancelar o transporte para este dia?") antes de efetivar a ação.
4. Cancelamento pode ser feito sem exigência de horário limite (não há prazo mínimo de antecedência, conforme RN-005).
5. Confirmação do cancelamento remove a alocação do aluno para aquele veículo/dia no banco de dados.
6. Cancelamento bem-sucedido exibe mensagem de sucesso e a lista de agendamentos é recarregada, refletindo o status atualizado.
7. Botão de "Cancelar" não é exibido para agendamentos de datas já passadas, impedindo alteração do histórico de frequência.
8. Falha de comunicação com a API no momento da confirmação exibe mensagem de erro orientando verificar a conexão, e mantém o agendamento ativo (sem cancelamento parcial) até que a requisição seja concluída com sucesso.

**Fluxo Principal:**

1. O aluno acessa a área de "Meus Agendamentos" no aplicativo.
2. O sistema exibe a lista de dias em que o aluno possui viagens agendadas e ativas.
3. O aluno aciona o botão de "Cancelar" no agendamento desejado.
4. O sistema exibe um alerta de confirmação ("Tem certeza que deseja cancelar o transporte para este dia?").
5. O aluno confirma o cancelamento.
6. O sistema atualiza o status do agendamento no banco de dados (removendo a alocação do aluno para aquele veículo/dia).
7. O sistema exibe uma mensagem de sucesso e recarrega a lista de agendamentos atualizada.

**Fluxos Alternativos:**

- **FA-001 - Tentativa de cancelamento de viagem passada.**
  - O aluno tenta cancelar um agendamento de um dia que já passou.
  - O sistema não exibe o botão de cancelamento para datas no passado, impedindo alterações no histórico de frequência.
- **FA-002 - Falha na comunicação com a API.**
  - O aplicativo perde a conexão com a internet no momento da confirmação do cancelamento.
  - O sistema exibe uma mensagem de erro ("Não foi possível processar o cancelamento. Verifique sua conexão e tente novamente") e mantém o agendamento ativo até que a requisição seja concluída.

**Regras de Negócio Relacionadas:**

- RN-005

**Requisitos Relacionados:**

- _Funcionais:_
  - RF-016

- _Não funcionais:_
  - RNF-001
  - RNF-012

**Protótipo da Interface:** [A inserir]

#### HU-015 - Consulta de Rota Complementar e Transferência

**ID:** HU-015 &nbsp;·&nbsp; **Épico:** EP-004

**História de Usuário:** Como aluno com um agendamento ativo, quero consultar de forma rápida os detalhes da minha rota complementar, para saber exatamente o horário e o ponto de conexão necessários para realizar a transferência para o ônibus da rota principal.

**Critérios de Aceite:**

1. Aluno com agendamento ativo que inclui rota complementar visualiza, na área "Meus Agendamentos" ou na tela inicial, os dados destacados dessa rota: horário de saída da Van/Micro-ônibus, nome da linha e ponto exato de conexão.
2. Informações da rota complementar são claras o suficiente para o aluno realizar a transferência com segurança para o ônibus da rota principal.
3. Aluno cujo trajeto é direto (sem rota complementar) não visualiza nenhuma seção relacionada a rota complementar; a tela exibe apenas as informações do ônibus/motorista da rota principal.
4. Aluno consegue consultar as informações da rota complementar mesmo sem conexão com a internet, desde que os dados já tenham sido previamente sincronizados (exibidos a partir do cache local do dispositivo).

**Fluxo Principal:**

1. O aluno acessa a área de "Meus Agendamentos" ou a tela inicial com o resumo da sua viagem do dia.
2. O sistema identifica que o trajeto agendado pelo aluno inclui a utilização de uma rota complementar.
3. O sistema exibe de forma destacada as informações específicas dessa rota (ex: horário de saída da Van/Micro-ônibus, nome da linha e o ponto exato de conexão).
4. O aluno visualiza as instruções e horários para realizar a transferência com segurança para a rota principal de destino.

**Fluxos Alternativos:**

- **FA-001 - Aluno sem rota complementar associada.**
  - O aluno acessa os dados da viagem, mas o seu trajeto é direto.
  - O sistema oculta qualquer seção relacionada a rotas complementares, exibindo apenas as informações diretas do ônibus e motorista da rota principal.
- **FA-002 - Consulta offline.**
  - O aluno abre o aplicativo para consultar o ponto de conexão no momento do embarque, mas está sem internet.
  - O sistema exibe as informações da rota complementar salvas no cache local do dispositivo, permitindo a visualização da alocação previamente sincronizada.

**Regras de Negócio Relacionadas:**

- RN-010

**Requisitos Relacionados:**

- _Funcionais:_
  - RF-029

- _Não funcionais:_
  - RNF-015

**Protótipo da Interface:** [A inserir]

### EP-005 - Alocação e Distribuição Logística

Este épico constitui o "motor" central do sistema, sendo responsável por cruzar a demanda gerada (agendamentos dos alunos) com a infraestrutura disponível (frota e equipe). Ele engloba a inteligência do aplicativo para distribuir os estudantes nos veículos adequados, respeitando rigorosamente os limites de capacidade, além de gerenciar a alocação diária dos motoristas às rotas, fornecer as listas de embarque para controle e aplicar o rodízio inteligente para equilibrar o uso da frota.

#### HU-016 - Distribuição de Alunos nos Ônibus (Atualizada)

**ID:** HU-016 &nbsp;·&nbsp; **Épico:** EP-005

**História de Usuário:** Como administrador, quero distribuir os alunos com agendamentos confirmados nos ônibus disponíveis, para organizar a logística diária e garantir que todos tenham assento, mesmo que seja necessário realocar alunos excedentes para ônibus de outras rotas.

**Critérios de Aceite:**

1. Administrador acessa a tela de "Alocação Diária"/"Distribuição Logística", seleciona um dia e visualiza a demanda total de alunos agendados por rota.
2. Administrador consegue vincular os ônibus disponíveis às suas rotas originais para aquele dia.
3. Sistema distribui automaticamente os alunos confirmados nos veículos correspondentes, respeitando rigorosamente o limite de assentos cadastrado para cada ônibus (nunca ultrapassa a capacidade).
4. Se a demanda de uma rota ultrapassar a capacidade do ônibus designado, o sistema aloca os alunos até o limite exato de assentos e sinaliza os alunos excedentes.
5. Administrador consegue selecionar os alunos excedentes e realocá-los manualmente para outro ônibus (de rota diferente) que ainda possua vagas disponíveis.
6. Após realocação, o status do aluno é atualizado informando em qual ônibus alternativo ele deve embarcar.
7. Tentativa de alocar um ônibus que já atingiu sua capacidade máxima, ou escalá-lo em horário conflitante com outra rota, é bloqueada, o veículo não aparece disponível na seleção ou o sistema exibe alerta de indisponibilidade.
8. Administrador consegue revisar uma prévia da distribuição antes de confirmar (sem persistir no banco ainda).
9. Ao confirmar a distribuição, o sistema salva a alocação de todos os alunos aos veículos e exibe mensagem de sucesso ("Distribuição realizada com sucesso"), atualizando o status logístico do dia.
10. Um mesmo ônibus não pode ser alocado para mais de uma rota no mesmo dia/horário (RN-003).

**Fluxo Principal:**

1. O administrador acessa a tela de "Alocação Diária" ou "Distribuição Logística" no painel.
2. O administrador seleciona o dia e visualiza a demanda total de alunos agendados por rota.
3. O administrador vincula os ônibus às suas rotas originais.
4. O sistema distribui os alunos nos veículos correspondentes de forma automática, respeitando rigorosamente o limite de assentos cadastrado para cada ônibus.
5. O administrador revisa a prévia da alocação e clica em "Confirmar Distribuição".
6. O sistema salva as informações no banco de dados, vinculando os alunos aos veículos.
7. O sistema exibe uma mensagem de sucesso ("Distribuição realizada com sucesso") e atualiza o status logístico do dia.

**Fluxos Alternativos:**

- **FA-001 - Capacidade do ônibus excedida e realocação.**
  - O sistema identifica que a demanda de uma rota ultrapassou a capacidade do ônibus designado para ela.
  - O sistema realiza a alocação daquela rota até o limite exato de assentos do veículo.
  - O sistema sinaliza os alunos excedentes e permite ao administrador selecioná-los para realocação em outro ônibus (de uma rota diferente) que ainda possua vagas disponíveis.
  - O sistema atualiza o status do aluno informando em qual ônibus alternativo ele deverá embarcar.
- **FA-002 - Conflito de alocação do veículo.**
  - O administrador tenta alocar um ônibus que já atingiu sua capacidade máxima ou tentar escalá-lo em horários conflitantes.
  - O sistema bloqueia a seleção, ocultando o veículo da lista ou exibindo um alerta de indisponibilidade.

**Regras de Negócio Relacionadas:**

- RN-001
- RN-003
- RN-007

**Requisitos Relacionados:**

- _Funcionais:_
  - RF-017

- _Não funcionais:_
  - RNF-012

**Protótipo da Interface:** [A inserir]

#### HU-017 - Alocação de Motoristas às Rotas

**ID:** HU-017 &nbsp;·&nbsp; **Épico:** EP-005

**História de Usuário:** Como administrador, quero alocar os motoristas aos ônibus que farão as rotas do dia, para definir a escala de trabalho da equipe e garantir que todas as viagens programadas tenham um condutor responsável.

**Critérios de Aceite:**

1. Administrador acessa a tela de "Alocação Diária" (etapa de escala de condutores) e visualiza as rotas ativas do dia com os respectivos ônibus já alocados.
2. Ao selecionar um ônibus, o sistema exibe a lista de motoristas disponíveis para aquele horário.
3. Lista de motoristas disponíveis exibe apenas motoristas ativos; motoristas inativados (soft delete) não aparecem como opção.
4. Administrador consegue selecionar um motorista e confirmar a escala, vinculando-o àquele ônibus e rota para a data específica.
5. Tentativa de alocar um motorista que já está escalado para outra rota no mesmo dia, cujos horários de saída e retorno se sobreponham (conforme RN-002), é bloqueada: o motorista não aparece disponível na lista, ou o sistema exibe alerta ('Este motorista possui alocação com horário conflitante').
6. Sistema valida a disponibilidade do motorista antes de salvar a escala (não confia apenas na exibição prévia da lista, revalida no momento da confirmação).
7. Confirmação bem-sucedida exibe mensagem de sucesso ("Escala de motoristas confirmada com sucesso") e persiste o vínculo motorista-ônibus-rota-data no banco.
8. Um mesmo motorista não pode ser alocado para mais de uma rota ou veículo no mesmo dia e horário (RN-002).

**Fluxo Principal:**

1. O administrador acessa a tela de "Alocação Diária", na etapa de definição de escala de condutores.
2. O sistema exibe as rotas ativas do dia e os respectivos ônibus que já foram alocados para a viagem.
3. O administrador seleciona um ônibus e o sistema exibe a lista de motoristas disponíveis.
4. O administrador seleciona o motorista responsável pela condução daquele veículo.
5. O administrador aciona o botão para confirmar a escala.
6. O sistema valida a disponibilidade do motorista para o horário selecionado.
7. O sistema salva a informação no banco de dados, vinculando o motorista àquele ônibus e rota específicos para a data.
8. O sistema exibe uma mensagem de sucesso ("Escala de motoristas confirmada com sucesso").

**Fluxos Alternativos:**

- **FA-001 - Conflito de escala do motorista.**
  - O administrador tenta alocar um motorista que já foi designado para outra rota no mesmo dia e no mesmo turno de horário.
  - O sistema bloqueia a seleção, ocultando o motorista da lista de disponíveis para aquele horário ou exibindo um alerta ("Este motorista já está escalado para outra rota neste horário").
- **FA-002 - Motorista indisponível/inativo.**
  - O administrador tenta buscar um motorista que foi inativado no cadastro base.
  - O sistema não exibe motoristas inativos na lista de seleção, impedindo alocações inválidas.

**Regras de Negócio Relacionadas:**

- RN-006

**Requisitos Relacionados:**

- _Funcionais:_
  - RF-018

- _Não funcionais:_
  - RNF-012
  - RNF-013

**Protótipo da Interface:** [A inserir]

#### HU-018 - Visualização da Lista de Embarque

**ID:** HU-018 &nbsp;·&nbsp; **Épico:** EP-005

**História de Usuário:** Como administrador ou motorista, quero visualizar a lista de embarque consolidada para os ônibus do dia, contendo a relação de alunos alocados, para conferir a distribuição logística e realizar a conferência no momento da viagem.

**Critérios de Aceite:**

1. administrador acessa "Listas de Embarque" e visualiza todas as rotas do dia. Usuário com perfil 'Motorista' visualiza apenas o botão para acessar a lista do ônibus que lhe foi designado para a data atual.
2. Ao selecionar um ônibus/rota específico, o sistema exibe a lista completa de alunos alocados, ordenada e detalhando nome, destino (IES) e ponto de embarque.
3. Rota/ônibus sem alunos alocados exibe mensagem "Não há alunos alocados para este veículo nesta data" e desabilita as opções de exportação/impressão.
4. Administrador consegue exportar/imprimir a lista de embarque para uso físico (prancheta do motorista/monitor).
5. Se um aluno cancelar o agendamento (HU-014) ou for realocado manualmente enquanto a lista está sendo visualizada, o sistema atualiza a lista automaticamente (adicionando/removendo o aluno) e recalcula o total de assentos ocupados.
6. Atualização em tempo real da lista exibe um indicativo visual sinalizando que a lista mudou desde a última visualização.
7. Acesso aos dados pessoais dos alunos na lista de embarque é restrito a usuários com perfil de Administrador e ao Motorista daquela rota específica (RNF-010). .

**Fluxo Principal:**

1. O administrador acessa o menu de "Listas de Embarque" ou seleciona uma rota já alocada no painel logístico.
2. O sistema exibe as rotas do dia e os respectivos ônibus designados.
3. O administrador seleciona um ônibus/rota específico.
4. O sistema apresenta a lista completa de alunos alocados para aquele veículo, ordenada e detalhando informações como nome, destino (IES) e ponto de embarque.
5. O administrador realiza a conferência dos dados.
6. Opcionalmente, o administrador aciona a funcionalidade de exportação/impressão para gerar um documento físico (caso o motorista ou monitor necessite da prancheta manual).

**Fluxos Alternativos:**

- **FA-001 - Rota sem alunos alocados.**
  - O administrador acessa a lista de embarque de uma rota ou ônibus que, por algum motivo, não teve alunos distribuídos.
  - O sistema exibe a mensagem "Não há alunos alocados para este veículo nesta data" e desabilita as opções de exportação/impressão.
- **FA-002 - Alteração de última hora (Atualização em tempo real).**
  - O administrador visualiza a lista de embarque, mas um aluno cancela o agendamento (HU-014) ou há uma realocação manual no sistema.
  - O sistema atualiza a lista automaticamente, removendo/adicionando o aluno e recalculando o total de assentos ocupados, exibindo um indicativo visual de que a lista foi atualizada.

**Regras de Negócio Relacionadas:**

- RN-001
- RN-007

**Requisitos Relacionados:**

- _Funcionais:_
  - RF-019
  - RF-020

- _Não funcionais:_
  - RNF-010
  - RNF-012

**Protótipo da Interface:** [A inserir]

#### HU-019 - Consulta de Alocação Diária

**ID:** HU-019 &nbsp;·&nbsp; **Épico:** EP-005

**História de Usuário:** Como aluno com agendamento confirmado, quero consultar em qual ônibus fui alocado para a minha viagem do dia, para saber exatamente qual veículo devo embarcar e garantir que estou na rota correta.

**Critérios de Aceite:**

1. Aluno com agendamento confirmado acessa a tela inicial ou "Meus Agendamentos" e visualiza os dados da alocação: identificação do ônibus (número, placa ou apelido) e nome do motorista, quando disponível.
2. Se a distribuição logística do dia ainda não foi concluída pelo administrador, o sistema exibe o agendamento com status "Aguardando alocação do veículo" (ou similar), sem exibir dados de frota.
3. Se o aluno foi realocado para um ônibus diferente da sua rota original (por excedente de capacidade, HU-016), o sistema exibe aviso visual destacado ("Atenção: Você foi realocado. Seu ônibus para hoje é o veículo X").
4. Dados de alocação exibidos ao aluno são sempre os mais atuais no momento da consulta (refletindo qualquer realocação feita pelo administrador antes da visualização).
5. Tempo de resposta da consulta de alocação deve ser de até 3 segundos em condições normais de conexão (RNF-001).

**Fluxo Principal:**

1. O aluno acessa a tela inicial ou a área de "Meus Agendamentos" no aplicativo.
2. O sistema verifica se a alocação logística para aquele dia já foi processada e confirmada pelo administrador.
3. O sistema exibe de forma destacada os dados da alocação para a viagem do aluno, informando a identificação do ônibus ( número, placa ou apelido do veículo) e, se aplicável, o nome do motorista.
4. O aluno visualiza as informações definitivas de embarque e utiliza os dados para se direcionar ao veículo correto.

**Fluxos Alternativos:**

- **FA-001 - Alocação ainda não finalizada.**
  - O aluno acessa a tela para consultar o ônibus, mas o administrador ainda não concluiu a distribuição logística do dia.
  - O sistema exibe o agendamento com o status "Aguardando alocação do veículo" ou "Em processamento logístico", sem exibir dados de frota.
- **FA-002 - Aluno realocado para outro ônibus.**
  - O aluno acessa a alocação e o sistema identifica que ele foi realocado para um ônibus diferente de sua rota original (devido ao excedente de capacidade tratado na HU-016).
  - O sistema exibe um aviso visual destacado alertando sobre a mudança ("Atenção: Você foi realocado. Seu ônibus para hoje é o veículo X"), garantindo que o aluno não tente embarcar no veículo lotado.

**Regras de Negócio Relacionadas:**

- RN-001
- RN-003
- RN-007

**Requisitos Relacionados:**

- _Funcionais:_
  - RF-019

- _Não funcionais:_
  - RNF-001
  - RNF-012

**Protótipo da Interface:** [A inserir]

#### HU-020 - Rotatividade Inteligente / Rodízio Semanal

**ID:** HU-020 &nbsp;·&nbsp; **Épico:** EP-005

**História de Usuário:** Como administrador, quero configurar e aplicar um rodízio semanal dos ônibus entre as diferentes rotas cadastradas, para equilibrar a quilometragem percorrida e o desgaste mecânico da frota, garantindo uma vida útil mais homogênea para os veículos.

**Critérios de Aceite:**

1. Administrador acessa "Rodízio de Frota" e visualiza as rotas principais ativas com os ônibus atualmente vinculados a cada uma.
2. Administrador consegue configurar um padrão de alternância entre ônibus e rotas (ex: Ônibus A assume Rota 2 na próxima semana).
3. Ao definir a regra, o sistema gera uma prévia da escala das próximas semanas antes de qualquer confirmação.
4. Se a prévia identificar um ônibus com capacidade menor sendo alocado em rota com demanda histórica superior ao seu limite, o sistema exibe alerta visual, mas permite ao administrador prosseguir mesmo assim, ciente de que os alunos excedentes exigirão realocação manual no momento da Distribuição Diária (HU-016), ou ajustar a configuração.
5. Ônibus recém-inativado (soft delete) não pode ser incluído no rodízio; sistema bloqueia sua seleção e exige um veículo ativo.
6. Ao confirmar o rodízio, o sistema salva a configuração no banco de dados e exibe mensagem de sucesso ("Rodízio configurado e aplicado com sucesso").
7. Após confirmado, o rodízio passa a influenciar as alocações diárias futuras (HU-016), sugerindo ou vinculando automaticamente os ônibus às rotas conforme a regra cadastrada.
8. Um mesmo ônibus não pode ser alocado a mais de uma rota no mesmo dia/horário, mesmo dentro da lógica de rodízio (RN-003).

**Fluxo Principal:**

1. O administrador acessa a tela de "Rodízio de Frota" dentro do painel logístico.
2. O sistema exibe as rotas principais ativas e os ônibus atualmente vinculados a elas.
3. O administrador aciona a opção de "Configurar Rodízio" e define o padrão de alternância (ex: Ônibus A assume a Rota 2 na próxima semana, Ônibus B assume a Rota 1, etc.).
4. O sistema processa a regra definida e gera uma prévia da escala das próximas semanas.
5. O administrador analisa a prévia e clica em "Confirmar Rodízio".
6. O sistema salva a configuração no banco de dados.
7. Nas próximas alocações diárias (HU-016), o sistema passa a sugerir ou vincular automaticamente os ônibus às rotas respeitando a regra do rodízio cadastrado.
8. O sistema exibe uma mensagem de sucesso ("Rodízio configurado e aplicado com sucesso").

**Fluxos Alternativos:**

- **FA-001 - Incompatibilidade de capacidade na rota.**
  - Durante a prévia do rodízio, o sistema identifica que um ônibus com menor capacidade será alocado em uma rota que historicamente possui uma demanda de alunos superior ao seu limite.
  - O sistema exibe um alerta visual ("Atenção: O veículo selecionado pode não atender à demanda prevista para esta rota") permitindo que o administrador ajuste a configuração ou mantenha ciente do risco de excedente.
- **FA-002 - Veículo inativo ou em manutenção.**
  - O administrador tenta incluir no rodízio um ônibus que foi recém inativado (soft delete).
  - O sistema bloqueia a seleção daquele veículo, exigindo que um ônibus ativo seja selecionado para fechar o ciclo do rodízio.

**Regras de Negócio Relacionadas:**

- RN-003
- RN-006

**Requisitos Relacionados:**

- _Funcionais:_
  - RF-023

- _Não funcionais:_
  - RNF-012

**Protótipo da Interface:** [A inserir]

### EP-006 - Frequência e Relatórios Gerenciais

Este épico reúne todas as funcionalidades focadas no acompanhamento da execução das viagens e na análise de dados operacionais. Ele abrange o processo prático de controle de presença realizado no momento do embarque, a aplicação de regras de assiduidade (penalidades por faltas não justificadas) e a consolidação dessas informações em relatórios gerenciais e painéis estatísticos (dashboards). É o módulo responsável por garantir a transparência da operação, reduzir o desperdício de vagas e fornecer à gestão as métricas definitivas para a tomada de decisão e prestação de contas.

#### HU-021 - Registro de Embarque e Frequência

**ID:** HU-021 &nbsp;·&nbsp; **Épico:** EP-006

**História de Usuário:** Como motorista logado no aplicativo, quero utilizar a lista de embarque do meu ônibus para dar o check-in (Presente ou Falta) em cada aluno no momento da entrada, para que o administrador acompanhe a assiduidade em tempo real.

**Critérios de Aceite:**

1. Motorista acessa a sua rota do dia e visualiza a lista de alunos com botões interativos (ex: toggle ou swipe) para marcar "Presente" ou "Falta".
2. Sistema exibe a lista de alunos agendados para aquela viagem, cada um com status de comparecimento restrito a duas opções: Presente ou Falta/Ausente.
3. Sistema exibe os totais consolidados do dia (quantidade de presentes e quantidade de faltas) para a rota/ônibus selecionado.
4. Consulta de data sem viagens registradas (fim de semana, feriado, ou dia sem operação) exibe mensagem: "Não há registros de viagens ou agendamentos para a data selecionada."
5. Status de presença é atualizado dinamicamente enquanto o check-in dos alunos está sendo realizado pela equipe operacional (monitor/motorista) no momento do embarque, refletindo em tempo real na tela do administrador.
6. Apenas o motorista designado para a rota no dia atual, ou o Administrador geral, podem alterar o status de presença de um aluno.
7. Ao abrir a lista de presença de uma viagem ainda não iniciada, todos os alunos aparecem com status inicial neutro (ex: 'Pendente' ou 'Não verificado'), nunca como 'Falta' por padrão. O status só se torna 'Presente' ou 'Falta' após o registro explícito do check-in
8. O sistema bloqueia alterações no status de presença para datas passadas ou futuras, permitindo a edição apenas no dia corrente (RN-014).

**Fluxo Principal:**

1. O motorista (ou administrador) acessa a lista de embarque do ônibus no dia atual.
2. Conforme os alunos entram no veículo, o motorista localiza o nome (podendo usar uma barra de busca) e aciona a opção "Presente".
3. Alunos que não comparecem são marcados como "Falta" (ou ficam pendentes até o fim da viagem, quando o sistema assume a falta).
4. O sistema salva o status no banco de dados imediatamente a cada marcação.
5. O administrador consegue visualizar o painel gerencial refletindo esses números em tempo real.

**Fluxos Alternativos:**

- **FA-001 - Tentativa de check-in fora da data permitida (Motorista) 1.1.**
  - O motorista tenta acessar a lista de embarque de uma data passada ou futura para realizar ou alterar presenças. 1.2.
  - O sistema identifica a restrição de data (RN-014), exibe a lista em modo "somente leitura" e desabilita os botões de "Presente/Falta", exibindo um alerta de que a chamada só pode ser realizada no dia exato da viagem.
- **FA-002 - Aluno não listado tenta embarcar (Motorista)**
  - Um estudante tenta embarcar no veículo, mas o motorista procura e não encontra o nome dele na lista de embarque gerada para aquele dia.
  - . O sistema não exibe o aluno (pois ele não agendou, foi reprovado ou alocado em outro ônibus) e não permite a adição manual de passageiros na hora. O motorista barra o embarque com base na lista do sistema.
- **FA-003 - Perda de conexão durante o check-in (Motorista)**
  - O aplicativo do motorista perde o sinal de internet (área de sombra/zona rural) enquanto ele está registrando a entrada dos alunos.
  - O sistema não trava; ele armazena as marcações de "Presente/Falta" localmente no celular (cache) e exibe um ícone de "Sincronização Pendente".
  - Assim que a conexão for restabelecida, o aplicativo envia os dados automaticamente em segundo plano para o back-end, atualizando o painel do administrador.
- **FA-004 - Consulta de data sem viagens (Administrador)**
  - O administrador acessa o painel gerencial e seleciona um fim de semana ou feriado para visualizar as presenças.
  - O sistema exibe a mensagem "Não há registros de viagens ou agendamentos para a data selecionada."

**Regras de Negócio Relacionadas:**

- RN-005
- RN-006

**Requisitos Relacionados:**

- _Funcionais:_
  - RF-021

- _Não funcionais:_
  - RNF-012

**Protótipo da Interface:** [A inserir]

#### HU-022 - Geração de Relatórios Quantitativos

**ID:** HU-022 &nbsp;·&nbsp; **Épico:** EP-006

**História de Usuário:** Como administrador, quero gerar relatórios quantitativos filtrados por dia, faculdade e localidade, para cruzar os dados de agendamentos com as presenças reais e analisar a quantidade efetiva de alunos que utilizam o transporte.

**Critérios de Aceite:**

1. Administrador acessa o menu "Relatórios" e define parâmetros de filtro: período de datas, faculdade de destino e/ou bairro/localidade.
2. Ao gerar o relatório, o sistema cruza os dados de agendamentos com o controle de frequência (presenças validadas) e exibe totais numéricos consolidados (ex: quantidade de agendados vs. quantidade efetiva de embarques por dia/rota).
3. Administrador consegue exportar o relatório gerado em formato PDF ou planilha.
4. Filtro sem resultados (período/localidade sem operação ou demanda) exibe mensagem: "Nenhum dado encontrado para os filtros informados."
5. Inserir uma data final anterior à data inicial bloqueia o processamento da busca e sinaliza o erro nos campos de data.
6. Apenas usuários com perfil de Administrador têm acesso à geração de relatórios (RN-006).

**Fluxo Principal:**

1. O administrador acessa o menu de "Relatórios" no painel gerencial.
2. O administrador seleciona o tipo de relatório desejado e define os parâmetros de filtro (período de datas, faculdade de destino, bairro/localidade).
3. O administrador aciona o botão para gerar o documento.
4. O sistema processa o histórico de agendamentos e o controle de frequência (presenças validadas) correspondentes aos filtros aplicados.
5. O sistema exibe o relatório na tela, consolidando os totais numéricos (ex: quantidade de agendados vs. quantidade efetiva de embarques por dia/rota).
6. O administrador pode acionar a opção de exportar o relatório (ex: formato PDF ou planilha) para prestação de contas.

**Fluxos Alternativos:**

- **FA-001 - Filtro sem resultados.**
  - O administrador define parâmetros de busca para um período ou localidade que não teve operação ou demanda.
  - O sistema exibe a mensagem "Nenhum dado encontrado para os filtros informados."
- **FA-002 - Parâmetros de data inválidos.**
  - O administrador insere uma data final que antecede a data inicial da busca.
  - O sistema sinaliza o erro nos campos de data e bloqueia o processamento da busca até a correção.

**Regras de Negócio Relacionadas:**

- RN-004
- RN-006

**Requisitos Relacionados:**

- _Funcionais:_
  - RF-022

- _Não funcionais:_
  - RNF-012

**Protótipo da Interface:** [A inserir]

### EP-007 - Comunicação e Mural de Avisos

Este épico centraliza todas as funcionalidades destinadas à comunicação oficial entre a coordenação de transportes e os usuários do sistema, eliminando a dependência de aplicativos de mensagens de terceiros e evitando ruídos na transmissão de informações. Ele abrange a criação e gestão de um mural de avisos pelo administrador, a visualização desses comunicados por alunos e visitantes, e o envio de notificações móveis (push) para alertas urgentes ou alterações de rotas, garantindo que todos os envolvidos tenham acesso rápido e claro às atualizações da operação diária.

#### HU-023 - Publicação de Avisos

**ID:** HU-023 &nbsp;·&nbsp; **Épico:** EP-007

**História de Usuário:** Como administrador, quero criar, editar e inativar comunicados em um mural de avisos, para manter os alunos informados sobre alterações de rotas, manutenções, imprevistos logísticos e comunicados oficiais da coordenação.

**Critérios de Aceite:**

1. Administrador acessa "Mural de Avisos"/"Comunicados" e aciona "Novo Aviso", preenchendo título e conteúdo (texto) da mensagem.
2. Publicação sem preencher título ou conteúdo é bloqueada; sistema destaca os campos vazios e exige preenchimento.
3. Aviso publicado com sucesso é associado automaticamente ao administrador logado (autor) e passa a ser exibido no mural do aplicativo.
4. Administrador consegue editar um aviso já publicado; alteração é refletida imediatamente no mural do aplicativo.
5. Administrador consegue inativar (excluir/soft delete) um aviso publicado; remoção é refletida imediatamente no mural, evitando disseminação de informação desatualizada.
6. Apenas usuários com perfil de Administrador têm acesso à publicação, edição e inativação de avisos (RN-006).

**Fluxo Principal:**

1. O administrador acessa o menu "Mural de Avisos" ou "Comunicados" no painel gerencial.
2. O administrador seleciona a opção "Novo Aviso".
3. O sistema exibe um formulário solicitando o título e o conteúdo (texto) da mensagem.
4. O administrador preenche os dados.
5. O administrador aciona o botão "Publicar" (ou "Salvar").
6. O sistema valida os campos obrigatórios e salva o registro no banco de dados, associando-o ao administrador logado (autor).
7. O sistema exibe uma mensagem de sucesso ("Aviso publicado com sucesso") e o comunicado passa a ser exibido no mural público do aplicativo.

**Fluxos Alternativos:**

- **FA-001 - Campos obrigatórios ausentes.**
  - O administrador tenta publicar o aviso sem preencher o título ou o corpo da mensagem.
  - O sistema bloqueia a publicação, destacando os campos vazios e exigindo o preenchimento.
- **FA-002 - Edição ou inativação de aviso.**
  - O administrador acessa a lista de avisos já publicados e seleciona a opção de editar ou excluir (inativar) um comunicado.
  - O sistema processa a alteração ou remoção, refletindo a mudança imediatamente no mural do aplicativo para evitar a disseminação de informações desatualizadas.

**Regras de Negócio Relacionadas:**

- RN-006

**Requisitos Relacionados:**

- _Funcionais:_
  - RF-024

- _Não funcionais:_
  - RNF-012
  - RNF-013

**Protótipo da Interface:** [A inserir]

#### HU-024 - Recebimento de Notificações Push

**ID:** HU-024 &nbsp;·&nbsp; **Épico:** EP-007

**História de Usuário:** Como aluno, quero receber notificações (push) no meu smartphone sempre que houver um aviso urgente ou alteração na minha rota, para ser informado imediatamente sobre imprevistos sem precisar abrir o aplicativo constantemente.

**Critérios de Aceite:**

1. Publicação de um aviso urgente (HU-023) ou alteração de última hora na alocação do aluno (ônibus/rota) dispara automaticamente uma notificação push para o dispositivo do aluno afetado.
2. Notificação é exibida no smartphone do aluno mesmo com o aplicativo fechado ou em segundo plano.
3. Ao tocar na notificação, o aplicativo abre diretamente na tela correspondente ao evento (Mural de Avisos, para avisos; Consulta de Alocação, para mudanças de rota/ônibus).
4. Se o dispositivo do aluno estiver offline no momento do envio, a notificação é retida pelo serviço de mensageria (Firebase/APNS) e entregue assim que a conexão for restabelecida.
5. Se o aluno tiver desativado as permissões de notificação nas configurações do sistema operacional, a notificação não é exibida; o aluno só verá a atualização ao abrir o app manualmente e consultar o Mural de Avisos.
6. Dados apresentados ao aluno (ônibus, motorista, rota, placa) são sempre atualizados sempre que houver alteração em sua alocação, garantindo que a notificação não fique desatualizada (RN-009).

**Fluxo Principal:**

1. Um evento gatilho ocorre no sistema (ex: o administrador publica um aviso classificado como urgente na HU-023 ou há uma alteração de última hora no ônibus/alocação do aluno).
2. A API (back-end) processa o evento e monta o payload (mensagem) da notificação.
3. A API envia a requisição de disparo para o serviço de mensageria nativo configurado (ex: Firebase Cloud Messaging ou APNS).
4. O serviço de mensageria roteia e entrega a notificação ao dispositivo móvel do aluno.
5. O smartphone do aluno exibe o alerta na tela, mesmo com o aplicativo fechado ou em segundo plano.
6. O aluno toca na notificação e o aplicativo é aberto diretamente na tela correspondente (Mural de Avisos ou Consulta de Alocação).

**Fluxos Alternativos:**

- **FA-001 - Dispositivo offline.**
  - O sistema envia a notificação, mas o smartphone do aluno está sem conexão com a internet no momento.
  - O serviço provedor (Firebase/APNS) retém a mensagem e realiza a entrega assim que o dispositivo recuperar a conexão com a rede.
- **FA-002 - Permissões de notificação desativadas.**
  - O aluno desativou as permissões de notificação push para o aplicativo nas configurações do sistema operacional.
  - A notificação não é exibida na tela do celular. O aluno dependerá de abrir o aplicativo ativamente para ver as atualizações no Mural de Avisos, conforme estratégia de mitigação de risco definida.

**Regras de Negócio Relacionadas:**

- RN-009

**Requisitos Relacionados:**

- _Funcionais:_
  - RF-025

- _Não funcionais:_
  - RNF-014

**Protótipo da Interface:** [A inserir]---

## 8. Glossário

**Tabela 7 — Glossário**

| Sigla | Significado                       |
| ----- | --------------------------------- |
| RF    | Requisito Funcional               |
| RNF   | Requisito Não Funcional           |
| HU    | História de Usuário               |
| RN    | Regra de Negócios                 |
| API   | Application Programming Interface |
| CRUD  | Create, Read, Update e Delete     |

_Fonte: Elaborado pelo Clidenor (2026)._
