/**
 * Textos da Política de Privacidade e dos Termos de Uso.
 *
 * Os dados citados aqui refletem o que a API e o app realmente coletam. Ao
 * adicionar um dado pessoal novo no produto, atualize a política e a data
 * `lastUpdated` no mesmo PR.
 */

export type LegalSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  items?: string[];
  /** Parágrafos exibidos depois da lista. */
  closing?: string[];
};

export type LegalDocument = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  lastUpdatedLabel: string;
  lastUpdated: string;
  intro: string;
  tocLabel: string;
  sections: LegalSection[];
};

const privacy: LegalDocument = {
  metaTitle: "Política de Privacidade",
  metaDescription:
    "Como o Vanep coleta, usa, compartilha e protege os dados pessoais de famílias, motoristas e auxiliares.",
  eyebrow: "Privacidade",
  title: "Política de Privacidade",
  lastUpdatedLabel: "Última atualização",
  lastUpdated: "21 de novembro de 2026",
  intro:
    "Esta política explica quais dados pessoais o Vanep coleta, por que coleta, com quem compartilha e quais são os seus direitos. Ela vale para o aplicativo Vanep (Android e iOS), para o site e para a API que atende os dois. Ela segue a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).",
  tocLabel: "Nesta página",
  sections: [
    {
      id: "quem-somos",
      title: "1. Quem somos",
      paragraphs: [
        "O Vanep é uma plataforma que conecta famílias e motoristas de transporte escolar. Pelo app, o responsável encontra um motorista, fecha o contrato e acompanha a rotina da van; o motorista organiza alunos, rotas, documentos e recebimentos.",
        "Para os dados tratados na plataforma, o Vanep é o controlador, nos termos da LGPD. Os dados de contato do controlador e do encarregado estão na seção “Contato”.",
      ],
    },
    {
      id: "dados-coletados",
      title: "2. Dados que coletamos",
      paragraphs: ["Coletamos apenas o necessário para o serviço funcionar:"],
      items: [
        "Cadastro: nome, e-mail, nome de usuário, CPF, data de nascimento, gênero, telefone e senha (guardada apenas como hash, nunca em texto).",
        "Login com Google: quando você escolhe “Entrar com Google”, recebemos do Google seu nome, e-mail, a confirmação de que o e-mail é verificado e um identificador da sua conta Google. Não recebemos sua senha do Google.",
        "Endereço: rua, número, complemento, bairro, cidade, CEP e o identificador do lugar no Google, usados para encontrar motoristas que atendem a sua região e montar rotas.",
        "Dependentes (alunos): nome, data de nascimento, gênero, CPF, telefone e e-mail opcionais, escola, endereço de embarque e dias e turnos de aula.",
        "Motoristas: foto, dados da CNH (número de registro, categoria, datas de emissão e validade, UF emissora e foto do documento), documentos enviados para verificação, anos de experiência, área de atendimento, horários e preço base.",
        "Veículos: placa, marca, modelo, ano, cor, capacidade, fotos do veículo e do documento do veículo.",
        "Auxiliares: dados de cadastro, foto e o motorista ao qual a pessoa está vinculada.",
        "Uso do serviço: propostas, contratos (vigência, valor, parcelas e vencimento), viagens (data, turno, início e fim), mensagens trocadas no chat do app e avaliações entre famílias e motoristas.",
        "Fotos e arquivos que você envia: foto de perfil, fotos de documentos e de veículos.",
        "Dados técnicos e de segurança: data do último login, tentativas de login, data de aceite dos termos e registros técnicos necessários para proteger a conta e investigar abusos.",
      ],
    },
    {
      id: "finalidades",
      title: "3. Para que usamos os dados",
      items: [
        "Criar e manter a sua conta e autenticar você, inclusive pelo login com Google.",
        "Conectar famílias e motoristas: mostrar motoristas que atendem o endereço e a escola do aluno e permitir propostas, contratos e conversas.",
        "Verificar motoristas e veículos (CNH, documentos e fotos) antes de liberar o perfil para as famílias, por segurança dos alunos.",
        "Operar a rotina do transporte: lista de alunos, viagens do dia e avisos para a família.",
        "Enviar e-mails do serviço, como código de verificação, redefinição de senha, convites e avisos sobre propostas e contratos.",
        "Prevenir fraudes, proteger contas e cumprir obrigações legais.",
        "Melhorar o produto a partir de dados agregados, sem identificar você.",
      ],
      closing: [
        "Não vendemos dados pessoais e não os usamos para publicidade de terceiros.",
      ],
    },
    {
      id: "bases-legais",
      title: "4. Bases legais",
      paragraphs: [
        "Tratamos dados com base na execução do contrato com você (art. 7º, V, da LGPD), no cumprimento de obrigação legal ou regulatória (art. 7º, II), no legítimo interesse de manter a plataforma segura (art. 7º, IX) e, quando exigido, no seu consentimento (art. 7º, I).",
        "Os dados de crianças e adolescentes são tratados sempre no melhor interesse deles (art. 14 da LGPD), com base nas mesmas hipóteses legais acima, como permite o Enunciado CD/ANPD nº 1/2023 — principalmente a execução do contrato de transporte escolar que o responsável legal firma em favor do aluno. Usamos apenas os dados necessários para que o aluno seja transportado com segurança.",
      ],
    },
    {
      id: "dados-google",
      title: "5. Dados da sua conta Google",
      paragraphs: [
        "Ao usar o login com Google, pedimos apenas os escopos básicos de identificação: openid, email e profile. Usamos esses dados somente para criar a sua conta, fazer login e mostrar seu nome e e-mail no app.",
        "Não acessamos Gmail, Drive, contatos, agenda nem qualquer outro dado da sua conta Google. Não vendemos, não transferimos para terceiros e não usamos dados recebidos do Google para publicidade. O uso desses dados segue a Política de Dados do Usuário dos Serviços de API do Google, incluindo os requisitos de Uso Limitado.",
        "Você pode remover o acesso do Vanep à sua conta Google a qualquer momento em myaccount.google.com/permissions.",
      ],
    },
    {
      id: "compartilhamento",
      title: "6. Com quem compartilhamos",
      items: [
        "Entre usuários da plataforma, no limite do necessário: a família vê o perfil, as avaliações e o veículo do motorista; o motorista e seus auxiliares veem os dados dos alunos que transportam, como nome, escola, endereço de embarque e horários.",
        "Google: para login com Google e para busca de endereços e escolas (Google Places).",
        "Prestadores de infraestrutura que trabalham para o Vanep, como hospedagem, armazenamento de arquivos e envio de e-mail, sempre sob contrato e apenas para executar o serviço.",
        "Autoridades públicas, quando houver obrigação legal ou ordem judicial.",
      ],
      closing: [
        "Alguns desses prestadores podem guardar dados fora do Brasil. Nesses casos, a transferência segue os artigos 33 a 36 da LGPD.",
      ],
    },
    {
      id: "retencao",
      title: "7. Por quanto tempo guardamos",
      paragraphs: [
        "Guardamos os dados enquanto a sua conta estiver ativa. Quando você pede a exclusão, apagamos ou anonimizamos os dados, exceto os que precisamos manter por obrigação legal ou para exercer direitos em processos — por exemplo, registros de acesso por 6 meses (Marco Civil da Internet, art. 15) e dados de contratos pelo prazo legal.",
        "Códigos de verificação e de redefinição de senha expiram automaticamente em poucas horas ou minutos.",
      ],
    },
    {
      id: "seguranca",
      title: "8. Segurança",
      items: [
        "Comunicação criptografada (HTTPS) entre o app, o site e a API.",
        "Senhas guardadas apenas como hash e tokens de sessão guardados no armazenamento seguro do celular.",
        "Login por OAuth 2.0 com PKCE, tokens de acesso de curta duração e revogação ao sair.",
        "Acesso aos dados restrito por perfil e permissão, e bloqueio após tentativas de login repetidas.",
      ],
      closing: [
        "Nenhum sistema é 100% seguro. Se acontecer um incidente que possa causar risco ou dano relevante, avisaremos você e a ANPD conforme a LGPD.",
      ],
    },
    {
      id: "direitos",
      title: "9. Seus direitos",
      paragraphs: ["Pela LGPD (art. 18), você pode pedir a qualquer momento:"],
      items: [
        "Confirmação de que tratamos seus dados e acesso a eles.",
        "Correção de dados incompletos, inexatos ou desatualizados — boa parte você já edita no próprio app.",
        "Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desacordo com a lei.",
        "Portabilidade dos dados.",
        "Eliminação dos dados tratados com consentimento e revogação do consentimento.",
        "Informação sobre com quem compartilhamos seus dados.",
        "Exclusão da conta e dos dados associados.",
      ],
    },
    {
      id: "exclusao",
      title: "10. Como excluir sua conta",
      paragraphs: [
        "Você pode pedir a exclusão da sua conta do app Vanep a qualquer momento, sem precisar do app instalado. O passo a passo está na página www.vanep.com.br/excluir-conta. Concluímos o pedido em até 15 dias.",
        "Ao excluir a conta, apagamos ou anonimizamos o seu cadastro, endereços, dependentes, fotos, documentos, mensagens e o vínculo com a sua conta Google. Guardamos apenas o que a lei exige ou permite, de forma bloqueada e só pelo prazo necessário:",
      ],
      items: [
        "Registros de acesso ao app: 6 meses (Marco Civil da Internet, art. 15).",
        "Contratos e dados necessários para obrigações fiscais e legais: pelo prazo legal aplicável.",
        "Dados necessários para exercer ou defender direitos em processos, investigações ou fraudes: até o fim do processo ou do prazo de prescrição.",
      ],
    },
    {
      id: "criancas",
      title: "11. Crianças e adolescentes",
      paragraphs: [
        "O app é usado por adultos: responsáveis, motoristas e auxiliares. Crianças não criam contas. Os dados de alunos são cadastrados pelo responsável legal, que consente com o tratamento ao cadastrar o dependente. Esses dados são usados apenas para o transporte escolar e mostrados somente ao motorista e aos auxiliares contratados.",
      ],
    },
    {
      id: "cookies",
      title: "12. Cookies",
      paragraphs: [
        "O site usa apenas cookies essenciais para manter a sua sessão quando você faz login. Não usamos cookies de publicidade nem de rastreamento de terceiros.",
      ],
    },
    {
      id: "alteracoes",
      title: "13. Mudanças nesta política",
      paragraphs: [
        "Podemos atualizar esta política quando o produto mudar. A data de “Última atualização” no topo sempre mostra a versão vigente. Se a mudança for relevante, avisaremos você pelo app ou por e-mail.",
      ],
    },
    {
      id: "contato",
      title: "14. Contato e encarregado (DPO)",
      paragraphs: [
        "Para dúvidas, pedidos sobre os seus dados ou exclusão de conta, use o canal de comunicação do encarregado pelo tratamento de dados pessoais do Vanep. O mesmo canal atende a Autoridade Nacional de Proteção de Dados (ANPD).",
      ],
    },
  ],
};

const terms: LegalDocument = {
  metaTitle: "Termos de Uso",
  metaDescription:
    "Regras de uso do aplicativo e do site Vanep para famílias, motoristas e auxiliares.",
  eyebrow: "Termos",
  title: "Termos de Uso",
  lastUpdatedLabel: "Última atualização",
  lastUpdated: "21 de novembro de 2026",
  intro:
    "Estes termos regulam o uso do aplicativo Vanep, do site e da API. Ao criar uma conta ou usar o serviço, você concorda com eles e com a Política de Privacidade.",
  tocLabel: "Nesta página",
  sections: [
    {
      id: "servico",
      title: "1. O que é o Vanep",
      paragraphs: [
        "O Vanep é uma plataforma de tecnologia que aproxima famílias e motoristas de transporte escolar e oferece ferramentas para busca, propostas, contratos, comunicação e organização da rotina.",
        "O Vanep não presta serviço de transporte, não é empresa de transporte, não emprega nem contrata os motoristas e não é representante, agente ou preposto de nenhum usuário. Motoristas e auxiliares atuam de forma independente: não existe vínculo empregatício, sociedade, parceria ou representação entre eles e o Vanep. O transporte é contratado diretamente entre a família e o motorista, que é o único responsável por executá-lo.",
      ],
    },
    {
      id: "aceite",
      title: "2. Aceite destes termos",
      paragraphs: [
        "Ao criar uma conta, entrar com Google ou usar o app, você declara que leu e aceita estes termos e a Política de Privacidade. Registramos a data do aceite. Se não concordar, não use o serviço.",
      ],
    },
    {
      id: "conta",
      title: "3. Conta e cadastro",
      items: [
        "Para criar uma conta você precisa ter pelo menos 18 anos, ser civilmente capaz e informar dados verdadeiros, completos e atualizados. Você responde civil e criminalmente pelas informações que fornece.",
        "A conta é pessoal e intransferível. Você é responsável por manter em segredo a senha e o acesso ao seu e-mail e à sua conta Google, e responde por tudo o que for feito com o seu login.",
        "Você é responsável pela segurança do seu celular, do sistema operacional e da sua conexão com a internet.",
        "Avise-nos imediatamente se suspeitar de uso indevido da sua conta. Até o aviso, os atos feitos com o seu login são considerados seus.",
        "Podemos recusar ou cancelar cadastros com dados falsos, incompletos ou que não possam ser confirmados.",
      ],
    },
    {
      id: "verificacao",
      title: "4. Verificação de motoristas não é garantia",
      paragraphs: [
        "O Vanep confere documentos e informações enviados pelos motoristas antes de liberar o perfil. Essa verificação depende dos documentos apresentados e das bases disponíveis no momento e não é uma garantia sobre a conduta, a habilidade, a pontualidade ou a idoneidade de nenhum motorista ou auxiliar.",
        "A escolha do motorista é da família. Recomendamos conferir pessoalmente a documentação, o veículo e a autorização municipal antes de contratar e acompanhar o serviço regularmente.",
      ],
    },
    {
      id: "familias",
      title: "5. Responsabilidades da família",
      items: [
        "Cadastrar apenas dependentes pelos quais você é responsável legal e manter os dados deles corretos.",
        "Combinar com o motorista horários, endereços e regras do transporte e cumprir o contrato firmado, inclusive os pagamentos.",
        "Avaliar motoristas de forma honesta e respeitosa, com base na sua experiência real.",
        "Escolher o motorista, conferir a documentação dele e decidir pela contratação. Essa decisão é sua.",
        "Informar ao motorista, por conta própria, condições de saúde, alergias, necessidades especiais e as pessoas autorizadas a receber o aluno. O Vanep não repassa essas informações por você.",
        "Garantir que o aluno esteja no ponto de embarque no horário combinado e que alguém autorizado esteja no desembarque.",
      ],
    },
    {
      id: "motoristas",
      title: "6. Responsabilidades do motorista e do auxiliar",
      items: [
        "Cumprir os requisitos para conduzir escolares dos arts. 136 a 139 do Código de Trânsito Brasileiro, como ter mais de 21 anos, CNH na categoria D, curso especializado e a autorização do Detran afixada no veículo, além das licenças, seguros e vistorias exigidos pelo município. Manter tudo isso válido é responsabilidade exclusiva do motorista.",
        "Enviar documentos e fotos verdadeiros e mantê-los atualizados. O perfil só aparece para as famílias depois da verificação.",
        "Manter o veículo em condições seguras, com os equipamentos obrigatórios, dentro da capacidade informada e coberto pelos seguros exigidos, como o de acidentes pessoais de passageiros quando o município exigir.",
        "Responder integral e exclusivamente pela execução do transporte, pela segurança dos alunos durante o trajeto e pelas obrigações trabalhistas, tributárias e previdenciárias da sua atividade.",
        "Usar os dados dos alunos apenas para executar o transporte, sem compartilhá-los com terceiros.",
        "O motorista responde pelos atos dos auxiliares que convida para a conta.",
      ],
    },
    {
      id: "contratos",
      title: "7. Propostas, contratos e pagamentos",
      paragraphs: [
        "As propostas e contratos criados no app registram o que foi combinado entre a família e o motorista, como período, valor e parcelas. As obrigações do contrato são exclusivamente das partes que o assinaram. O Vanep guarda o registro e oferece as ferramentas, mas não é parte, fiador nem garantidor do contrato de transporte.",
        "O Vanep não responde por inadimplência, cobranças, reembolsos, multas, cancelamentos ou quaisquer valores combinados ou pagos entre família e motorista, inclusive pagamentos feitos fora do app.",
      ],
    },
    {
      id: "emergencias",
      title: "8. Emergências e informações em tempo real",
      paragraphs: [
        "O Vanep não é um serviço de emergência. Em caso de acidente, mal-estar ou risco a qualquer pessoa, ligue imediatamente para 190 (Polícia), 192 (SAMU) ou 193 (Bombeiros).",
        "Horários, avisos, status de viagem e outras informações exibidas no app dependem de dados enviados pelos usuários, da conexão do celular e de serviços de terceiros, e podem ter atrasos ou imprecisões. Não use o app como única forma de acompanhar a segurança de uma criança.",
      ],
    },
    {
      id: "conduta",
      title: "9. Uso proibido",
      paragraphs: ["Ao usar o Vanep, você não pode:"],
      items: [
        "Fornecer dados ou documentos falsos ou se passar por outra pessoa.",
        "Usar a plataforma para assédio, discriminação, ameaças, golpes ou qualquer atividade ou conteúdo ilegal.",
        "Coletar, copiar ou usar dados de outros usuários fora do uso normal do app.",
        "Tentar burlar a segurança, acessar contas de terceiros, sobrecarregar, copiar ou fazer engenharia reversa do serviço, ou usar robôs e automações não autorizadas.",
        "Usar o app para oferecer serviços diferentes do transporte escolar ou para fins comerciais não autorizados.",
        "Emprestar, compartilhar, vender ou permitir que outra pessoa use a sua conta.",
      ],
      closing: [
        "Qualquer uso do app em desacordo com estes termos ou com a lei é de responsabilidade exclusiva de quem o praticou. Nesses casos, o Vanep pode remover conteúdo, suspender ou encerrar a conta, preservar registros e comunicar as autoridades, sem que essas medidas gerem direito a indenização para quem deu causa a elas.",
      ],
    },
    {
      id: "conteudo",
      title: "10. Conteúdo que você envia",
      paragraphs: [
        "Você continua dono das fotos, mensagens e avaliações que envia e é o único responsável por elas. Para o serviço funcionar, você autoriza o Vanep, de forma gratuita e enquanto a conta existir, a armazenar e mostrar esse conteúdo às pessoas envolvidas, conforme a Política de Privacidade.",
        "Avaliações e mensagens representam a opinião de quem as escreveu, não do Vanep. O Vanep não revisa previamente o conteúdo dos usuários, mas pode remover, sem aviso, o que violar estes termos ou a lei, observado o Marco Civil da Internet.",
      ],
    },
    {
      id: "propriedade",
      title: "11. Propriedade intelectual",
      paragraphs: [
        "A marca Vanep, o app, o site, o código, o design e os textos pertencem ao Vanep. Estes termos dão a você apenas uma licença pessoal, limitada, não exclusiva e revogável para usar o app conforme estas regras. É proibido copiar, modificar ou explorar comercialmente qualquer parte do serviço sem autorização por escrito.",
      ],
    },
    {
      id: "terceiros",
      title: "12. Serviços de terceiros",
      paragraphs: [
        "O app usa serviços de terceiros, como o login com Google, a busca de endereços do Google e as lojas de aplicativos. O uso desses serviços também segue os termos de cada fornecedor, e o Vanep não responde por falhas, indisponibilidade ou mudanças neles.",
      ],
    },
    {
      id: "suspensao",
      title: "13. Suspensão e encerramento",
      paragraphs: [
        "Podemos suspender ou encerrar contas que violem estes termos, coloquem alunos ou outras pessoas em risco, apresentem documentos irregulares ou sejam usadas para fraude, de forma imediata e sem aviso prévio quando houver risco. Também podemos colaborar com autoridades e guardar as informações necessárias para isso.",
        "Você pode encerrar a sua conta a qualquer momento, como explicado na Política de Privacidade. O encerramento não apaga obrigações já assumidas entre família e motorista.",
      ],
    },
    {
      id: "disponibilidade",
      title: "14. Disponibilidade do serviço",
      paragraphs: [
        "O serviço é oferecido no estado em que se encontra e conforme disponível. Trabalhamos para mantê-lo funcionando, mas ele pode ter interrupções, falhas, manutenções e mudanças, e não garantimos que funcione em todos os celulares, versões de sistema ou conexões. Podemos alterar, suspender ou descontinuar funcionalidades a qualquer momento, avisando com antecedência razoável quando a mudança afetar você de forma relevante.",
      ],
    },
    {
      id: "responsabilidade",
      title: "15. Limitação de responsabilidade",
      paragraphs: ["Na máxima extensão permitida pela lei, o Vanep não responde por:"],
      items: [
        "Atos, omissões, condutas ou declarações de famílias, motoristas, auxiliares ou quaisquer terceiros, dentro ou fora do app.",
        "A execução do transporte, incluindo acidentes, atrasos, faltas, danos a pessoas ou bens, extravio de objetos e qualquer ocorrência durante o trajeto, que são de responsabilidade do motorista.",
        "Acordos, valores e pagamentos combinados entre família e motorista.",
        "Mau uso do app: danos causados pelo uso em desacordo com estes termos ou com a lei, por informações ou documentos falsos fornecidos por usuários, ou por culpa exclusiva do usuário ou de terceiros, como senha compartilhada, conta emprestada ou celular perdido, roubado ou invadido.",
        "Decisões tomadas com base em perfis, avaliações, mensagens ou outras informações publicadas por usuários.",
        "Contatos, encontros, combinados e negociações feitos fora do app, inclusive por telefone ou mensageiros de terceiros.",
        "Falhas de internet, do celular ou de serviços de terceiros, caso fortuito ou força maior.",
        "Lucros cessantes, perda de oportunidade ou outros danos indiretos.",
      ],
      closing: [
        "Para usuários que usam o Vanep na sua atividade profissional, como motoristas e auxiliares, e que por isso não são consumidores nessa relação, a responsabilidade total do Vanep fica limitada ao valor pago por esse usuário ao Vanep nos 12 meses anteriores ao fato.",
        "Estas limitações não se aplicam a danos causados por dolo ou culpa grave do Vanep e não afastam direitos que a lei não permite afastar, como os garantidos pelo Código de Defesa do Consumidor e pela LGPD.",
      ],
    },
    {
      id: "indenizacao",
      title: "16. Indenização",
      paragraphs: [
        "Você se compromete a ressarcir o Vanep por prejuízos, multas, condenações, custos e honorários advocatícios decorrentes do seu descumprimento destes termos, da lei ou de direitos de terceiros, ou do conteúdo que você enviou, inclusive em processos movidos por outros usuários ou por autoridades.",
      ],
    },
    {
      id: "alteracoes",
      title: "17. Mudanças nestes termos",
      paragraphs: [
        "Podemos atualizar estes termos. A data de “Última atualização” mostra a versão vigente. Mudanças relevantes entram em vigor 10 dias depois de publicadas, e avisaremos você pelo app ou por e-mail. Continuar usando o serviço depois desse prazo significa aceitar a nova versão; se não concordar, você pode encerrar a sua conta.",
      ],
    },
    {
      id: "gerais",
      title: "18. Disposições gerais",
      items: [
        "Se alguma cláusula for considerada inválida, as demais continuam valendo.",
        "Se o Vanep deixar de exigir algum direito previsto aqui, isso não significa renúncia a ele.",
        "Avisos e comunicações enviados pelo app ou para o e-mail cadastrado são considerados recebidos. Mantenha o seu e-mail atualizado.",
        "Os registros eletrônicos do Vanep, como data de aceite, logs de acesso, mensagens e histórico de contratos, podem ser usados como prova.",
        "Você não pode transferir a sua conta ou estes termos a outra pessoa. O Vanep pode transferi-los em caso de reorganização, venda ou fusão, mantidas as garantias da Política de Privacidade.",
      ],
    },
    {
      id: "lei",
      title: "19. Solução de conflitos, lei aplicável e foro",
      paragraphs: [
        "Se tiver qualquer problema, fale primeiro com a gente pelo e-mail da seção “Contato”: a maioria dos casos se resolve mais rápido assim. Você também pode registrar a sua reclamação na plataforma pública consumidor.gov.br.",
        "Estes termos seguem as leis brasileiras. Para usuários consumidores, fica eleito o foro do seu domicílio. Nos demais casos, fica eleito o foro do domicílio do controlador indicado na seção “Contato”.",
      ],
    },
    {
      id: "contato",
      title: "20. Contato",
      paragraphs: ["Dúvidas sobre estes termos podem ser enviadas para:"],
    },
  ],
};

const accountDeletion: LegalDocument = {
  metaTitle: "Excluir conta",
  metaDescription:
    "Como pedir a exclusão da sua conta do app Vanep e dos dados associados a ela.",
  eyebrow: "Sua conta",
  title: "Excluir conta do Vanep",
  lastUpdatedLabel: "Última atualização",
  lastUpdated: "21 de novembro de 2026",
  intro:
    "Esta página explica como pedir a exclusão da sua conta do aplicativo Vanep, desenvolvido pela equipe Vanep, e o que acontece com os seus dados. Você não precisa ter o app instalado.",
  tocLabel: "Nesta página",
  sections: [
    {
      id: "como-pedir",
      title: "1. Como pedir",
      items: [
        "Envie um e-mail para o endereço indicado em “Contato”, abaixo, a partir do e-mail cadastrado na sua conta Vanep.",
        "No assunto, escreva “Excluir minha conta Vanep”.",
        "No texto, informe o seu nome e se a conta é de família, motorista ou auxiliar.",
        "Se você entra com Google, use o e-mail da conta Google que você usa no Vanep.",
      ],
      closing: [
        "Se não for possível escrever do e-mail cadastrado, podemos pedir uma confirmação de identidade antes de excluir, para que ninguém apague a sua conta no seu lugar.",
      ],
    },
    {
      id: "prazo",
      title: "2. Prazo",
      paragraphs: [
        "Confirmamos o recebimento e concluímos a exclusão em até 15 dias. Se houver um contrato de transporte em andamento, avisamos você antes, porque a exclusão encerra o acesso ao histórico desse contrato no app.",
      ],
    },
    {
      id: "dados-apagados",
      title: "3. Dados que apagamos",
      items: [
        "Cadastro: nome, e-mail, telefone, CPF, data de nascimento e senha.",
        "Endereços, dependentes (alunos) e as informações de escola e horários.",
        "Fotos, documentos, dados da CNH e do veículo.",
        "Mensagens, avaliações feitas por você e o vínculo com a sua conta Google.",
      ],
    },
    {
      id: "dados-mantidos",
      title: "4. Dados que guardamos por obrigação legal",
      paragraphs: [
        "Alguns dados ficam guardados de forma bloqueada, sem uso no app, apenas pelo prazo exigido ou permitido por lei e depois são apagados:",
      ],
      items: [
        "Registros de acesso ao app: 6 meses (Marco Civil da Internet, art. 15).",
        "Contratos e dados necessários para obrigações fiscais e legais: pelo prazo legal aplicável.",
        "Dados necessários para exercer ou defender direitos em processos, investigações ou casos de fraude: até o fim do processo ou do prazo de prescrição.",
      ],
      closing: [
        "Mais detalhes estão na Política de Privacidade.",
      ],
    },
    {
      id: "contato",
      title: "5. Contato",
      paragraphs: ["Envie o pedido de exclusão para:"],
    },
  ],
};

const legal = {
  privacy,
  terms,
  accountDeletion,
  contactEmailLabel: "E-mail",
  controllerLabel: "Controlador",
  documentLabel: "CNPJ",
  contactPending:
    "O canal de contato será publicado aqui em breve. Enquanto isso, fale com a gente pelo próprio app.",
  privacyLink: "Política de Privacidade",
  termsLink: "Termos de Uso",
  accountDeletionLink: "Excluir conta",
  back: "← Voltar para o início",
};

export default legal;
