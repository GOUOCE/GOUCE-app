# Testes manuais de UI — HU-001 — Solicitação de Cadastro de Aluno

## Identificação da suíte

| Campo           | Valor                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------ |
| Módulo          | Autenticação e Gestão de Conta                                                                   |
| Funcionalidade  | HU-001 — Solicitação de Cadastro de Aluno                                                        |
| Camada          | UI                                                                                               |
| Tipo de teste   | Funcional manual                                                                                 |
| Tela            | Criar conta — Dados básicos, Perfil demográfico, Contato e Vínculo, Documentação e Termos de Uso |
| Ambiente        | Desenvolvimento                                                                                  |
| Total de casos  | 52 |
| Última execução | 03/10/2026                                                                                       |
| Testador        | Cauan Ricardo                                                                                    |

## Resultado geral

| Situação        | Total | ✅ Passaram | ❌ Falharam | ⏳ Pendentes |
| --------------- | ----: | ----------: | ----------: | -----------: |
| ✅ Executada | 52 | 40 | 10 | 2 |

## Pré-condições

| ID    | Descrição                                                                                                                                                                                                                                                                                           |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PC-01 | Usuário sem sessão autenticada acessou **Criar conta** no iPhone. Aplicativo e serviços disponíveis, com conexão ativa, exceto nos testes de falha de conexão.                                                                                                                                      |
| PC-02 | Dados básicos válidos: **Maria da Silva Souza**, **qa.hu001.001@example.com**, **15/03/2002**, senha e confirmação **Abcde123**. Usar e-mail novo a cada cadastro de sucesso.                                                                                                                       |
| PC-03 | Demografia: raça **Parda**, gênero **Feminino**, identificação sexual **Heterossexual**, Tem filhos **Não**. Contato/vínculo: **(85) 99999-0000**, bairro, instituição, curso e campus disponíveis, ingresso **2024.1**, turno disponível e **5** semestres. Preencher as demais seleções exibidas. |
| PC-04 | Arquivos fictícios **matricula.pdf** e **residencia.pdf**, legíveis, não vazios e pequenos, disponíveis no app Arquivos do iPhone. Nos casos negativos, manter os demais campos da etapa válidos.                                                                                                   |

## Resumo da execução

**Execução concluída:** 52 casos — 40 passaram, 10 falharam e 2 continuam pendentes.

- **Falharam:** CT-002, CT-007, CT-009, CT-011, CT-013, CT-017, CT-018, CT-029, CT-031 e CT-033.
- **Pendentes:** CT-006 (o defeito de turno do CT-002 impediu verificar o fluxo de conclusão) e CT-008 (não executado).
- **Retirados da suíte:** CT-022 e CT-023 (tamanho máximo de e-mail), porque o limite não foi definido para o projeto.

**Após correção dos defeitos:** retestar os casos que falharam e o CT-006. O defeito de turno do CT-002 já foi corrigido no código (durante a execução um cadastro foi aceito, status pendente, ID 5), então o CT-002 e o CT-006 já podem ser retestados.

Os IDs completos usam o prefixo `CT-HU001-UI-`. A numeração segue a ordem de leitura, de 001 a 054, sem reiniciar em cada seção; com a retirada do CT-022 e do CT-023, a numeração dos demais casos foi mantida para preservar as referências. Não marcar um caso parametrizado como aprovado se faltarem variações.

### Seção A — Cadastro geral

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU001-UI-001 | Campos e etapas do cadastro                     | Dados válidos; todos os campos e etapas                            | Exibir todos os campos e permitir utilizá-los             | ✅ PASSOU | Foi possível percorrer todas as etapas do cadastro, com os campos identificados e utilizáveis, até a conclusão. |
| CT-HU001-UI-002 | Cadastro concluído com sucesso                  | Dados válidos, dois comprovantes e aceite                          | Informar envio para análise e direcionar para login       | ❌ FALHOU | API retornou HTTP 400 `Turno do curso inválido. Opções permitidas: Matutino, Vespertino, Noturno ou Integral`; essas opções não estavam disponíveis no seletor da interface. Cadastro não foi concluído. |
| CT-HU001-UI-003 | Voltar entre etapas sem perder dados            | Formulário preenchido e dois anexos                                | Preservar dados e anexos ao voltar e avançar              | ✅ PASSOU | Os dados permaneceram corretos e sem alterações ao navegar entre as etapas. |
| CT-HU001-UI-004 | Cancelar saída e continuar preenchendo          | Cadastro parcial; Continuar preenchendo                            | Cancelar saída sem perder dados                           | ✅ PASSOU | Exibiu confirmação ao tentar sair; ao escolher Continuar preenchendo, os dados permaneceram preservados. A seta de voltar também funcionou conforme esperado. |
| CT-HU001-UI-005 | Confirmar saída do cadastro                     | Cadastro parcial; Sim, sair                                        | Sair e descartar os dados conforme confirmação            | ✅ PASSOU | Ao selecionar Sim, sair, o app retornou à tela com Entrar/Criar conta, sem mensagem de cadastro concluído; ao abrir Criar conta novamente, todos os campos estavam vazios. |
| CT-HU001-UI-006 | Toques repetidos durante o envio                | Toques repetidos em Concluir cadastro                              | Impedir acionamentos durante envio e repetição visual     | ⏳ PENDENTE | Exibiu alerta nativo com a mensagem `[object Object]`; o terminal registrou várias requisições `POST /usuarios/cadastrar` retornando HTTP 400 por turno do curso inválido (mesmo defeito do CT-002). O erro de turno impediu concluir o cadastro e verificar o fluxo completo de conclusão; falta confirmar se as requisições repetidas ocorreram durante um envio em andamento ou após cada retorno de erro. |
| CT-HU001-UI-007 | Teclado, rolagem e correção de erros no iPhone  | Teclado aberto, rolagem e erros de obrigatório                     | Manter campos, erros e botões acessíveis                  | ❌ FALHOU | Com o teclado aberto em Nome completo (etapa 1), não foi possível rolar até senha/confirmação nem acessar o botão de avanço; a tela retornava para cima ao tentar rolar, e mensagens de erro ficavam ocultas pelo teclado. Mesmo problema observado na etapa 3 (botão Avançar). Com o teclado fechado, a rolagem funcionava normalmente. |
| CT-HU001-UI-008 | Demais seletores: impedir texto livre | Bairro, instituição, curso, campus, período, turno, raça, gênero e identificação sexual. | Restringir escolha às opções exibidas. | ⏳ PENDENTE | Não executado. |

### Seção B — Dados básicos

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU001-UI-009 | Dados básicos obrigatórios                      | Um dado básico vazio por tentativa; nome com espaços               | Bloquear avanço e indicar o campo obrigatório             | ❌ FALHOU | Campos vazios bloquearam o avanço, mas com a mensagem em inglês “Required” (Nome também com borda marrom). Nome só com espaços avançou todas as etapas e só foi recusado no envio (HTTP 400), exibido como alerta “[object Object]”. |
| CT-HU001-UI-010 | Nome abaixo do mínimo | A (1 caractere); Li (2 caracteres). | Rejeitar menos de 3 caracteres. | ✅ PASSOU | Nomes com 1 e 2 caracteres foram rejeitados. |
| CT-HU001-UI-011 | Nome exatamente no mínimo | A B (3 caracteres, incluindo o espaço); Ana (3 caracteres, sem sobrenome). | Distinguir tamanho mínimo de nome completo. | ❌ FALHOU | “A B” foi aceito: avançou para a etapa 2 e a solicitação de cadastro foi enviada. Com “Ana” o app pede nome completo, mas com “A B” não. |
| CT-HU001-UI-012 | Nome no tamanho máximo | Nome com 150 caracteres: 146 letras A seguidas de um espaço e Luz; controle com 149 (145 letras A + espaço + Luz). | Aceitar 149 e 150 caracteres. | ✅ PASSOU | Nome com 150 caracteres contendo espaço foi aceito. Com 150 letras sem espaço, o app trata como incompleto (exige nome e sobrenome). |
| CT-HU001-UI-013 | Nome acima do tamanho máximo | Nome com 151 caracteres: 147 letras A seguidas de um espaço e Luz. | Impedir cadastro com mais de 150 caracteres. | ❌ FALHOU | Nome com 151 caracteres avançou da etapa 1 sem nenhuma mensagem. Só ao concluir o cadastro a API recusou com HTTP 422 `REQUEST_VALIDATION_ERROR` (campo `nome`: `String should have at most 150 characters`) e o cadastro não foi concluído. Esperado: bloquear já na etapa 1 com mensagem compreensível. |
| CT-HU001-UI-014 | Nome com números | Maria123 Silva; 123456. | Rejeitar números no nome. | ✅ PASSOU | Nomes com números foram rejeitados. |
| CT-HU001-UI-015 | Nome com emoji | Maria 😀 Silva. | Rejeitar emoji no nome. | ✅ PASSOU | Nome com emoji foi rejeitado. |
| CT-HU001-UI-016 | Nome com acentos | João Gonçalves; Érica Araújo. | Aceitar acentos e cedilha. | ✅ PASSOU | Nomes com acentos e cedilha foram aceitos. |
| CT-HU001-UI-017 | Nome com apóstrofo | Ana D'Ávila; Ana D’Ávila. | Confirmar a política para apóstrofo simples e tipográfico. | ❌ FALHOU | Não aceitou “Ana D'Ávila” nem “Ana D’Ávila”. Problema de UX: pessoas com apóstrofo no nome não conseguem se cadastrar. |
| CT-HU001-UI-018 | Nome com hífen | Ana-Maria Silva. | Aceitar hífen entre partes do nome. | ❌ FALHOU | Não aceitou “Ana-Maria Silva”, embora o backend aceite hífen. |
| CT-HU001-UI-019 | E-mail inválido                                 | maria; maria@; maria..silva@example.com; maria exemplo@example.com | Indicar e-mail inválido e bloquear avanço                 | ✅ PASSOU | Variantes inválidas rejeitadas. Observação: “ maria@example.com ” (espaços nas pontas) também foi rejeitado; sugere-se aplicar trim. |
| CT-HU001-UI-020 | E-mail já cadastrado                            | E-mail de conta existente                                          | Bloquear cadastro e orientar login ou recuperação         | ✅ PASSOU | E-mail já cadastrado foi bloqueado. |
| CT-HU001-UI-021 | E-mail com caixa mista                          | Maria.Qa001@example.com                                            | Aceitar e-mail com caixa mista                            | ✅ PASSOU | Aceitou e-mail com caixa mista. |
| CT-HU001-UI-024 | Senha com sete caracteres                       | Abcd123 nos dois campos                                            | Exigir pelo menos oito caracteres                         | ✅ PASSOU | Senha com sete caracteres rejeitada. |
| CT-HU001-UI-025 | Senha válida com oito caracteres                | Abcde123 nos dois campos                                           | Aceitar oito caracteres com a complexidade exigida        | ✅ PASSOU | Senha válida com oito caracteres aceita. |
| CT-HU001-UI-026 | Senha sem letra maiúscula                       | abcdefg1 nos dois campos                                           | Exigir ao menos uma letra maiúscula                       | ✅ PASSOU | Senha sem maiúscula rejeitada. |
| CT-HU001-UI-027 | Senha sem letra minúscula                       | ABCDEFG1 nos dois campos                                           | Exigir ao menos uma letra minúscula                       | ✅ PASSOU | Senha sem minúscula rejeitada. |
| CT-HU001-UI-028 | Senha sem número                                | Abcdefgh nos dois campos                                           | Exigir ao menos um número                                 | ✅ PASSOU | Senha sem número rejeitada. |
| CT-HU001-UI-029 | Confirmação de senha divergente                 | Senha Abcde123; confirmação Abcde124                               | Bloquear divergência e permitir após correção             | ❌ FALHOU | Com senhas diferentes, o app permitiu avançar. Ao concluir, voltou à etapa 1 com “As senhas não coincidem”, sem pop-up nem aviso no momento do envio. Erro grave. |
| CT-HU001-UI-030 | Ocultar e exibir senhas                         | Abcde123; ícones de visibilidade                                   | Alternar visibilidade sem alterar os valores              | ✅ PASSOU | Visibilidade das senhas alternou sem alterar os valores. |
| CT-HU001-UI-031 | Senha e confirmação no tamanho máximo | Ab1 seguida de 125 letras a = 128 caracteres; controle com 124 letras a = 127. Mesma senha na confirmação. | Aceitar senha válida com 127 e 128 caracteres. | ❌ FALHOU | 127 e 128 caracteres foram aceitos. Com 129, o app avançou até a última etapa e a recusa veio em inglês (“at most 128 characters”); a mensagem de erro, muito longa, passou para fora do campo. |
| CT-HU001-UI-032 | Senha e confirmação acima do tamanho máximo | Ab1 seguida de 126 letras a = 129 caracteres; primeiro nos dois campos, depois somente na confirmação. | Rejeitar excesso e divergência de confirmação. | ✅ PASSOU | 129 caracteres rejeitado e aceito após remover um caractere. Senha 128 + confirmação 127 avançou, mas foi recusada na última etapa (“senhas não coincidem”). |
| CT-HU001-UI-033 | Data de nascimento inválida                     | 31/02/2002; 15/03; data de amanhã                                  | Impedir cadastro com data inválida                        | ❌ FALHOU | Aceitou 31/02/2002 e 99/99/9999 na etapa 1 (a máscara só restringe a números). O cadastro não foi concluído, mas a validação só ocorreu no envio final. |
| CT-HU001-UI-034 | Data de nascimento: tamanho e máscara | 15032002; 150320029; letras abc e símbolo @ durante a digitação. | Limitar a 8 dígitos e exibir DD/MM/AAAA. | ✅ PASSOU | A máscara aceita apenas números e formata DD/MM/AAAA. |
| CT-HU001-UI-035 | Data de nascimento: limites de idade | Datas relativas ao dia da execução: um dia antes de completar 16; exatamente 16; exatamente 120; um dia antes de completar 121; exatamente 121 anos. | Verificar faixa técnica de 16 a 120 anos completos. | ✅ PASSOU | Limites de idade conforme o esperado. |

### Seção C — Perfil demográfico

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU001-UI-036 | Seleções demográficas obrigatórias              | Raça, identificação sexual ou gênero sem seleção                   | Bloquear avanço e indicar a seleção pendente              | ✅ PASSOU | Seleções demográficas ausentes bloquearam o avanço. |
| CT-HU001-UI-037 | Opção Tem filhos                                | Tem filhos: Não e Sim                                              | Aceitar e preservar ambas as respostas                    | ✅ PASSOU | Respostas Não e Sim aceitas e preservadas. |

### Seção D — Contato e vínculo

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU001-UI-038 | Contato e vínculo obrigatórios                  | Um campo de contato ou vínculo vazio por tentativa                 | Bloquear avanço e indicar o campo obrigatório             | ✅ PASSOU | Campos de contato e vínculo vazios bloquearam o avanço. |
| CT-HU001-UI-039 | WhatsApp incompleto                             | 85; 85999; controle (85) 99999-0000                                | Rejeitar incompletos e aceitar o controle válido          | ✅ PASSOU | Números incompletos rejeitados. Melhoria: máscara de telefone que aceite só números, com DDD e 9 dígitos. |
| CT-HU001-UI-040 | WhatsApp com 11 dígitos | 85999990000; controle formatado (85) 99999-0000. | Aceitar celular de 11 dígitos, com ou sem máscara. | ✅ PASSOU | Celular com 11 dígitos aceito, com e sem máscara. |
| CT-HU001-UI-041 | WhatsApp com excesso de dígitos | 859999900001 (12 dígitos); 8599999000012 (13 dígitos). | Impedir números acima de 11 dígitos. | ✅ PASSOU | Excesso de dígitos impedido. |
| CT-HU001-UI-042 | WhatsApp com letras, símbolos e emoji | abcdefghijk; 85999abc0000; 85999990000abc; 85999990000😀; controle (85) 99999-0000. | Tratar caracteres inválidos sem rejeitar a máscara válida. | ✅ PASSOU | Letras, símbolos e emoji não foram aceitos. |
| CT-HU001-UI-043 | Selecionar e alterar dados acadêmicos           | Opções acadêmicas disponíveis                                      | Permitir selecionar, alterar e preservar escolhas         | ✅ PASSOU | Seleção e alteração funcionaram. Observações: poucas opções de curso e de período; a seta do seletor não abre a lista. |
| CT-HU001-UI-044 | Quantidade de semestres: extremos do seletor | Primeira e última opções exibidas; atualmente 1º e 10º. | Permitir selecionar os extremos disponíveis. | ✅ PASSOU | Extremos 1º e 10º selecionáveis. Observação: a tela vai até o 10º e o backend aceita até 16; cursos longos ficam de fora. |

### Seção E — Documentação

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU001-UI-045 | Ausência de comprovante de matrícula            | Somente residencia.pdf                                             | Solicitar matrícula e bloquear avanço                     | ✅ PASSOU | Ausência do comprovante de matrícula bloqueou o avanço. |
| CT-HU001-UI-046 | Ausência de comprovante de residência           | Somente matricula.pdf                                              | Solicitar residência e bloquear avanço                    | ✅ PASSOU | Ausência do comprovante de residência bloqueou o avanço. |
| CT-HU001-UI-047 | Ausência dos dois comprovantes                  | Nenhum comprovante                                                 | Indicar os dois anexos obrigatórios                       | ✅ PASSOU | Ausência dos dois comprovantes bloqueou o avanço. |
| CT-HU001-UI-048 | Anexar documentos pelo iPhone                   | matricula.pdf e residencia.pdf                                     | Exibir os nomes corretos e permitir avançar               | ✅ PASSOU | Anexos exibidos e avanço permitido. |
| CT-HU001-UI-049 | Cancelar seleção e substituir anexo             | matricula.pdf e matricula-nova.pdf                                 | Preservar ao cancelar e atualizar ao substituir           | ✅ PASSOU | Cancelamento e substituição de anexo funcionaram. |
| CT-HU001-UI-050 | Arquivo não permitido ou acima do limite        | TXT e arquivos em torno do limite aprovado                         | Rejeitar formato/tamanho proibido e aceitar os permitidos | ✅ PASSOU | Formato e tamanho rejeitados. Observação: o limite só é verificado depois de avançar e as mensagens não dizem o que é permitido. |

### Seção F — Termos de uso e privacidade

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU001-UI-051 | Leitura dos termos e da política de privacidade | Cadastro válido na etapa de termos                                 | Disponibilizar termos e política legíveis antes do aceite | ✅ PASSOU | Termos e política disponíveis para leitura. Observação: o texto não cita a LGPD e parece estar em outro idioma. |
| CT-HU001-UI-052 | Conclusão sem aceite e retirada do aceite       | Aceite desmarcado, marcado e desmarcado novamente                  | Permitir conclusão somente com aceite marcado             | ✅ PASSOU | Conclusão bloqueada sem aceite. Observação de UX: a caixa de marcar do aceite não aparece na tela. |

### Seção G — Conexão e nova tentativa

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU001-UI-053 | Falha de conexão ao concluir                    | Cadastro válido; conexão desligada antes do envio                  | Informar falha e preservar os dados para nova tentativa   | ✅ PASSOU | Exibiu “Erro de conexão com o servidor. Verifique sua internet.” e não concluiu. |
| CT-HU001-UI-054 | Nova tentativa após recuperar conexão           | Formulário preservado; conexão restabelecida                       | Permitir concluir sem preencher tudo novamente            | ✅ PASSOU | Com a internet restabelecida, o cadastro foi concluído e os dados do CT-053 estavam preservados. |

## Detalhamento dos casos

### Seção A — Cadastro geral

#### CT-HU001-UI-001 — Campos e etapas do cadastro

**Dados de entrada:** Dados válidos das pré-condições PC-02 a PC-04.

**Passos**

1. Abrir Criar conta e percorrer as etapas preenchendo os dados.
2. Conferir todos os campos da massa, os dois anexos e a etapa de termos.

**Resultado esperado**

- Exibir campos identificados e utilizáveis, sem omitir campus, confirmação de senha ou qualquer outro campo obrigatório.

**Resultado obtido**

- Foi possível percorrer todas as etapas do cadastro, com os campos identificados e utilizáveis, até chegar à conclusão.
- Status: ✅ Passou.

---

#### CT-HU001-UI-002 — Cadastro concluído com sucesso

**Dados de entrada:** Dados válidos das pré-condições PC-02 a PC-04; e-mail ainda não cadastrado; dois comprovantes válidos.

**Passos**

1. Preencher todas as etapas e anexar os dois comprovantes.
2. Ler e aceitar os termos; tocar em Concluir cadastro.
3. Conferir a mensagem e a tela de destino.

**Resultado esperado**

- Informar que o cadastro foi enviado para análise e aguarda aprovação da coordenação; direcionar para login, sem abrir automaticamente a área autenticada.

**Resultado obtido**

- Após preencher todas as etapas e tocar em Concluir cadastro, o serviço retornou erro em vez de sucesso.
- Mensagem retornada: `Turno do curso inválido. Opções permitidas: Matutino, Vespertino, Noturno ou Integral`. Essas opções não estavam disponíveis na interface.
- O cadastro não foi concluído com sucesso.
- Status: ❌ Falhou.

**Evidência**

```
LOG  [API ERROR] 400 POST /usuarios/cadastrar {
  "detail": {
    "erros": [
      "Turno do curso inválido. Opções permitidas: Matutino, Vespertino, Noturno ou Integral"
    ]
  }
}
```

---

#### CT-HU001-UI-003 — Voltar entre etapas sem perder dados

**Dados de entrada:** Dados válidos das pré-condições PC-02 a PC-04 e dois comprovantes selecionados.

**Passos**

1. Preencher até os termos.
2. Usar a seta de voltar para revisar cada etapa.
3. Alterar um dado e avançar novamente até os termos.

**Resultado esperado**

- Preservar textos, seleções e anexos durante a navegação interna; exibir o dado corrigido e a etapa correspondente.

**Resultado obtido**

- Os dados permaneceram corretos e não foram alterados ao voltar e avançar entre as etapas.
- Status: ✅ Passou.

---

#### CT-HU001-UI-004 — Cancelar saída e continuar preenchendo

**Dados de entrada:** Cadastro parcialmente preenchido.

**Passos**

1. Tocar no X de fechar; conferir a confirmação.
2. Escolher Continuar preenchendo.
3. Na primeira etapa, repetir usando a seta de voltar.

**Resultado esperado**

- Pedir confirmação antes de descartar; ao continuar, manter a etapa e todos os dados preenchidos.

**Resultado obtido**

- Ao tentar sair do cadastro, foi exibida uma confirmação.
- Ao selecionar Continuar preenchendo, os dados já preenchidos permaneceram preservados, sem alterações.
- A seta de voltar também funcionou conforme esperado.
- Status: ✅ Passou.

---

#### CT-HU001-UI-005 — Confirmar saída do cadastro

**Dados de entrada:** Cadastro parcialmente preenchido.

**Passos**

1. Tocar no X e escolher Sim, sair.
2. Abrir Criar conta novamente.

**Resultado esperado**

- Sair sem mensagem de cadastro concluído; iniciar um novo formulário sem os dados descartados, conforme o aviso de cancelamento.

**Resultado obtido**

- Ao selecionar Sim, sair, o aplicativo retornou à tela com as opções Entrar e Criar conta, sem exibir mensagem de cadastro concluído.
- Ao abrir Criar conta novamente, todos os campos estavam vazios, sem os dados descartados.
- Status: ✅ Passou.

---

#### CT-HU001-UI-006 — Toques repetidos durante o envio

**Dados de entrada:** Cadastro válido pronto para concluir.

**Passos**

1. Tocar rapidamente várias vezes em Concluir cadastro.
2. Observar o botão e a transição enquanto o envio estiver em andamento.

**Resultado esperado**

- Exibir andamento, impedir novos acionamentos durante o envio e apresentar um único fluxo visual de conclusão; não empilhar alertas ou telas.

**Resultado obtido**

- Ao tocar repetidamente em Concluir cadastro, foi exibido um alerta nativo com a mensagem `[object Object]`.
- No terminal, foram observadas várias requisições `POST /usuarios/cadastrar`, retornando erro HTTP 400 por turno do curso inválido (mesmo defeito do CT-HU001-UI-002).
- O cadastro não foi concluído.
- Status: ⏳ Pendente — o erro de turno impediu verificar o fluxo de conclusão. As requisições repetidas precisam ser verificadas para determinar se ocorreram durante um envio em andamento ou após cada retorno de erro.
- Defeito confirmado: o alerta exibe `[object Object]` em vez de uma mensagem compreensível.

---

#### CT-HU001-UI-007 — Teclado, rolagem e correção de erros no iPhone

**Dados de entrada:** Campos de texto, seletores e um campo obrigatório vazio por etapa.

**Passos**

1. No iPhone em orientação vertical, abrir o teclado nos campos superiores e inferiores.
2. Rolar, editar valores e acionar Próximo; repetir após provocar erro de obrigatório.
3. Corrigir o erro e avançar.

**Resultado esperado**

- Manter campos, mensagens e botões acessíveis, sem sobreposição que impeça uso; permitir dispensar o teclado, localizar o erro e continuar após corrigi-lo.

**Resultado obtido**

- Na etapa Dados básicos, ao tocar em Nome completo e abrir o teclado, não foi possível rolar até os campos inferiores para preencher senha e confirmação, nem acessar o botão de avanço.
- Ao tentar rolar para baixo, a tela retornava para cima. O teclado também impedia visualizar as mensagens de erro.
- Com o teclado fechado, a rolagem funcionava normalmente.
- O mesmo problema ocorre na etapa 3, impedindo o acesso ao botão de avançar.
- Status: ❌ Falhou.
- Observação técnica: trata-se do problema conhecido como "conteúdo oculto pelo teclado" (keyboard overlap) — quando o teclado sobe, ele reduz o espaço útil da tela e, sem rolagem configurada corretamente, o usuário não consegue ver o que digita, as mensagens de erro nem alcançar o botão Avançar.

---

#### CT-HU001-UI-008 — Demais seletores: impedir texto livre

**Dados de entrada:** Bairro, instituição, curso, campus, período, turno, raça, gênero e identificação sexual.

**Passos**

1. Tentar digitar ou colar texto em cada campo listado.
2. Abrir as opções, selecionar um valor e avançar/voltar.

**Resultado esperado**

- Como os controles atuais são seletores, não permitir texto livre nem exigir testes de comprimento por colagem neles; permitir selecionar e preservar valores. Se a versão testada tiver campo livre após Outro/Outra, registrar o novo campo e confirmar seu limite antes de definir o esperado.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

### Seção B — Dados básicos

#### CT-HU001-UI-009 — Dados básicos obrigatórios

**Dados de entrada:** Nome completo, e-mail, data de nascimento, senha e confirmação de senha: um vazio por tentativa; repetir nome com apenas espaços.

**Passos**

1. Preencher os demais campos da etapa com dados válidos e deixar apenas o campo testado vazio.
2. Tocar em Próximo; repetir para cada campo.

**Resultado esperado**

- Permanecer na etapa e indicar o campo pendente.
- Nome com apenas espaços não deve contar como preenchido.

**Resultado obtido**

- Com nome, e-mail, data de nascimento, senha ou confirmação vazios, o app bloqueou o avanço, mas a mensagem em vermelho foi exibida em inglês: “Required”. No campo Nome também apareceu uma borda em tom marrom.
- O nome preenchido com três espaços permitiu avançar por todas as etapas. A rejeição só ocorreu ao concluir o cadastro: HTTP `400`, com a mensagem no log “Nome completo deve ter pelo menos 3 caracteres”. Na interface apareceu apenas um alerta “[object Object]”.
- Correções solicitadas: bloquear nome composto apenas por espaços já na etapa 1 e exibir as mensagens de validação e os erros do serviço em português, de forma compreensível.
- Status: ❌ Falhou.

---

#### CT-HU001-UI-010 — Nome abaixo do mínimo

**Dados de entrada:** A (1 caractere); Li (2 caracteres).

**Passos**

1. Na etapa Dados básicos, informar cada nome e preencher os outros campos corretamente.
2. Tocar em Próximo em cada tentativa.

**Resultado esperado**

- Bloquear o avanço e indicar o mínimo de 3 caracteres; não confundir com o caso de nome vazio ou só com espaços do CT-HU001-UI-009.

**Resultado obtido**

- Resultado conforme o esperado.
- Status: ✅ Passou.

---

#### CT-HU001-UI-011 — Nome exatamente no mínimo

**Dados de entrada:** A B (3 caracteres, incluindo o espaço); Ana (3 caracteres, sem sobrenome).

**Passos**

1. Informar A B com os outros dados válidos e tocar em Próximo; se avançar, tentar concluir com a massa válida.
2. Repetir com Ana em uma nova tentativa.

**Resultado esperado**

- Pela regra técnica atual, A B atende ao tamanho e às duas partes do nome; não rejeitar por tamanho. Ana atende ao tamanho, mas deve solicitar sobrenome antes da conclusão. A aceitação de iniciais depende da confirmação da regra de negócio.

**Resultado obtido**

- Com “A B” (letra, espaço, letra), o app não avisou que o nome precisa ser completo, como faz com “Ana”. Permitiu avançar para a etapa 2 e enviar a solicitação de cadastro.
- A validação considera apenas a existência de duas partes separadas por espaço; iniciais isoladas passam como nome e sobrenome.
- Critério do QA: “A B” não deve ser aceito como nome completo. O resultado esperado da suíte deixava a aceitação de iniciais pendente de regra de negócio; confirmar com o PO.
- Status: ❌ Falhou.

---

#### CT-HU001-UI-012 — Nome no tamanho máximo

**Dados de entrada:** Nome com 150 caracteres: 146 letras A seguidas de um espaço e Luz; controle com 149 (145 letras A + espaço + Luz).

**Passos**

1. Preparar os textos com as contagens indicadas e colar um por tentativa em Nome completo.
2. Preencher o restante e avançar até concluir; voltar à etapa para conferir o valor, se necessário.

**Resultado esperado**

- Aceitar o tamanho de 149 e 150 caracteres, conforme o limite técnico atual, sem cortar o nome nem rejeitá-lo por comprimento.

**Resultado obtido**

- Nome com 150 caracteres contendo um espaço (nome e sobrenome) foi aceito.
- Com 150 letras seguidas, sem espaço, o app informou nome incompleto, porque a validação exige nome e sobrenome; isso não é rejeição por tamanho.
- Status: ✅ Passou.

---

#### CT-HU001-UI-013 — Nome acima do tamanho máximo

**Dados de entrada:** Nome com 151 caracteres: 147 letras A seguidas de um espaço e Luz.

**Passos**

1. Colar o nome de 151 caracteres e conferir o conteúdo exibido.
2. Tocar em Próximo; se avançar, tentar concluir com os demais campos válidos.

**Resultado esperado**

- Impedir inserir além de 150 ou rejeitar o excesso com mensagem compreensível antes da conclusão. Se houver limitação na digitação, registrar quantos caracteres permaneceram e conferir que não houve sucesso com o valor excedente.

**Resultado obtido**

- Ao tocar em Próximo na etapa 1 com o nome acima de 150 caracteres, o app **avançou** sem exibir nenhuma mensagem de limite; o formulário não impediu nem rejeitou o excesso.
- O cadastro só foi barrado no envio final: a API respondeu HTTP `422`, `error.code: "REQUEST_VALIDATION_ERROR"`, com `details: [{"field": "nome", "message": "String should have at most 150 characters"}]`. O cadastro não foi concluído.
- Divergência: o esperado era impedir ou rejeitar o excesso **antes** da conclusão, na própria etapa do nome. O limite de 150 só existe no backend; o formulário (validação da etapa 1) não o aplica.
- Status: ❌ Falhou.

---

#### CT-HU001-UI-014 — Nome com números

**Dados de entrada:** Maria123 Silva; 123456.

**Passos**

1. Informar cada variante no Nome completo, com os demais campos válidos.
2. Tentar avançar e, se permitido, concluir.

**Resultado esperado**

- Pela validação técnica atual, impedir concluir com números e indicar o problema no nome; preservar os demais dados.

**Resultado obtido**

- Resultado conforme o esperado.
- Status: ✅ Passou.

---

#### CT-HU001-UI-015 — Nome com emoji

**Dados de entrada:** Maria 😀 Silva.

**Passos**

1. Digitar ou colar o nome com emoji.
2. Com os demais campos válidos, tentar avançar e concluir.

**Resultado esperado**

- Pela validação técnica atual, impedir o cadastro com emoji e apresentar mensagem compreensível, sem travar ou perder os outros dados.

**Resultado obtido**

- Resultado conforme o esperado.
- Status: ✅ Passou.

---

#### CT-HU001-UI-016 — Nome com acentos

**Dados de entrada:** João Gonçalves; Érica Araújo.

**Passos**

1. Informar cada nome com os demais dados válidos.
2. Avançar, voltar e conferir o texto; prosseguir até a conclusão quando disponível.

**Resultado esperado**

- Aceitar letras acentuadas e cedilha, sem remover ou corromper os caracteres apresentados na interface.

**Resultado obtido**

- Resultado conforme o esperado.
- Status: ✅ Passou.

---

#### CT-HU001-UI-017 — Nome com apóstrofo

**Dados de entrada:** Ana D'Ávila; Ana D’Ávila.

**Passos**

1. Confirmar com o PO se esses nomes são permitidos e registrar a decisão em Observações.
2. Informar cada variante e tentar avançar/concluir com os demais campos válidos.

**Resultado esperado**

- A HU não define essa restrição e o validador atual rejeita os dois apóstrofos. Se aprovados pelo PO, aceitar os nomes; se a restrição for confirmada, rejeitar com mensagem clara. Até a decisão, manter pendente; não considerar a rejeição atual automaticamente correta.

**Resultado obtido**

- O app rejeitou as duas variantes: “Ana D'Ávila” (apóstrofo simples) e “Ana D’Ávila” (apóstrofo tipográfico).
- Pessoas com apóstrofo no nome não conseguem se cadastrar (problema de UX). A HU não define essa restrição; confirmar a regra com o PO.
- Status: ❌ Falhou.

---

#### CT-HU001-UI-018 — Nome com hífen

**Dados de entrada:** Ana-Maria Silva.

**Passos**

1. Informar o nome com hífen e os demais dados válidos.
2. Avançar, voltar e conferir o texto; tentar concluir.

**Resultado esperado**

- Aceitar e preservar o hífen, conforme o validador técnico atual; não apresentar erro genérico de nome inválido.

**Resultado obtido**

- O app rejeitou “Ana-Maria Silva”, embora o backend aceite hífen no nome. Esperado: aceitar e preservar o hífen.
- Status: ❌ Falhou.

---

#### CT-HU001-UI-019 — E-mail inválido

**Dados de entrada:** maria; maria@; maria..silva@example.com; maria exemplo@example.com.

**Passos**

1. Informar um e-mail por tentativa, mantendo os outros dados básicos válidos.
2. Tocar em Próximo.

**Resultado esperado**

- Indicar e-mail inválido e impedir o avanço em todas as variantes.

**Resultado obtido**

- As variantes inválidas foram rejeitadas, conforme o esperado.
- Variação adicional: o e-mail válido com espaços nas pontas (“ maria@example.com ”) também foi rejeitado. Melhoria sugerida: remover os espaços das pontas (trim) antes de validar.
- Status: ✅ Passou.

---

#### CT-HU001-UI-020 — E-mail já cadastrado

**Dados de entrada:** E-mail de uma conta de teste existente.

**Preparação específica**

- Garantir que o e-mail utilizado pertença a uma conta de teste já cadastrada.

**Passos**

1. Informar o e-mail existente com os demais campos válidos.
2. Tocar em Próximo; se avançar, prosseguir até tentar concluir.

**Resultado esperado**

- Impedir a conclusão e informar que o e-mail já está em uso, orientando login ou recuperação de senha; não exibir sucesso.

**Resultado obtido**

- Resultado conforme o esperado.
- Status: ✅ Passou.

---

#### CT-HU001-UI-021 — E-mail com caixa mista

**Dados de entrada:** Maria.Qa001@example.com, ainda não cadastrado.

**Passos**

1. Preencher os dados básicos com o e-mail de caixa mista.
2. Tocar em Próximo.

**Resultado esperado**

- Aceitar o formato e permitir avançar quando os demais campos forem válidos.

**Resultado obtido**

- O e-mail com caixa mista foi aceito e permitiu avançar.
- Status: ✅ Passou.

---

#### CT-HU001-UI-024 — Senha com sete caracteres

**Dados de entrada:** Senha e confirmação: Abcd123.

**Passos**

1. Preencher os dados básicos e informar a mesma senha nos dois campos.
2. Tocar em Próximo.

**Resultado esperado**

- Rejeitar a senha e informar o mínimo de oito caracteres.

**Resultado obtido**

- Resultado conforme o esperado.
- Status: ✅ Passou.

---

#### CT-HU001-UI-025 — Senha válida com oito caracteres

**Dados de entrada:** Senha e confirmação: Abcde123.

**Passos**

1. Preencher os dados básicos e informar a senha nos dois campos.
2. Tocar em Próximo.

**Resultado esperado**

- Aceitar a senha e avançar sem exigir símbolo especial.

**Resultado obtido**

- Resultado conforme o esperado.
- Status: ✅ Passou.

---

#### CT-HU001-UI-026 — Senha sem letra maiúscula

**Dados de entrada:** Senha e confirmação: abcdefg1.

**Passos**

1. Informar os valores com os demais dados básicos válidos.
2. Tocar em Próximo.

**Resultado esperado**

- Bloquear o avanço e informar a necessidade de ao menos uma letra maiúscula.

**Resultado obtido**

- Resultado conforme o esperado.
- Status: ✅ Passou.

---

#### CT-HU001-UI-027 — Senha sem letra minúscula

**Dados de entrada:** Senha e confirmação: ABCDEFG1.

**Passos**

1. Informar os valores com os demais dados básicos válidos.
2. Tocar em Próximo.

**Resultado esperado**

- Bloquear o avanço e informar a necessidade de ao menos uma letra minúscula.

**Resultado obtido**

- Resultado conforme o esperado.
- Status: ✅ Passou.

---

#### CT-HU001-UI-028 — Senha sem número

**Dados de entrada:** Senha e confirmação: Abcdefgh.

**Passos**

1. Informar os valores com os demais dados básicos válidos.
2. Tocar em Próximo.

**Resultado esperado**

- Bloquear o avanço e informar a necessidade de ao menos um número.

**Resultado obtido**

- Resultado conforme o esperado.
- Status: ✅ Passou.

---

#### CT-HU001-UI-029 — Confirmação de senha divergente

**Dados de entrada:** Senha: Abcde123; confirmação: Abcde124.

**Passos**

1. Preencher os dados básicos com as senhas diferentes.
2. Tocar em Próximo.
3. Corrigir a confirmação para Abcde123 e tentar novamente.

**Resultado esperado**

- Informar que as senhas não coincidem e bloquear; após a correção, retirar o erro e permitir avançar.

**Resultado obtido**

- Com senha e confirmação diferentes, o app permitiu avançar para as próximas etapas.
- Ao tocar em Concluir cadastro, nenhum pop-up ou aviso foi exibido; o app voltou à etapa 1 com a mensagem “As senhas não coincidem”, que só foi percebida ao retornar a essa etapa.
- Esperado: bloquear a divergência na própria etapa 1. Classificado pelo QA como erro grave.
- Status: ❌ Falhou.

---

#### CT-HU001-UI-030 — Ocultar e exibir senhas

**Dados de entrada:** Senha e confirmação: Abcde123.

**Passos**

1. Digitar nos dois campos e conferir a ocultação inicial.
2. Tocar no ícone de exibir/ocultar de cada campo, separadamente.

**Resultado esperado**

- Iniciar com caracteres ocultos; alternar somente a visibilidade do campo acionado, preservando seu valor.

**Resultado obtido**

- Resultado conforme o esperado.
- Status: ✅ Passou.

---

#### CT-HU001-UI-031 — Senha e confirmação no tamanho máximo

**Dados de entrada:** Ab1 seguida de 125 letras a = 128 caracteres; controle com 124 letras a = 127. Mesma senha na confirmação.

**Passos**

1. Preparar cada senha fictícia, colar em Senha e Confirmar senha e preencher os demais dados.
2. Tentar avançar e concluir, usando dados novos por cadastro.

**Resultado esperado**

- Aceitar até 128 caracteres, preservando o valor nos dois campos e respeitando maiúscula, minúscula e número; não truncar nem acusar divergência entre entradas iguais.

**Resultado obtido**

- Senha com 127 caracteres: aceita. Senha com 128 caracteres: aceita.
- Senha com 129 caracteres: o formulário permitiu avançar até a última etapa; a recusa só veio no envio, com mensagem em inglês (“should have at most 128 characters”).
- Layout: a mensagem de erro, muito longa, não quebrou a linha e passou para fora do campo; o problema não aparecia com o campo vazio, só ao exibir a mensagem longa (nesse caso, a da senha).
- Esperado: aceitar até 128 e indicar o limite antes da conclusão, em português, sem quebrar o layout.
- Status: ❌ Falhou.

---

#### CT-HU001-UI-032 — Senha e confirmação acima do tamanho máximo

**Dados de entrada:** Ab1 seguida de 126 letras a = 129 caracteres; primeiro nos dois campos, depois somente na confirmação.

**Passos**

1. Colar a senha de 129 caracteres nos dois campos e tentar avançar/concluir.
2. Repetir com a senha de 128 caracteres do CT-HU001-UI-031 e confirmação com um a adicional.

**Resultado esperado**

- Impedir senha acima de 128 ou rejeitar o excesso antes de concluir. Na segunda variante, apontar excesso/divergência ou impedir o caractere adicional; não ocultar uma truncagem que faça o usuário acreditar que cadastrou a senha de 129 caracteres.

**Resultado obtido**

- Senha com 129 caracteres foi rejeitada; ao remover um caractere (128), o cadastro foi aceito.
- Senha com 128 caracteres e confirmação com 127: o app permitiu avançar, mas na última etapa informou que as senhas não coincidem e não concluiu o cadastro.
- O cenário foi rejeitado antes de concluir, por isso passou. A validação tardia da confirmação já está registrada como falha no CT-HU001-UI-029.
- Status: ✅ Passou.

---

#### CT-HU001-UI-033 — Data de nascimento inválida

**Dados de entrada:** 31/02/2002; 15/03 (incompleta); data de amanhã.

**Passos**

1. Tentar digitar ou selecionar cada data, conforme o controle disponível.
2. Com os outros campos válidos, tocar em Próximo; se avançar, tentar concluir.

**Resultado esperado**

- Impedir a seleção de datas inválidas ou apresentar erro compreensível antes da conclusão; não exibir sucesso.

**Resultado obtido**

- A data inexistente 31/02/2002 foi aceita na etapa 1 e permitiu avançar.
- Não há validação de data no formulário: 99/99/9999 também foi aceita, pois a máscara só restringe a entrada a números.
- O cadastro não foi concluído, mas a validação só ocorreu no envio final, e não na etapa 1.
- Observação de UX: ao digitar a data, a mensagem “data inválida” aparece já no primeiro dígito, antes de terminar a digitação ou tocar em Próximo, e só some quando a data fica completa.
- Status: ❌ Falhou.

---

#### CT-HU001-UI-034 — Data de nascimento: tamanho e máscara

**Dados de entrada:** 15032002; 150320029; letras abc e símbolo @ durante a digitação.

**Passos**

1. Digitar 15032002 e conferir a máscara.
2. Tentar acrescentar um nono dígito e inserir letras/símbolos; repetir por colagem.
3. Avançar com a data válida e voltar para conferir.

**Resultado esperado**

- Exibir 15/03/2002, com 10 caracteres contando as barras; impedir dígitos adicionais e não incorporar letras/símbolos. A data válida permanece utilizável após a tentativa de excesso.

**Resultado obtido**

- A máscara aceitou apenas números e exibiu o formato DD/MM/AAAA, conforme o esperado.
- Status: ✅ Passou.

---

#### CT-HU001-UI-035 — Data de nascimento: limites de idade

**Dados de entrada:** Datas relativas ao dia da execução: um dia antes de completar 16; exatamente 16; exatamente 120; um dia antes de completar 121; exatamente 121 anos.

**Passos**

1. Confirmar a faixa com PO e preparar as cinco datas conforme a data do iPhone/ambiente.
2. Informar cada data em tentativa separada e tentar concluir com os demais campos válidos.

**Resultado esperado**

- O código atual aceita idades completas de 16 a 120: rejeita menos de 16 e 121, aceita os três controles internos. Registrar essa expectativa técnica e manter a conclusão de negócio pendente até confirmar a faixa, que não está explícita na HU.

**Resultado obtido**

- Resultado conforme o esperado.
- Status: ✅ Passou.

### Seção C — Perfil demográfico

#### CT-HU001-UI-036 — Seleções demográficas obrigatórias

**Dados de entrada:** Raça, identificação sexual e gênero: uma seleção ausente por tentativa.

**Passos**

1. Chegar ao Perfil demográfico em uma nova tentativa.
2. Preencher as demais opções, deixar somente a seleção testada vazia e tocar em Próximo.

**Resultado esperado**

- Bloquear o avanço e indicar a seleção obrigatória; repetir para as três opções.

**Resultado obtido**

- Resultado conforme o esperado.
- Status: ✅ Passou.

---

#### CT-HU001-UI-037 — Opção Tem filhos

**Dados de entrada:** Respostas Não e Sim, em tentativas separadas.

**Passos**

1. No Perfil demográfico, selecionar Não e avançar com as demais opções válidas.
2. Voltar, conferir a resposta, trocar para Sim e avançar novamente.

**Resultado esperado**

- Permitir ambas as respostas e manter a opção escolhida ao voltar; Não não deve ser tratado como ausência de resposta.

**Resultado obtido**

- Resultado conforme o esperado.
- Status: ✅ Passou.

### Seção D — Contato e vínculo

#### CT-HU001-UI-038 — Contato e vínculo obrigatórios

**Dados de entrada:** Bairro/localidade, WhatsApp, instituição, curso, campus, período de ingresso, turno e quantidade de semestres: um vazio por tentativa.

**Passos**

1. Chegar a Contato e Vínculo com as etapas anteriores válidas.
2. Deixar somente um campo sem preencher e tocar em Próximo; repetir para cada campo.

**Resultado esperado**

- Bloquear o avanço e indicar cada campo pendente, inclusive os que exigem rolagem para serem vistos.

**Resultado obtido**

- Resultado conforme o esperado.
- Status: ✅ Passou.

---

#### CT-HU001-UI-039 — WhatsApp incompleto

**Dados de entrada:** 85; 85999; controle: (85) 99999-0000.

**Passos**

1. Na etapa Contato e Vínculo, informar cada número incompleto e tentar avançar/concluir.
2. Corrigir para o controle válido e repetir.

**Resultado esperado**

- Bloquear números claramente incompletos com indicação do campo; aceitar o controle.

**Resultado obtido**

- Resultado conforme o esperado.
- Melhoria sugerida: aplicar máscara no WhatsApp, aceitando apenas números, com DDD e 9 dígitos.
- Status: ✅ Passou.

---

#### CT-HU001-UI-040 — WhatsApp com 11 dígitos

**Dados de entrada:** 85999990000; controle formatado (85) 99999-0000.

**Passos**

1. Informar cada versão na etapa Contato e Vínculo.
2. Tentar avançar/concluir e conferir o valor ao voltar.

**Resultado esperado**

- Aceitar ambos os formatos; contar 11 dígitos, sem contar parênteses, espaços e hífen como dígitos do telefone.

**Resultado obtido**

- Resultado conforme o esperado.
- Status: ✅ Passou.

---

#### CT-HU001-UI-041 — WhatsApp com excesso de dígitos

**Dados de entrada:** 859999900001 (12 dígitos); 8599999000012 (13 dígitos).

**Passos**

1. Digitar e depois colar cada número em tentativas separadas.
2. Com os demais campos válidos, tentar avançar/concluir.

**Resultado esperado**

- Pela regra técnica atual de celular brasileiro, impedir excesso ou indicar telefone inválido antes da conclusão. Registrar se o campo limita a entrada; não confundir limite de 20 caracteres do armazenamento com 20 dígitos permitidos.

**Resultado obtido**

- Ao aplicar a máscara, o campo só aceitou números no formato de WhatsApp; o excesso foi impedido.
- Status: ✅ Passou.

---

#### CT-HU001-UI-042 — WhatsApp com letras, símbolos e emoji

**Dados de entrada:** abcdefghijk; 85999abc0000; 85999990000abc; 85999990000😀; controle (85) 99999-0000.

**Passos**

1. Colar cada variante no campo e tentar avançar/concluir.
2. Registrar o texto que permanece visível e a mensagem exibida.

**Resultado esperado**

- Entradas sem 11 dígitos válidos devem ser bloqueadas. Para letras/emoji adicionados a um número completo, confirmar se a regra é rejeitar ou limpar visivelmente; o validador atual remove não dígitos e a HU não define essa normalização. Não aprovar essas variantes sem alinhamento. Aceitar a máscara do controle.

**Resultado obtido**

- Ao aplicar a máscara, o campo só aceitou números; letras, símbolos e emoji não foram incorporados.
- Status: ✅ Passou.

---

#### CT-HU001-UI-043 — Selecionar e alterar dados acadêmicos

**Dados de entrada:** Opções disponíveis de instituição, curso, campus, período, turno e quantidade de semestres.

**Passos**

1. Abrir cada seletor e escolher uma opção válida.
2. Avançar e voltar; conferir os valores.
3. Trocar instituição/curso e verificar as opções relacionadas.

**Resultado esperado**

- Exibir e preservar as escolhas; permitir alterá-las.
- Quando houver dependência entre seleções, não manter combinação incompatível sem solicitar nova escolha.

**Resultado obtido**

- Resultado conforme o esperado.
- Curso: há apenas 4 cursos e a opção Outro, que não permite informar o curso. O formulário original tinha muito mais opções.
- Período de ingresso: as opções são fixas (2024.1, 2023.2, 2023.1, 2022.2 e Anterior); faltam períodos recentes. “Anterior” é convertido pelo app em (ano atual − 4).1, ou seja, 2022.1 em 2026: um cadastro com “Anterior” e 10º semestre foi aceito (status pendente, ID 5) com esse valor convertido.
- Período e semestre não são validados entre si: é possível escolher ingresso em 2024.1 com 10º semestre.
- Seletores: tocar na seta não abre a lista; é preciso tocar no campo.
- Status: ✅ Passou.

---

#### CT-HU001-UI-044 — Quantidade de semestres: extremos do seletor

**Dados de entrada:** Primeira e última opções exibidas; atualmente 1º e 10º.

**Passos**

1. Abrir Semestre Atual e conferir acesso à primeira e última opções, rolando se necessário.
2. Selecionar cada extremo em tentativa separada; avançar, voltar e tentar concluir.

**Resultado esperado**

- Permitir usar e preservar ambas as opções disponíveis. A validação técnica admite 1 a 16, mas a tela oferece 1 a 10: registrar a diferença para alinhamento, sem inventar digitação de 0 ou 17 em seletor não editável.

**Resultado obtido**

- Resultado conforme o esperado.
- A tela oferece de 1º a 10º semestre, enquanto o backend aceita de 1 a 16. Alunos de cursos longos, como Medicina (12 semestres), não conseguem informar o semestre.
- Status: ✅ Passou.

### Seção E — Documentação

#### CT-HU001-UI-045 — Ausência de comprovante de matrícula

**Dados de entrada:** Somente residencia.pdf anexado.

**Passos**

1. Chegar à Documentação e anexar apenas residência.
2. Tocar em Próximo.

**Resultado esperado**

- Bloquear o avanço e indicar que falta o comprovante de matrícula ou histórico; manter residência selecionada.

**Resultado obtido**

- Resultado conforme o esperado.
- Status: ✅ Passou.

---

#### CT-HU001-UI-046 — Ausência de comprovante de residência

**Dados de entrada:** Somente matricula.pdf anexado.

**Passos**

1. Chegar à Documentação e anexar apenas matrícula.
2. Tocar em Próximo.

**Resultado esperado**

- Bloquear o avanço e indicar que falta residência; manter matrícula selecionada.

**Resultado obtido**

- Resultado conforme o esperado.
- Status: ✅ Passou.

---

#### CT-HU001-UI-047 — Ausência dos dois comprovantes

**Dados de entrada:** Nenhum documento anexado.

**Passos**

1. Chegar à Documentação sem anexar arquivos.
2. Tocar em Próximo.

**Resultado esperado**

- Bloquear o avanço e identificar os dois comprovantes obrigatórios.

**Resultado obtido**

- Resultado conforme o esperado.
- Status: ✅ Passou.

---

#### CT-HU001-UI-048 — Anexar documentos pelo iPhone

**Dados de entrada:** matricula.pdf e residencia.pdf fictícios, legíveis e pequenos; repetir com JPG e PNG se aprovados para a HU.

**Passos**

1. Tocar em Adicionar e selecionar cada arquivo no app Arquivos do iPhone.
2. Conferir os nomes nas posições corretas e tocar em Próximo.

**Resultado esperado**

- Exibir cada nome junto ao comprovante correspondente e permitir avançar com os dois documentos; não travar ao retornar do seletor.

**Resultado obtido**

- Resultado conforme o esperado.
- Status: ✅ Passou.

---

#### CT-HU001-UI-049 — Cancelar seleção e substituir anexo

**Dados de entrada:** matricula.pdf e matricula-nova.pdf distintos.

**Passos**

1. Abrir o seletor sem anexo e cancelar.
2. Anexar matricula.pdf; abrir Alterar arquivo e cancelar.
3. Abrir novamente, selecionar matricula-nova.pdf, avançar e voltar.

**Resultado esperado**

- Cancelar sem anexo mantém o campo vazio; cancelar uma substituição preserva o anterior.
- Confirmar a troca atualiza o nome e mantém o novo arquivo ao voltar.

**Resultado obtido**

- Resultado conforme o esperado.
- Status: ✅ Passou.

---

#### CT-HU001-UI-050 — Arquivo não permitido ou acima do limite

**Dados de entrada:** Arquivo TXT; arquivo permitido com L−1, L e L+1 bytes, sendo L o limite aprovado por arquivo.

**Preparação específica**

- Confirmar os formatos e o limite de tamanho definidos para a HU-001 antes de executar.

**Passos**

1. Registrar nas observações os formatos e o limite acordados antes de executar.
2. Tentar selecionar cada variante, para cada comprovante, mantendo o outro válido.
3. Se selecionável, tentar avançar e concluir.

**Resultado esperado**

- Impedir selecionar formato proibido ou informar rejeição antes de concluir.
- Para limite inclusivo acordado, aceitar L−1/L e rejeitar L+1 com mensagem clara, preservando os outros dados.

**Resultado obtido**

- Resultado conforme o esperado.
- O app não valida o tamanho nem mostra o limite na seleção: um arquivo de 8 MB pode ser escolhido e o erro só aparece depois de avançar, com mensagem genérica.
- As mensagens “Formato inválido” e “Arquivo excede o limite de tamanho” não informam os formatos permitidos nem o tamanho máximo.
- Status: ✅ Passou.

### Seção F — Termos de uso e privacidade

#### CT-HU001-UI-051 — Leitura dos termos e da política de privacidade

**Dados de entrada:** Cadastro preenchido e dois anexos válidos.

**Passos**

1. Avançar até Termos de Uso.
2. Ler e rolar o conteúdo até o final; abrir a política, se apresentada por link.

**Resultado esperado**

- Disponibilizar os textos de termos e privacidade para leitura antes do aceite, legíveis e sem conteúdo provisório; não exigir aceite para acessar os textos.

**Resultado obtido**

- Resultado conforme o esperado.
- Observação: o texto dos termos não menciona a LGPD e aparenta estar em outro idioma (possivelmente hebraico ou latim), sem o conteúdo definitivo.
- Status: ✅ Passou.

---

#### CT-HU001-UI-052 — Conclusão sem aceite e retirada do aceite

**Dados de entrada:** Caixa de aceite inicialmente desmarcada.

**Passos**

1. Chegar aos termos e tentar concluir sem marcar.
2. Marcar o aceite e conferir o botão.
3. Desmarcar novamente e tentar concluir.

**Resultado esperado**

- Iniciar sem aceite pré-selecionado; impedir conclusão enquanto desmarcado.
- Marcar habilita a ação quando os demais dados são válidos; desmarcar volta a bloqueá-la.

**Resultado obtido**

- Resultado conforme o esperado.
- Observação de UX: a caixa de marcar do aceite não aparece visualmente na tela.
- Status: ✅ Passou.

### Seção G — Conexão e nova tentativa

#### CT-HU001-UI-053 — Falha de conexão ao concluir

**Dados de entrada:** Dados válidos das pré-condições PC-02 a PC-04, anexos e aceite; envio ainda não iniciado.

**Passos**

1. Com a tela de termos aberta, desativar Wi-Fi e dados móveis do iPhone antes do envio.
2. Tocar em Concluir cadastro e aguardar o retorno.
3. Conferir a mensagem e voltar pelas etapas para verificar os dados.

**Resultado esperado**

- Informar falha de conexão, não exibir sucesso e liberar nova tentativa; manter textos, seleções e anexos.

**Resultado obtido**

- Com a conexão desligada, o app exibiu o aviso “Erro de conexão com o servidor. Verifique sua internet.” e não concluiu o cadastro.
- Status: ✅ Passou.

---

#### CT-HU001-UI-054 — Nova tentativa após recuperar conexão

**Dados de entrada:** Formulário preservado após falha do CT-HU001-UI-053.

**Passos**

1. Reativar a conexão do iPhone e retornar aos termos.
2. Conferir o aceite e tocar em Concluir cadastro sem redigitar dados.
3. Observar a conclusão.

**Resultado esperado**

- Permitir nova tentativa, informar envio para análise e direcionar para login quando concluído; não obrigar a preencher tudo novamente.

**Resultado obtido**

- Com a internet restabelecida, a nova tentativa funcionou: os dados preenchidos no CT-HU001-UI-053 continuavam salvos e o envio foi validado.
- Status: ✅ Passou.

## Defeitos encontrados

| Caso            | Defeito                                                                                                                                                                                              | Issue |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| CT-HU001-UI-002 | O backend rejeita o cadastro com `Turno do curso inválido. Opções permitidas: Matutino, Vespertino, Noturno ou Integral`, mas essas opções não estão disponíveis no seletor da interface, impedindo a conclusão do cadastro por qualquer usuário. **Resolvido no código; falta reteste.** | [BUG-HU001-UI-002-turno-curso-invalido](issues/BUG-HU001-UI-002-turno-curso-invalido.md) |
| CT-HU001-UI-006 | O alerta exibido após toques repetidos em Concluir cadastro mostra a mensagem `[object Object]` em vez de um texto compreensível.                                                                       | [BUG-HU001-UI-006-mensagem-erro-object-object](issues/BUG-HU001-UI-006-mensagem-erro-object-object.md) |
| CT-HU001-UI-007 | Com o teclado aberto nos campos superiores (Nome completo), a tela não rola corretamente: campos inferiores, mensagens de erro e o botão de avanço ficam inacessíveis. Ocorre nas etapas 1 e 3.         | [BUG-HU001-UI-007-teclado-cobre-campos](issues/BUG-HU001-UI-007-teclado-cobre-campos.md) |
| CT-HU001-UI-009 | Campos vazios exibem “Required” em inglês; nome só com espaços avança todas as etapas e só é recusado no envio, com alerta “[object Object]”. | [BUG-HU001-UI-009-validacao-tardia-no-envio](issues/BUG-HU001-UI-009-validacao-tardia-no-envio.md)<br>[BUG-HU001-UI-009-mensagens-validacao-em-ingles](issues/BUG-HU001-UI-009-mensagens-validacao-em-ingles.md)<br>[BUG-HU001-UI-006-mensagem-erro-object-object](issues/BUG-HU001-UI-006-mensagem-erro-object-object.md) |
| CT-HU001-UI-011 | Nome com iniciais isoladas (“A B”) é aceito como nome completo e o cadastro é enviado. | [BUG-HU001-UI-011-nome-com-iniciais-aceito](issues/BUG-HU001-UI-011-nome-com-iniciais-aceito.md) |
| CT-HU001-UI-013 | O formulário não limita o nome a 150 caracteres: com 151 caracteres, a etapa 1 avança sem mensagem e só a API rejeita no envio final (HTTP 422, `String should have at most 150 characters`). | [BUG-HU001-UI-009-validacao-tardia-no-envio](issues/BUG-HU001-UI-009-validacao-tardia-no-envio.md)<br>[BUG-HU001-UI-009-mensagens-validacao-em-ingles](issues/BUG-HU001-UI-009-mensagens-validacao-em-ingles.md) |
| CT-HU001-UI-017 | Nomes com apóstrofo (“Ana D'Ávila”, “Ana D’Ávila”) são rejeitados. | [BUG-HU001-UI-017-nome-com-apostrofo-rejeitado](issues/BUG-HU001-UI-017-nome-com-apostrofo-rejeitado.md) |
| CT-HU001-UI-018 | Nome com hífen (“Ana-Maria Silva”) é rejeitado pelo app, embora o backend aceite. | [BUG-HU001-UI-018-nome-com-hifen-rejeitado](issues/BUG-HU001-UI-018-nome-com-hifen-rejeitado.md) |
| CT-HU001-UI-029 | Confirmação de senha divergente permite avançar; ao concluir, o app volta à etapa 1 com “As senhas não coincidem”, sem aviso no momento do envio. | [BUG-HU001-UI-029-confirmacao-senha-divergente-avanca](issues/BUG-HU001-UI-029-confirmacao-senha-divergente-avanca.md) |
| CT-HU001-UI-031 | Senha com 129 caracteres avança até a última etapa; a recusa vem em inglês e a mensagem longa passa para fora do campo. | [BUG-HU001-UI-009-validacao-tardia-no-envio](issues/BUG-HU001-UI-009-validacao-tardia-no-envio.md)<br>[BUG-HU001-UI-031-mensagem-erro-longa-extrapola-campo](issues/BUG-HU001-UI-031-mensagem-erro-longa-extrapola-campo.md)<br>[BUG-HU001-UI-009-mensagens-validacao-em-ingles](issues/BUG-HU001-UI-009-mensagens-validacao-em-ingles.md) |
| CT-HU001-UI-033 | Datas inexistentes (31/02/2002, 99/99/9999) são aceitas na etapa 1; a validação só ocorre no envio final. | [BUG-HU001-UI-033-data-nascimento-sem-validacao](issues/BUG-HU001-UI-033-data-nascimento-sem-validacao.md)<br>[BUG-HU001-UI-033-validacao-data-durante-digitacao](issues/BUG-HU001-UI-033-validacao-data-durante-digitacao.md) |

## Observações gerais

- Nos casos com várias entradas, registrar o resultado de cada variação antes de marcar o caso como aprovado.
- Formatos e tamanho máximo dos comprovantes ainda precisam ser formalizados na HU-001. O CT-HU001-UI-050 foi executado e passou; as observações sobre limite e mensagens estão no próprio caso.
- O campo “Você é uma pessoa transgênero?” aparece na tela, mas sua obrigatoriedade não está explícita na HU. Confirmar a regra; preenchê-lo nos demais testes para isolar as validações.
- Se uma falha anterior ou a perda da sessão do Expo impedir o teste, manter o caso pendente e registrar o impedimento em Observações.
- O defeito de turno do curso inválido (CT-HU001-UI-002) bloqueou a conclusão do cadastro na primeira rodada e impediu a verificação completa do CT-HU001-UI-006. O defeito foi corrigido no código (o seletor passou a oferecer os turnos aceitos pela API) e, em testes posteriores, um cadastro foi aceito (status pendente, ID 5). O CT-002 permanece ❌ porque registra a execução original; reexecutar o CT-002 e o CT-006 para registrar o reteste.
- As issues de defeitos, melhorias e pontos a discutir estão em [`issues/`](issues/README.md).
- Validação tardia (CT-009, CT-029, CT-031 e CT-033): vários erros que deveriam ser apontados na etapa em que o dado é informado só aparecem no envio final, muitas vezes com mensagens em inglês.
- O CT-HU001-UI-022 e o CT-HU001-UI-023 (tamanho máximo de e-mail) foram retirados da suíte porque o limite não foi definido para o projeto. Recriá-los quando houver essa definição.
- Nome vazio ou só com espaços pertence ao CT-009; números, emoji e limites têm casos próprios na seção Dados básicos.
- Referências técnicas dos limites: [validação do formulário](../../../../../frontend/src/schemas/alunoSchema.ts), [DTO do cadastro](../../../../../backend/src/modulos/usuarios/application/dtos/usuario_dto.py), [validação do nome](../../../../../backend/src/shared/validators/string_sem_numero_validator.py), [WhatsApp](../../../../../backend/src/shared/validators/telefone_validator.py) e [idade](../../../../../backend/src/shared/validators/data_nascimento_validator.py). São referências para observar o comportamento pela UI, não testes diretos dos serviços. Os limites não explícitos na HU devem ser confirmados com PO; a senha mantém o mínimo de 8 exigido no requisito.
- Nos testes de limite, manter o restante válido e registrar o comportamento ao digitar/colar e ao concluir; conseguir avançar uma etapa não comprova a conclusão.
