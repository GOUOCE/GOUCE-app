import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Checkbox, useTheme } from 'react-native-paper';
import { useFormContext, Controller } from 'react-hook-form';

export function TermosDeUso() {
  const theme = useTheme();
  const { control, formState: { errors } } = useFormContext();

  return (
    <View style={styles.container}>
      <Text variant="bodyLarge" style={styles.intro}>Leia os termos com atenção:</Text>

      <View style={styles.termsBox}>
        <ScrollView style={styles.termsScroll}>
          <Text style={styles.termsText}>
            <Text style={styles.bold}>ESTATUTO DA ASSOCIAÇÃO DOS UNIVERSITÁRIOS DE OCARA - AUO</Text>
            {"\n"}Fundada no dia 23 de outubro do ano de 2004 | Ocara - Ceará
            {"\n\n"}
            <Text style={styles.bold}>CAPÍTULO I - DA DENOMINAÇÃO, OBJETIVO, SEDE, FORO E FINS</Text>
            {"\n\n"}
            Art. 1º. Aos 23 (vinte e três) dias do mês de outubro do ano de 2004 (dois mil e quatro) foi fundada a Associação dos Universitários de Ocara, denominada pela sigla AUO. A referida Entidade representativa dos universitários foi criada por tempo indeterminado de trabalho e com a finalidade de representa-los em suas lutas por melhorias na educação. Com sede e foro na cidade de Ocara – Ceará e reger-se-á pelas normas e “leis” do referido estatuto, regimento interno e outros documentos da citada Entidade. O Estatuto da Associação é sua lei maior, devendo sempre ser observado e obedecido, porém, não pode contrariar a legislação em vigor.
            {"\n\n"}
            Art. 2º. A Associação dos Universitários de Ocara, tem como finalidade principal: a) Reivindicar junto às autoridades competentes, a melhoria da educação em Ocara; b) Reivindicar ao secretário de transporte do município de Ocara, a manutenção do transporte universitário; c) Reivindicar junto às autoridades Estaduais e Federais pela aquisição de transporte para os estudantes das instituições de ensino superior; d) Apoiar a participação dos universitários em congressos, seminários, palestras, fóruns, oficinas e demais eventos de cunho acadêmico; e) Promover eventos e encontros acadêmicos nas diversas áreas de interesse dos associados.
            {"\n\n"}
            Art. 3º. A Associação dos Universitários de Ocara buscará parcerias com o setor do comércio, transporte, entretenimento e com as instituições governamentais do município de Ocara para fins de promoção de palestras educativas de caráter artístico, cultural e científico, compatíveis com a disponibilidade dos universitários.
            {"\n\n"}
            Art. 4º. A Associação dos Universitários de Ocara, no desenvolvimento de suas atividades e crescimento da mesma, não fará discriminação de raça, cor, sexo, religião e credo político, tendo como membros associados universitários de Ocara, de todos os níveis de ensino superior.
            {"\n\n"}
            Art. 5º. A Associação dos Universitários de Ocara, terá em sua documentação: Estatuto, Regimento Interno e outros documentos que, sendo aprovados em reunião de diretoria, Assembleia Geral e Conselho Fiscal, disciplinará o funcionamento da mesma junto aos seus associados.
            {"\n\n"}
            Art. 6º. A Associação dos Universitários de Ocara, desejando cumprir com suas finalidades, se organizará em tantas quantas unidades de prestação de serviço se fizerem necessárias, que se regerão pelas normas do referido estatuto.
            {"\n\n"}
            <Text style={styles.bold}>CAPÍTULO II - DOS DIREITOS E DEVERES DOS SÓCIOS</Text>
            {"\n\n"}
            Art. 7º. A Associação dos Universitários de Ocara terá na formação do seu quadro social as seguintes categorias de sócios: a) Fundadores; b) Contribuintes; c) Voluntários; d) Beneméritos.
            {"\n\n"}
            Art. 8º. SÃO DIREITOS DOS ASSOCIADOS: a) Votar e ser votado para cargos eletivos na diretoria da Entidade; b) Participar, tomar parte das reuniões de Assembleia Geral da Entidade; c) Utilizar o transporte universitário, tendo preferência dos assentos do coletivo; d) Nenhum associado responderá, mesmo subsidiariamente, pelas obrigações e encargos de qualquer dívida contraída pela atual administração da Diretoria da Entidade; e) Qualquer associado poderá ser afastado do seu quadro social por irregularidade ou indisciplina na permanência da mesma; f) Propor a admissão de novos associados; g) Ter acesso a todos os documentos da associação; h) Recorrer das decisões da Diretoria Executiva; i) Nenhum associado poderá ser impedido de exercer direito ou função que lhe tenha sido legitimamente conferido, a não ser nos casos e pela forma previstos na lei ou no Estatuto da Entidade.
            {"\n\n"}
            Art. 9º. SÃO DEVERES DOS ASSOCIADOS: Os deveres dos associados são os previstos na lei, no Estatuto da Entidade e nas deliberações da Diretoria Executiva, mas em especial: a) Cumprir rigorosamente com as disposições estatuárias, regimento interno e outros documentos da referida Entidade; b) Participar ativamente e assiduamente das reuniões de Assembleia Geral, eventos sociais e decisões na administração da Diretoria da Entidade; c) Acatar as determinações e decisões corretas da Diretoria da Entidade; d) Estar em dia com as suas obrigações sociais junto à Tesouraria da Entidade; e) Recorrer por escrito ou verbalmente nas reuniões de Assembleia Geral, das atas que discordam; f) Propor, dar ideias de medidas que visem o processo e organização da referida Entidade; g) Contribuir mensalmente com um determinado valor financeiro proposto pela Diretoria da referida Entidade; h) Zelar pela integridade e conservação do transporte universitário; i) Respeitar mutualmente os demais associados e outros usuários do transporte universitário; j) Respeitar e cumprir rigorosamente os horários do transporte universitário; k) Respeitar os horários de funcionamento das instituições de ensino dos associados. Salvo as exceções e ocorrências em particular, desde que sejam previamente comunicadas a diretoria da associação; l) Cooperar para o desenvolvimento e a realização das atividades da Associação; m) Fazer cumprir este Estatuto e as deliberações decorrentes da Assembleia Geral e da Diretoria Executiva; n) Comparecer às Assembleias Gerais e às reuniões a que for convocado; o) Prestar conta dos actos praticados nos cargos e comissões para que for eleito ou designado.
            {"\n\n"}
            <Text style={styles.bold}>CAPÍTULO III - DA ADMINISTRAÇÃO DA DIRETORIA DA ASSOCIAÇÃO</Text>
            {"\n\n"}
            Art. 10. A Associação dos Universitários de Ocara será administrada pelos seguintes setores: a) Assembleia Geral; b) Conselho Fiscal; c) Diretoria.
            {"\n\n"}
            Art. 11. A Assembleia Geral é um ato soberano na administração da Entidade, sendo formada pelos universitários de Ocara, em pleno gozo de seus direitos estatuários.
            {"\n\n"}
            Art. 12. COMPETE À ASSEMBLEIA GERAL: De acordo com o artigo 59 do Código Civil, somente a Assembleia Geral pode deliberar e votar sobre: a) Destituição dos administradores; b) Decidir sobre qualquer reforma no Estatuto, Regimento Interno e outros documentos na atual administração da Diretoria da Entidade; c) Decidir sobre a extinção ou a dissolução da Entidade nos termos do artigo 31º; d) Decidir, sob conveniência, alienar, transgredir, hipotecar ou permutar os bens da referida Entidade; e) Destituí a Diretoria; f) Apreciar recursos contra a decisão da diretoria.
            {"\n\n"}
            Art. 13. ASSEMBLEIA GERAL ORDINÁRIA: É a assembleia oficial da associação, o órgão mais importante. Devendo realizar-se de 01 (uma) a 02 (duas) vezes por ano. Tem como finalidade tratar dos assuntos: a) Votar e eleger os membros da Diretoria e Conselho Fiscal da Entidade no ano que suas eleições se realizam; b) Dar ciência, parecer e discutir a prestação de contas e relatórios aprovados pelo Conselho Fiscal junto aos seus associados.
            {"\n\n"}
            Art. 14. ASSEMBLEIA GERAL EXTRAORDINÁRIA: Deve ser convocada sempre que se tornar necessário tal evento para determinados fins: a) Apreciar e dar conhecimento aos associados dos relatórios mensais da então administração da Diretoria da Entidade; b) Deliberar sobre os assuntos de interesse dos associados.
            {"\n\n"}
            Art. 15. A Assembleia Geral e reuniões da Diretoria realizar-se-ão, ordinária ou extraordinariamente, quando convocadas oficialmente pelo: a) Presidente ou Diretoria da Entidade; b) Conselho Fiscal; c) Por 1/4 (um quarto) dos associados, através de ofício devidamente assinado por estes e que os referidos sócios estejam devidamente em dias com suas obrigações sociais junto à Entidade.
            {"\n\n"}
            Art. 16. A convocação da Assembleia Geral para as eleições da Diretoria da Entidade, será feita através de ofício ou edital de convocação tornando-a pública, com avisos fixados na Sede da Entidade e/ou em lugares públicos, na imprensa escrita ou falada e com antecedência de 15 (quinze) dias do término do então mandato dos membros da Diretoria da Entidade.
            {"\n\n"}
            Art. 17. Qualquer Assembleia Geral instalar-se-á em primeira convocação com maioria absoluta dos associados e em segunda convocação, 15 (quinze) dias após a primeira, com os que estiverem presentes. De forma que a maioria simples decidirá em nome da Associação. O deliberado na mesma obrigará a todos os associados, ainda que ausentes ou discordantes.
            {"\n\n"}
            Art. 18. A Diretoria da Associação dos Universitários de Ocara será formada por: um(a) Presidente, um(a) Vice-Presidente, 1º e 2º Secretários(as), 1º e 2º Tesoureiros(as), seis Conselheiros(as) Fiscais, sendo 03 (três) membros titulares e 03 (três) membros suplentes, um(a) Assessor(a) Financeiro(a), um(a) Diretor(a) de Comunicação e um(a) Diretor(a) de Marketing, nas seguintes condições: a) Qualquer membro da Diretoria da Entidade poderá ser reeleito; b) Nenhum membro da Diretoria poderá faltar mais de três reuniões consecutivas sem a devida justificativa, caso contrário, será substituído pelo seu suplente, que ocupará a vaga até o final do mandato; c) O mandato dos membros da Diretoria da AUO será de 02 (dois) anos, contabilizando desde a data de sua eleição e posse.
            {"\n\n"}
            Art. 19. COMPETE À DIRETORIA: a) Elaborar e executar os programas e projetos anuais de atividade da Entidade; b) Elaborar e apresentar à Assembleia Geral e ao Conselho Fiscal as prestações de contas, relatórios semestrais e anuais de reuniões da Entidade; c) Manter relacionamento e intercambio junto às repartições públicas e privadas nas esferas municipal, estadual e federal para a devida colaboração mútua, a fim de conseguir benefícios para os nossos universitários; d) E outras providencias que julgar necessárias.
            {"\n\n"}
            Art. 20. COMPETE AO(A) PRESIDENTE: a) Representar a Entidade dentro e fora do município, ativa e passivamente, judicial e extrajudicialmente; b) Cumprir e fazer cumprir rigorosamente as normas e “leis” que regem o Estatuto, o Regimento Interno e outros documentos da Entidade; c) Presidir as reuniões da Diretoria e Assembleia Geral da Entidade; d) Autorizar despesas com a apreciação de visto do Conselho Fiscal juntamente com o 1º Tesoureiro; e) Recorrer à Assembleia Geral quando julgar conveniente, às suas próprias decisões e resoluções, por motivo de não aprovação da atual Diretoria pelos seus atos que praticados forem em benefício da Entidade; f) E outras providencias que julgar necessário.
            {"\n\n"}
            Art. 21. COMPETE AO(A) VICE-PRESIDENTE: a) Substituir o(a) Presidente em suas faltas e em impedimentos que venham a acontecer; b) Assumir o mandato do(a) Presidente em caso de vacância até o termino do mesmo; c) Prestar serviço, colaborar com o(a) Presidente na administração e projetos de interesse da Entidade.
            {"\n\n"}
            Art. 22. COMPETE AO(A) 1º SECRETÁRIO(A): a) Secretariar todas as reuniões da Diretoria e Assembleia Geral; b) Ficar em sua guarda toda documentação original (livros de atas, pastas de correspondências, arquivos) e ter sigilo e a confiança dos mesmos junto aos associados; c) Redigir ofícios, requerimentos, circulares, edital de convocação, avisos e atas, confeccionar as pautas para reuniões, guardar e arquivar todas as correspondências da Entidade; d) Organizar arquivos e fichas da Entidade, mantendo em ordem e sob sigilo profissional junto aos associados; e) Substituir o cargo do(a) Vice-Presidente em caso de vacância até o termino de o seu mandato na atual administração da referida Entidade; f) E outras providencias que julgar necessárias.
            {"\n\n"}
            Art. 23. COMPETE AO(A) 2º SECRETÁRIO(A): a) Substituir o(a) 1º Secretário(a) em suas faltas ou impedimentos que venham a acontecer na atual administração da Entidade; b) Assumir o cargo do(a) 1º Secretário(a) em caso de vacância até o termino do referido mandato da atual administração da Entidade; c) Prestar o seu apoio, colaboração e trabalho ao(a) 1º Secretário(a) em todos os setores da secretaria da referida Entidade; d) E outras providencias que julgar necessárias.
            {"\n\n"}
            Art. 24. COMPETE AO(A) 1º TESOUREIRO(A): a) Fazer contabilidade, escrituração, pastas de recibos e notas fiscais; deve estar sob sua guarda toda a documentação referente à tesouraria da Entidade; b) Arrecadar e contabilizar as contribuições, quantias e numerarias mantendo em dia a escrituração e a contabilidade sempre com o vista do(a) Presidente e com o parecer do Conselho Fiscal; c) Apresentar a prestação de contas, balancetes bimestrais, junto a Diretoria e Assembleia Geral de acordo com a realização das assembleias; d) Apresentar no final de cada ano, no mês de dezembro, o balancete geral e uma prestação de contas finalizando o fechamento dos trabalhos do ano em curso junto a Assembleia Geral; e) Conservar sob sua guarda o sigilo de todo numerário (dinheiro) e documentação de tesouraria da referida Entidade; f) Manter todo numerário (dinheiro) arrecadado pela Entidade em estabelecimento bancário, com abertura de conta em conjunto em nome do(a) Presidente e do(a) tesoureiro(a) da referida Entidade; g) E outras providencias que julgar necessárias.
            {"\n\n"}
            Art. 25. COMPETE AO(A) 2º TESOUREIRO(A): a) Substituir o(a) primeiro(a) tesoureiro(a) em suas faltas ou impedimentos que venham a acontecer na atual administração; b) Assumir o cargo de primeiro(a) tesoureiro(a) no caso de vacância até o término do referido mandato junto a Diretoria da Entidade; c) Prestar o seu apoio e colaboração ao(a) primeiro(a) tesoureiro(a) nos trabalhos do referido setor da Entidade; d) E outras providencias que julgar necessárias.
            {"\n\n"}
            Art. 26. COMPETE AO ASSESSOR(A) FINANCEIRO(A): a) Auxiliar o trabalho dos tesoureiros(as); b) Comunicar aos associados as datas de contribuição mensal; c) E outras providencias que julgar necessárias.
            {"\n\n"}
            Art. 27. COMPETE AO DIRETOR(A) DE COMUNICAÇÃO: a) Informar aos associados sobre datas de realização de concursos, congressos, fóruns, palestras, oficinas, seminários e outras atividades de interesse dos mesmos; b) Comunicar previamente as datas de realização da Assembleia e reuniões da associação; c) Elaborar planos estratégicos das áreas de comercialização, marketing e comunicação da Entidade; d) Definir e supervisionar a elaboração de campanhas, promovendo a sua divulgação junto a sociedade; e) Assegurar os objetivos da Entidade em termos de comunicação com a Diretoria e os associados; f) Planejar e supervisionar os trabalhos que envolvem comunicação visual, como placas e outdoors, obtendo o melhor retorno possível em termos de divulgação e fixação da imagem da Entidade; g) Gerenciar a preparação dos panfletos, sites ou revistas da Entidade, selecionando assuntos prioritários; h) E outras providencias que julgar necessárias;
            {"\n\n"}
            Art. 28. COMPETE AO DIRETOR(A) DE MARKETING: a) Propagar, divulgar, o nome da Entidade nos diversos meios de comunicação; b) Providenciar a criação das diversas ferramentas de marketing; c) Buscar parceiros que possam contribuir com a Entidade; d) Responder por todas as atividades relacionadas ao marketing da Entidade; e) Coordenar serviços de marketing na Entidade; f) E outras providencias que julgar necessárias.
            {"\n\n"}
            Art. 29. O Conselho Fiscal é o setor soberano na fiscalização dos trabalhos da Entidade. É formado por 06 (seis) integrantes maiores de idade, sendo 03 (três) titulares e 03 (três) suplentes. Terá um mandato de 02 (dois) anos de trabalhos, coincidentes como os dos membros da Diretoria, a partir da data de sua fundação, eleição e posse. Em caso de vacância do titular, assumirá o referido secretário suplente. O Conselho Fiscal deverá reunir-se ordinariamente e/ou extraordinariamente a cada 06 (seis) meses e/ou quando convocados para determinado fim (qualquer finalidade ou motivo).
            {"\n\n"}
            Art. 30. Todas as atividades, serviços prestados pelos membros que fazem parte da Diretoria da AUO, serão inteiramente gratuitos, sendo proibido o recebimento de qualquer importância.
            {"\n\n"}
            <Text style={styles.bold}>CAPÍTULO IV - DO PATRIMÔNIO, BENS MOVEIS E IMOVEIS DA ENTIDADE</Text>
            {"\n\n"}
            Art. 31. No caso de dissolução da referida Associação, os seus bens serão doados à outra Entidade como o mesmo fim, que esteja devidamente legalizada em cartório e que se encontre em atividade dentro do município de Ocara.
            {"\n\n"}
            <Text style={styles.bold}>CAPÍTULO V - DAS ELEIÇÕES DA ENTIDADE</Text>
            {"\n\n"}
            Art. 32. A Associação dos Universitários de Ocara terá uma eleição a cada 02 (dois) anos a partir da data de sua fundação. a) As eleições da Diretoria da Entidade deverão acontecer baseadas em edital de convocação num prazo de 15 (quinze) dias a 30 (trinta) dias de antecedência tornando público e para tal fim deverá ser assinado pelo então Presidente da Entidade; b) As eleições serão realizadas por voto secreto e direto, livre e democrático, não sendo obrigatório; c) Terão direito de votar e serem votados, os associados que estejam devidamente em dias com suas obrigações sociais junto à tesouraria da Entidade; d) No processo de votação as referidas chapas de candidatos deverão obedecer aos critérios estabelecidos no edital de convocação. e) Será criada uma comissão eleitoral, composta por 05 (cinco) universitários associados devidamente em dias com suas obrigações junto a Tesouraria da Entidade e que não façam parte de nenhuma das chapas concorrentes. Os mesmos devem ser eleitos em assembleia; f) É vedado mais de uma reeleição consecutiva.
            {"\n\n"}
            <Text style={styles.bold}>CAPÍTULO VI - DAS DISPOSIÇÕES GERAIS</Text>
            {"\n\n"}
            Art. 33. A Associação dos Universitários de Ocara só poderá ser extinta e dissolvida por decisão maior de seus associados, reunidos em Assembleia Geral, extraordinária, convocada especialmente para este fim.
            {"\n\n"}
            Art. 34. Em caso de renúncia de todos os membros da Diretoria da entidade, será realizada uma nova eleição de acordo com o artigo 32º deste Estatuto e no caso de empate para o cargo de Presidente, assumirá o candidato com maior idade.
            {"\n\n"}
            Art. 35. Os presente Estatuto, Regimento Interno e outros documentos da Entidade, poderão ser corrigidos e referendados em qualquer época, por decisão da Assembleia Geral e terá sua legibilidade após registro em cartório.
            {"\n\n"}
            Art. 36. Os casos omissos neste Estatuto serão resolvidos pela Diretoria, Conselho Fiscal e Assembleia Geral, no intuito de beneficiar a referida Entidade.
            {"\n\n"}
            O presente estatuto foi aprovado pela assembleia geral realizada no dia 11 de outubro de 2014.
            {"\n\n"}
            <Text style={styles.bold}>REGIMENTO INTERNO DA ORGANIZAÇÃO E FUNCIONAMENTO DA ASSOCIAÇÃO DOS UNIVERSITÁRIOS DE OCARA</Text>
            {"\n\n"}
            Art. 1º. O presente Regimento Interno estabelece normas de caráter suplementar de organização e funcionamento da ASSOCIAÇÃO DOS UNIVERSITÁRIOS DE OCARA, consolidando e detalhando as disposições de seu Estatuto Social, devendo os dirigentes e/ou responsáveis pela sua aplicação fazê-lo sempre em consonância com os objetivos institucionais da entidade, a legislação e demais instrumentos normativos vigentes.
            {"\n\n"}
            Art. 2º. São instâncias consultivas e deliberativas da ASSOCIAÇÃO: I. A Assembleia Geral; II. A Diretoria Executiva; III. O Conselho Fiscal. Parágrafo primeiro: As instâncias deliberativas são a Assembleia Geral e a Diretoria Executiva; Parágrafo segundo: A instância de caráter consultivo é de responsabilidade do Conselho Fiscal.
            {"\n\n"}
            Art. 3º. A Assembleia será coordenada pelo Presidente ou por alguém indicado pela Diretoria da Entidade.
            {"\n\n"}
            Art. 4º. Os trabalhos nas Assembleias obedecerão à seguinte ordem:I. Discussão e Aprovação da Pauta do dia;II. As decisões serão tomadas, em primeira convocação, pela maioria absoluta dos sócios, ou em segunda convocação, quinze dias após a primeira, pelos que estiverem presentes. De forma que a maioria simples decidirá em nome da Associação. Parágrafo único: Poderão ocorrer votações simbólicas ou nominais, abertas ou secretas, a critério dos presentes.
            {"\n\n"}
            Art. 5º. Para o exercício de suas competências estatutárias, a Assembleia poderá: I. Requisitar informações a qualquer Associado; II. Determinar a continuidade, suspensão ou a conclusão das atividades de interesse da entidade; III. Analisar recursos e pedidos de reconsideração; IV. Peticionar aos órgãos públicos ou privados.
            {"\n\n"}
            Art. 6º. A Diretoria sempre que reunida deliberará sobre questões previamente estabelecidas.
            {"\n\n"}
            Art. 7º. O Conselho fiscal reunir-se-á ordinariamente ou extraordinariamente, conforme determinação do estatuto ou critério de seus integrantes e suas atividades.
            {"\n\n"}
            Art. 8º. Para o exercício de suas funções o conselho fiscal poderá: I. Requerer a qualquer tempo à apresentação dos relatórios, balancetes, extratos e/ou contratos bancários e demais documentos financeiros necessários à elaboração de seu relatório de análise das contas; II. Requerer a participação do presidente executivo, do tesoureiro ou de qualquer outro integrante da diretoria para obter esclarecimentos acerca de omissões, obscuridades ou contradições dos documentos financeiros da associação.
            {"\n\n"}
            <Text style={styles.bold}>Dos Associados</Text>
            {"\n\n"}
            Art. 9º. Os Associados, além de se submeterem a este regimento deverão ter ciência de seus direitos e deveres conforme Estatuto.
            {"\n\n"}
            <Text style={styles.bold}>Do desligamento de associados e membros da diretoria</Text>
            {"\n\n"}
            Art. 10. Os associados e membros da diretoria serão desligados do quadro associativo da AUO mediante: I. Solicitação formal de desligamento, por meio de comunicação escrita e assinada pelo requerente, dirigida ao Presidente; II. Decisão da Diretoria Executiva ou Assembleia Geral, na hipótese de violação do Estatuto Social, deste Regimento Interno, de outras normas e/ou políticas internas, ou, ainda, de atuação contrária aos interesses da entidade; III. Os membros da associação bem como os que fazem parte da diretoria, que tenham concluído o curso, desligar-se-ão mediante decisão da diretoria. Parágrafo único: O desligamento surtirá efeitos a partir da data do recebimento da comunicação pelo Presidente, ou da decisão da Diretoria Executiva ou Assembleia Geral, conforme o caso.
            {"\n\n"}
            <Text style={styles.bold}>Da participação nos projetos</Text>
            {"\n\n"}
            Art. 11. Os projetos são frutos da luta de todo Associado.
            {"\n\n"}
            Art. 12. São considerados beneficiários dos projetos os associados: I. Que estejam rigorosamente em dia com suas obrigações estatutárias e regimentais; II. Que participem da luta na busca pela obtenção dos benefícios. Parágrafo único: A Diretoria fará aprovar regulamento específico de cada projeto conforme determinação do órgão operador, assegurando critérios de transparência, impessoalidade e igualdades entre os beneficiários.
            {"\n\n"}
            <Text style={styles.bold}>Dos critérios de seleção para projetos da AUO</Text>
            {"\n\n"}
            Art. 14. A seleção de demanda para a composição de um projeto conquistado pela Associação deverá ser feita em uma Assembleia Geral. (Nota: O Art. 13 não consta no documento original fornecido).
            {"\n\n"}
            Art. 15. Os critérios para o recrutamento de demanda são os seguintes: I. Tempo e assiduidade da participação nas assembleias, reuniões e demais atividades da Associação; II. Conhecimento específico na área de atuação do projeto; III. Menor renda familiar.
            {"\n\n"}
            Art. 16. Em caso de empate serão utilizados os seguintes critérios:I. Produção Científica;II. Titular chefe de família;III. Idade do(a) titular.
            {"\n\n"}
            <Text style={styles.bold}>Das obrigações</Text>
            {"\n\n"}
            Art. 17. São deveres dos associados: I. Zelar pelo bom nome da AUO, sendo-lhe vetado o uso do nome desta entidade sem a devida autorização; II. Cumprir e fazer cumprir o presente regimento interno, assim como o estatuto e os regulamentos aprovados nas assembleias; III. Contribuir mensalmente junto a tesouraria da associação com a quantia de cinco reais, estando sujeito a alterações; IV. Votar nas eleições da AUO; V. Comunicar à diretoria da AUO, por escrito, o trancamento da matrícula ou desistência da faculdade e solicitar, ou não, o desligamento temporário ou definitivo do quadro social da AUO; VI. Organizar-se em fila, por ordem de chegada, para entrar no transporte universitário; VII. Cumprir com os horários estabelecidos no inciso I do parágrafo primeiro do Art. 19º deste regimento; (Nota: A referência original aponta para o Art. 19, mas a regra de horário está descrita no Art. 20, § 1º, inciso I deste documento). VIII. Manter a ordem e respeitar mutualmente os demais membros da associação; IX. Participar das assembleias da associação; X. Zelar pelo transporte universitário; XI. Na ocorrência de eventuais problemas com o transporte, dar-se a prioridade aos universitários que forem realizar prova, apresentação de trabalhos, ou não puderem mais ter nenhuma falta na disciplina do dia em questão. Fazendo uso do bom senso; XII. Esperar o ônibus nos locais de paradas designados pela diretoria da associação.
            {"\n\n"}
            <Text style={styles.bold}>Dos procedimentos disciplinares</Text>
            {"\n\n"}
            Art. 18. Na hipótese de descumprimentos das obrigações sociais e financeiras definidas nos estatutos, por decisão da Assembleia, da Diretoria, serão iniciados procedimentos disciplinares com o objetivo de apurar o fato determinado e aplicar a sanção adequada.
            {"\n\n"}
            Art. 19. Os procedimentos disciplinares serão conduzidos pela diretoria para apurar a ocorrência de qualquer das infrações mencionadas no Art. 20º.
            {"\n\n"}
            Art. 20. De acordo com a gravidade da infração cometida, poderá o associado vir a sofrer as seguintes sanções: Parágrafo primeiro: Advertência; aplicável às infrações consideradas leves, assim consideradas, sem prejuízo de outros que se possa verificar: I. Ausências e ou atrasos reiterados e injustificados relativos aos horários dos transportes dos universitários, sendo os horários de ida e volta à Quixadá determinados pela diretoria com base no horário de aula de cada instituição, com tolerância de até quinze minutos, na volta, desde que seja comunicado em até vinte e quatro horas de antecedência; II. Bagunça, barulho excessivo e desnecessário, falta de urbanidade para com os demais associados; III. Violação da fila para o transporte;IV. Marcar cadeira no ônibus;V. Sentar sobre o motor do ônibus;VI. Utilização de dispositivos sonoros sem o uso de fone de ouvido;VII. Não cumprimento das regras relacionadas aos locais de parada dos ônibus determinados pela diretoria da AUO.
            {"\n\n"}
            Parágrafo segundo: Suspensão da condição de associado; aplicável às infrações de natureza grave, assim consideradas, sem prejuízo de outros que se possa verificar: I. Reincidência em advertência; II. Agressão física ou verbal; III. Atraso ou não pagamento injustificados da mensalidade, junto a tesouraria da associação; IV. Não zelar pelo transporte universitário.
            {"\n\n"}
            Parágrafo terceiro: Exclusão da condição de associado; aplicável às infrações consideradas graves, assim consideradas, sem prejuízo de outros que se possa verificar: I. Reincidência em suspensão; II. Tentativa ou participação individual ou em conluio destinado a lesar os interesses da associação ou dos demais associados; III. Descumprimento das cláusulas estatutárias ou legais.
            {"\n\n"}
            Art. 21. Após a abertura de procedimento disciplinar, deverá ocorrer comunicação escrita ao associado envolvido, onde conste a infração que lhe é atribuída, o prazo – nunca inferior a 03 dias – e a quem deverá apresentar sua defesa; Parágrafo primeiro: A recusa ao recebimento, a não apresentação de defesa, a apresentação de defesa genérica ou relativa a fato diverso do contido na comunicação, implica em confissão e nos efeitos da revelia;Parágrafo segundo: As decisões serão materializadas em comunicado formal por escrito, que poderão determinar a aplicação ou não da sanção, sua natureza, bem como o prazo de sua vigência. Parágrafo terceiro: As sanções de advertência e suspensão poderão ser aplicadas liminarmente pelo Presidente, cabendo recurso de sua decisão à diretoria ou à primeira assembleia geral subsequente. Parágrafo quarto: A sanção de exclusão poderá ser aplicada pela diretoria, cabendo recurso de sua decisão à diretoria e a primeira assembleia geral subsequente.
            {"\n\n"}
            <Text style={styles.bold}>Do processo eleitoral</Text>
            {"\n\n"}
            Art. 22. A Eleição para a diretoria será convocada pelo Presidente ou seu substituto legal, nos termos do Estatuto, antes do término do mandato da diretoria.
            {"\n\n"}
            Art. 23. A convocação será realizada através de edital e afixada nos pontos onde haja afluência de associados.
            {"\n\n"}
            Art. 24. Concluída a apuração ou processo de votação, a critério da Assembleia poderá dar posse à nova Diretoria.
            {"\n\n"}
            Art. 25. Concluído o processo eleitoral, os resultados deverão ser registrados no livro da Entidade ou em Atas para subsequente registro.
            {"\n\n"}
            Art. 26. O prazo para apresentação de recurso será de até 24 horas após o encerramento da apuração.
            {"\n\n"}
            <Text style={styles.bold}>Disposições gerais</Text>
            {"\n\n"}
            Art. 27. Os casos omissos, controversos e as dúvidas surgidas na aplicação deste Regimento, serão solucionados por deliberação da diretoria, em qualquer de suas reuniões, por maioria absoluta, ou maioria simples em segunda convocação dos membros presentes, da Assembleia Geral subsequente.
          </Text>

        </ScrollView>
      </View>

      <View style={styles.checkboxContainer}>
        <Controller
          control={control}
          name="aceitouTermos"
          render={({ field: { onChange, value } }) => (
            <View style={styles.checkboxRow}>
              <Checkbox
                status={value ? 'checked' : 'unchecked'}
                onPress={() => onChange(!value)}
                color={theme.colors.primary}
              />
              <Text
                variant="bodyMedium"
                style={styles.checkboxLabel}
                onPress={() => onChange(!value)}
              >
                Li e aceito os termos de uso e a política de privacidade
              </Text>
            </View>
          )}
        />
        {errors.aceitouTermos && (
          <Text style={styles.errorText}>{errors.aceitouTermos.message as string}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  intro: {
    color: '#666',
  },
  termsBox: {
    height: 380,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#F5F7FA',
    padding: 16,
  },
  termsScroll: {
    flex: 1,
  },
  termsText: {
    lineHeight: 20,
    color: '#333',
  },
  bold: {
    fontWeight: 'bold',
  },
  checkboxContainer: {
    marginTop: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxLabel: {
    flex: 1,
    color: '#333',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginLeft: 40,
  },
});
