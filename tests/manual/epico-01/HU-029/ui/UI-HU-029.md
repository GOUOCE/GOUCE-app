# Testes manuais de UI — HU-029 — Carteirinha Digital do Aluno

## Identificação da suíte

| Campo           | Valor                                                                                   |
| --------------- | --------------------------------------------------------------------------------------- |
| Módulo          | Autenticação e Gestão de Conta                                                          |
| Funcionalidade  | HU-029 — Carteirinha Digital do Aluno                                                   |
| Camada          | UI                                                                                      |
| Tipo de teste   | Funcional manual — suíte essencial                                                      |
| Tela            | Início do aluno (atalho Carteirinha Digital), Meu Perfil → Ver carteirinha digital e Carteirinha Digital |
| Ambiente        | Desenvolvimento — app mobile no iPhone (Expo Go)                                        |
| Total de casos  | 7 |
| Última execução | 06/10/2026                                                                              |
| Testador        | Cauan Ricardo                                                                           |

## Resultado geral

| Situação        | Total | ✅ Passaram | ❌ Falharam | ⏳ Pendentes |
| --------------- | ----: | ----------: | ----------: | -----------: |
| ⏳ Em execução | 7 | 0 | 3 | 4 |

## Pré-condições

| ID    | Descrição |
| ----- | --------- |
| PC-01 | Aplicativo aberto no iPhone pelo **Expo Go**, com a API disponível e conexão ativa (exceto no CT-003). |
| PC-02 | **Aluno A** aprovado, com foto de perfil. Anotar nome completo, curso e instituição cadastrados. |
| PC-03 | **Aluno B** com status **em análise** (renovação) ou **pendente**, para o CT-002. Preparar pelo administrador ou pelo banco local e registrar a preparação. |
| PC-04 | Um segundo celular com câmera (ou app leitor de QR Code) para o CT-004. |
| PC-05 | O token de acesso dura 15 minutos e o app ainda não o renova (#123). Entrar de novo antes de cada caso. |

## Resumo da execução

Executar na ordem abaixo. São **7 casos essenciais**, em três seções. Os IDs completos usam o prefixo `CT-HU029-UI-`, numerados de 001 a 007.

### Seção A — Exibição da carteirinha

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU029-UI-001 | Abrir a carteirinha do aluno aprovado | Aluno A; Perfil e atalho do Início | Foto, nome, curso, instituição e QR Code; abre rápido | ❌ REPROVADO | Por Perfil → Ver carteirinha digital, abriu instantaneamente com a foto, nome, curso, instituição, e-mail, data de emissão, QR Code e logo da prefeitura; a seta voltou. Porém o atalho Carteirinha Digital do Início não abre nada, e textos longos (ex.: o curso) aparecem cortados com reticências. Ver [BUG-HU029-UI-001](issues/BUG-HU029-UI-001-atalho-do-inicio-sem-acao.md) e [BUG-HU029-UI-001-dados-cortados](issues/BUG-HU029-UI-001-dados-cortados-na-carteirinha.md). Executado pelo testador em 06/10/2026. |
| CT-HU029-UI-002 | Aluno sem status aprovado | Aluno B (em análise ou pendente) | Documento oculto e “Carteirinha indisponível…” | ❌ REPROVADO | O aluno B, em análise de renovação, conseguiu abrir a carteirinha. A API recusou (HTTP 403 no log do backend), mas o app ignorou a recusa e montou o documento com os dados da sessão, sem a mensagem de indisponibilidade. Ver [BUG-HU029-UI-002](issues/BUG-HU029-UI-002-app-exibe-carteirinha-recusada-pela-api.md). Executado pelo testador em 06/10/2026. |
| CT-HU029-UI-003 | Dados reais, sem valores de exemplo | Aluno A após editar o perfil | Só dados do aluno A, atualizados | ❌ REPROVADO | Nome, e-mail, instituição e curso eram do aluno A, mas a data de emissão “10/09/2026” é fixa no código. Com o curso alterado no cadastro, a carteirinha e o perfil só mostraram o curso novo depois de sair e entrar de novo; e o curso longo apareceu cortado (“Licenciatura em Ciências Bio…”). Ver [BUG-HU029-UI-003-emissao](issues/BUG-HU029-UI-003-data-de-emissao-e-valores-fixos.md) e [BUG-HU029-UI-003-atualizacao](issues/BUG-HU029-UI-003-carteirinha-nao-atualiza.md). Executado pelo testador em 06/10/2026. |

### Seção B — Uso no embarque

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU029-UI-004 | Carteirinha offline | Aluno A sem internet, após abrir online | Versão em cache, sem erro de conexão | ⏳ PENDENTE | Não executado. |
| CT-HU029-UI-005 | Leitura do QR Code | QR Code online e offline | Lido por outro celular, nas duas situações | ⏳ PENDENTE | Não executado. |

### Seção C — Privacidade e revogação

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU029-UI-006 | Carteirinha após sair da conta | Aluno A sai; app reaberto sem login | Nenhuma carteirinha acessível sem login | ⏳ PENDENTE | Não executado. |
| CT-HU029-UI-007 | Carteirinha após perder a aprovação | Aluno A aprovado vira “em análise” durante a sessão | Com internet, o documento é ocultado, mesmo havendo cache | ⏳ PENDENTE | Não executado. |

## Detalhamento dos casos

### Seção A — Exibição da carteirinha

#### CT-HU029-UI-001 — Abrir a carteirinha do aluno aprovado

**Dados de entrada:** Aluno A logado (PC-02).

**Passos**

1. Na tela **Início**, tocar no atalho **Carteirinha Digital**.
2. Abrir **Perfil → Ver carteirinha digital**, cronometrando do toque até a carteirinha aparecer completa.
3. Conferir os elementos e comparar com os dados da PC-02.
4. Tocar na seta de voltar.

**Resultado esperado**

- Os dois caminhos abrem a **Carteirinha Digital**.
- A carteirinha exibe a **foto de perfil**, o **nome completo**, o **curso** e a **instituição** do aluno A, e o **QR Code** (AC-01).
- Abre em até **2 segundos** com conexão normal, sem travar a navegação (AC-05). Registrar o tempo medido.
- A seta volta para a tela anterior.

**Resultado obtido**

- Atalho **Carteirinha Digital** na tela **Início**: aparece, mas não faz nada ao ser tocado (`QuickAction` sem `onPress` em `frontend/src/app/(aluno)/home.tsx:47`). ❌
- **Perfil → Ver carteirinha digital**: abriu instantaneamente (bem abaixo de 2 s), com a foto de perfil do aluno A, nome completo, curso, instituição, e-mail, data de emissão, QR Code e o logo da prefeitura. ✅
- A seta de voltar retornou à tela anterior. ✅
- Os textos ficam limitados a uma linha (`numberOfLines={1}` no nome, e-mail, instituição e curso): o curso “Engenharia de Software” já aparece cortado com reticências, e nomes ou cursos mais longos ficam incompletos num documento de identificação. ❌
- A data de emissão exibida (“10/09/2026”) é fixa no código; avaliada no CT-HU029-UI-003.
- Execução confirmada pelo testador em 06/10/2026.
- Status: ❌ Reprovado — [BUG-HU029-UI-001](issues/BUG-HU029-UI-001-atalho-do-inicio-sem-acao.md) e [BUG-HU029-UI-001-dados-cortados](issues/BUG-HU029-UI-001-dados-cortados-na-carteirinha.md).

---

#### CT-HU029-UI-002 — Aluno sem status aprovado

**Dados de entrada:** Aluno B com status em análise ou pendente (PC-03).

**Passos**

1. Entrar com o aluno B. Se o login for recusado (pendente), usar um aluno em análise de renovação.
2. Abrir **Perfil → Ver carteirinha digital** (e o atalho do **Início**).

**Resultado esperado**

- O documento fica **oculto**: sem foto, dados nem QR Code (AC-02).
- Exibe “Carteirinha indisponível. Seu cadastro está inativo ou em análise.”
- Se a carteirinha aparecer montada com os dados da sessão (mesmo que a API recuse), registrar como falha.

**Resultado obtido**

- Preparação: aluno B (`thebirl009@gmail.com`) colocado em `analise_renovacao` e com senha de teste definida no banco local; a API foi conferida antes (`GET /alunos/me/carteirinha` → 403).
- Com o aluno B logado, **Perfil → Ver carteirinha digital** abriu a carteirinha. ❌
- No log do backend, a chamada do app à carteirinha recebeu `403 Forbidden`: a API bloqueou corretamente (correção da #75), mas o app ignorou a recusa e exibiu o documento com os dados da sessão, sem a mensagem “Carteirinha indisponível. Seu cadastro está inativo ou em análise.” (AC-02).
- Causa aparente: `frontend/src/app/(aluno)/carteirinha-digital.tsx` trata qualquer erro de `getCarteirinha()` como “offline” (`console.warn('Carteirinha offline ou em carregamento, usando cache do usuário')`) e monta a carteirinha com os dados do usuário logado e valores padrão.
- Execução confirmada pelo testador em 06/10/2026.
- Status: ❌ Reprovado — [BUG-HU029-UI-002](issues/BUG-HU029-UI-002-app-exibe-carteirinha-recusada-pela-api.md).

---

#### CT-HU029-UI-003 — Dados reais, sem valores de exemplo

**Dados de entrada:** Aluno A; depois de alterar um dado do perfil (ex.: telefone ou bairro em **Editar perfil**).

**Passos**

1. Abrir a carteirinha e anotar todos os textos exibidos (nome, e-mail, instituição, campus, curso, período, data de emissão).
2. Alterar um dado em **Editar perfil**, voltar e abrir a carteirinha de novo.

**Resultado esperado**

- Todos os dados exibidos são do aluno A. Nenhum valor de exemplo no lugar dos reais (ex.: “João Neves”, “joao@email.com”, “Engenharia de Software”, “UFC - Campus Quixadá”, foto de banco de imagens) e nenhuma data de emissão fixa.
- A carteirinha reflete os dados atuais do cadastro.

**Resultado obtido**

- Nome, e-mail, instituição e curso exibidos eram os do aluno A. ✅
- A data de emissão exibida é “10/09/2026”, fixa no código (`const emissao = '10/09/2026'`); a conta foi criada em 04/10/2026. Todo aluno vê a mesma data. ❌
- A tela também tem valores padrão fixos para quando faltar dado: “João Neves”, “joao@email.com”, “UFC”, “Campus Quixadá”, “Engenharia de Software”, “2024.1” e uma foto de banco de imagens (`carteirinha-digital.tsx`, linhas 54 a 67). Para o aluno A eles não apareceram, porque a API devolveu os dados reais, mas são usados quando a API falha (ver CT-HU029-UI-002).
- Alteração de bairro em **Editar perfil**: a carteirinha continuou correta (o bairro não aparece na carteirinha). ✅
- Alteração do curso (preparação: curso do aluno A trocado no banco local para “Licenciatura em Ciências Biológicas”, já confirmado pela API): a carteirinha e o **Meu Perfil** continuaram mostrando o curso antigo até o aluno sair e entrar de novo. ❌
- Depois do novo login, o curso novo apareceu, mas cortado: “Licenciatura em Ciências Bio…” (registrado no [BUG-HU029-UI-001-dados-cortados](issues/BUG-HU029-UI-001-dados-cortados-na-carteirinha.md)).
- Ao final, o curso do aluno A voltou para “Engenharia de Software”.
- Execução confirmada pelo testador em 06/10/2026.
- Status: ❌ Reprovado — [BUG-HU029-UI-003-emissao](issues/BUG-HU029-UI-003-data-de-emissao-e-valores-fixos.md) e [BUG-HU029-UI-003-atualizacao](issues/BUG-HU029-UI-003-carteirinha-nao-atualiza.md).

### Seção B — Uso no embarque

#### CT-HU029-UI-004 — Carteirinha offline

**Dados de entrada:** Aluno A que já abriu a carteirinha com conexão (CT-001).

**Passos**

1. Com conexão, abrir a carteirinha uma vez e voltar.
2. Desligar Wi-Fi e dados móveis.
3. Abrir a carteirinha de novo, cronometrando.
4. Fechar e reabrir o app ainda sem conexão e abrir a carteirinha (se o app permitir entrar sem conexão).

**Resultado esperado**

- **Nenhuma** mensagem de erro de conexão (AC-03, FA-001).
- A versão em cache aparece imediatamente, com foto, dados e QR Code iguais aos da última conexão.
- Registrar o comportamento após reabrir o app sem conexão.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU029-UI-005 — Leitura do QR Code

**Dados de entrada:** Carteirinha do aluno A aberta, online e depois offline; segundo celular (PC-04).

**Passos**

1. Com a carteirinha aberta e conexão ativa, apontar a câmera do segundo celular para o QR Code, com o brilho do iPhone no normal.
2. Anotar se leu, em quanto tempo e o conteúdo lido (sem registrar tokens nas evidências).
3. Repetir com o iPhone offline (CT-004).

**Resultado esperado**

- O QR Code é lido em poucos segundos nas duas situações, com tamanho, nitidez e contraste adequados (AC-04).
- O conteúdo identifica o aluno A. Se o conteúdo lido incluir o token de sessão ou outro dado sensível, registrar como observação de segurança.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

### Seção C — Privacidade e revogação

#### CT-HU029-UI-006 — Carteirinha após sair da conta

**Dados de entrada:** Aluno A que já abriu a carteirinha.

**Passos**

1. Sair da conta (**Perfil → Sair → Sim, sair**).
2. Fechar e reabrir o app, com e sem conexão.
3. Tentar chegar à carteirinha sem fazer login (inclusive pelo link `exp://<IP>:8081/--/carteirinha-digital`).

**Resultado esperado**

- Sem login, a carteirinha não aparece de nenhuma forma: o app leva à tela de login.
- O cache da carteirinha não fica acessível para quem pegar o aparelho depois do Sair.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU029-UI-007 — Carteirinha após perder a aprovação

**Dados de entrada:** Aluno A aprovado e logado, que já abriu a carteirinha online. Durante a sessão, o administrador muda o status dele para em análise de renovação (pela API ou pelo banco local; registrar a preparação).

**Passos**

1. Com conexão, abrir a carteirinha e voltar.
2. Mudar o status do aluno A (preparação).
3. Ainda com conexão, abrir a carteirinha de novo.
4. Ao final, voltar o aluno A para aprovado.

**Resultado esperado**

- Com conexão, o app consulta a situação atual e **oculta** o documento, exibindo “Carteirinha indisponível. Seu cadastro está inativo ou em análise.” (AC-02). O cache só vale quando não há conexão (AC-03).
- Se a carteirinha continuar aparecendo com os dados antigos, registrar como falha: um aluno sem direito ao transporte poderia embarcar com ela.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| CT-HU029-UI-003 | Data de emissão fixa (“10/09/2026”) e valores padrão de exemplo no código da carteirinha. | [BUG-HU029-UI-003-emissao](issues/BUG-HU029-UI-003-data-de-emissao-e-valores-fixos.md) |
| CT-HU029-UI-003 | A carteirinha e o perfil não refletem dados alterados até sair e entrar de novo. | [BUG-HU029-UI-003-atualizacao](issues/BUG-HU029-UI-003-carteirinha-nao-atualiza.md) |
| CT-HU029-UI-002 | Aluno sem status aprovado consegue abrir a carteirinha: o app ignora o 403 da API e monta o documento com os dados da sessão. | [BUG-HU029-UI-002](issues/BUG-HU029-UI-002-app-exibe-carteirinha-recusada-pela-api.md) |
| CT-HU029-UI-001 | O atalho Carteirinha Digital da tela Início não abre nada. | [BUG-HU029-UI-001](issues/BUG-HU029-UI-001-atalho-do-inicio-sem-acao.md) |
| CT-HU029-UI-001 | Nome, e-mail, instituição e curso são cortados em uma linha com reticências. | [BUG-HU029-UI-001-dados-cortados](issues/BUG-HU029-UI-001-dados-cortados-na-carteirinha.md) |

## Observações gerais

- Referências: [HU-029, seção 7.2.9](../../../../../docs/requisitos.md), [cenários BDD](../../../../../bdd/features/epico-01/HU-029.feature), [tela Carteirinha Digital](../../../../../frontend/src/app/%28aluno%29/carteirinha-digital.tsx) e [suíte de API](../api/API-HU-029.md).
- O limite de 2 segundos do CT-001 é a referência desta suíte para “carregamento rápido” (AC-05), que o requisito não quantifica.
- Defeito relacionado já aberto: a carteirinha aparece por um instante para o administrador antes do Acesso Negado (#111). Não repetir aqui.
- Restaurar o status do aluno B ao final. Ocultar fotos, QR Codes e dados pessoais nas evidências.
