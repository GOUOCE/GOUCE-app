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
| Total de casos  | 5 |
| Última execução | Não realizada                                                                           |
| Testador        | Cauan Ricardo                                                                           |

## Resultado geral

| Situação        | Total | ✅ Passaram | ❌ Falharam | ⏳ Pendentes |
| --------------- | ----: | ----------: | ----------: | -----------: |
| ⏳ Não executada | 5 | 0 | 0 | 5 |

## Pré-condições

| ID    | Descrição |
| ----- | --------- |
| PC-01 | Aplicativo aberto no iPhone pelo **Expo Go**, com a API disponível e conexão ativa (exceto no CT-003). |
| PC-02 | **Aluno A** aprovado, com foto de perfil. Anotar nome completo, curso e instituição cadastrados. |
| PC-03 | **Aluno B** com status **em análise** (renovação) ou **pendente**, para o CT-002. Preparar pelo administrador ou pelo banco local e registrar a preparação. |
| PC-04 | Um segundo celular com câmera (ou app leitor de QR Code) para o CT-004. |
| PC-05 | O token de acesso dura 15 minutos e o app ainda não o renova (#123). Entrar de novo antes de cada caso. |

## Resumo da execução

Executar na ordem abaixo. São **5 casos essenciais**, em duas seções. Os IDs completos usam o prefixo `CT-HU029-UI-`, numerados de 001 a 005.

### Seção A — Exibição da carteirinha

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU029-UI-001 | Abrir a carteirinha do aluno aprovado | Aluno A; Perfil e atalho do Início | Foto, nome, curso, instituição e QR Code; abre rápido | ⏳ PENDENTE | Não executado. |
| CT-HU029-UI-002 | Aluno sem status aprovado | Aluno B (em análise ou pendente) | Documento oculto e “Carteirinha indisponível…” | ⏳ PENDENTE | Não executado. |
| CT-HU029-UI-003 | Dados reais, sem valores de exemplo | Aluno A após editar o perfil | Só dados do aluno A, atualizados | ⏳ PENDENTE | Não executado. |

### Seção B — Uso no embarque

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU029-UI-004 | Carteirinha offline | Aluno A sem internet, após abrir online | Versão em cache, sem erro de conexão | ⏳ PENDENTE | Não executado. |
| CT-HU029-UI-005 | Leitura do QR Code | QR Code online e offline | Lido por outro celular, nas duas situações | ⏳ PENDENTE | Não executado. |

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| — | Nenhuma execução realizada. | — |

## Observações gerais

- Referências: [HU-029, seção 7.2.9](../../../../../docs/requisitos.md), [cenários BDD](../../../../../bdd/features/epico-01/HU-029.feature), [tela Carteirinha Digital](../../../../../frontend/src/app/%28aluno%29/carteirinha-digital.tsx) e [suíte de API](../api/API-HU-029.md).
- O limite de 2 segundos do CT-001 é a referência desta suíte para “carregamento rápido” (AC-05), que o requisito não quantifica.
- Defeito relacionado já aberto: a carteirinha aparece por um instante para o administrador antes do Acesso Negado (#111). Não repetir aqui.
- Restaurar o status do aluno B ao final. Ocultar fotos, QR Codes e dados pessoais nas evidências.
