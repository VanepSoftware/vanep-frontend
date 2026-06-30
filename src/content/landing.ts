/**
 * Single source of truth for every user-facing string on the landing page.
 * Keep all copy here (pt-BR) so it can be reviewed in one place and, later,
 * swapped for a real i18n setup without touching the components.
 */
export const landing = {
  header: {
    nav: [
      { href: "#problema", label: "O problema" },
      { href: "#para-quem", label: "Para quem" },
      { href: "#diferenciais", label: "Diferenciais" },
      { href: "#como-funciona", label: "Como funciona" }
    ],
    aboutCta: "Sobre"
  },

  hero: {
    badge: "Plataforma de transporte escolar inteligente",
    titleLead: "O sistema operacional do",
    titleHighlight: "transporte escolar",
    description:
      "O Vanep conecta responsáveis a transportadores escolares verificados — com contratos digitais, rastreamento em tempo real e notificações a cada etapa do trajeto. Tranquilidade para a família, gestão completa para o motorista.",
    primaryCta: "Conhecer a plataforma",
    secondaryCta: "Sobre o projeto",
    note: "Em breve para iOS e Android · Painel web para a equipe Vanep"
  },

  stats: [
    { value: "4 fases", label: "de acompanhamento por aluno, em tempo real" },
    { value: "100%", label: "dos contratos digitais e armazenados na plataforma" },
    { value: "1º mês", label: "grátis para o motorista, sem fricção de adoção" },
    { value: "B2C / B2B2C", label: "responsáveis, motoristas e escolas em um só lugar" }
  ],

  problem: {
    eyebrow: "O problema",
    title: "O transporte escolar ainda opera na informalidade.",
    intro:
      "Um mercado pulverizado, com centenas de milhares de motoristas autônomos, sem ferramentas de rastreamento, gestão ou formalização. O Vanep substitui essa informalidade por um ecossistema digital completo para os dois lados.",
    items: [
      {
        title: "Contratação no boca a boca",
        body: "Responsáveis contratam por indicação, sem verificação de idoneidade ou documentação — e sem garantias mínimas de segurança."
      },
      {
        title: "Sem rastreamento",
        body: "Ninguém sabe onde a van está. A comunicação acontece em grupos de WhatsApp, sem histórico nem prova de entrega."
      },
      {
        title: "Contratos físicos",
        body: "Acordos no papel, sem padronização e sem histórico digital — disputas acontecem sem nenhuma evidência."
      },
      {
        title: "Cobrança manual",
        body: "Pagamentos em dinheiro ou transferência direta, sem instrumentos de controle de inadimplência para o motorista."
      }
    ]
  },

  audiences: {
    eyebrow: "Para quem",
    title: "Dois lados do mercado, uma só plataforma.",
    parent: {
      tag: "Para o responsável",
      title: "Tranquilidade do embarque à chegada",
      features: [
        "Encontre motoristas verificados, com documentação validada e avaliações reais.",
        "Contrate com respaldo formal: contrato digital com data, versão e partes registradas.",
        "Acompanhe a van no mapa em tempo real durante toda a rota.",
        "Receba um push a cada etapa: embarque, chegada na escola, volta e chegada em casa.",
        "Pague de forma centralizada, com histórico completo.",
        "Cancele a presença com um toque — o aluno sai da rota e o motorista é avisado."
      ]
    },
    driver: {
      tag: "Para o motorista",
      title: "Um ERP completo para a sua operação",
      features: [
        "Fique visível na busca por rota e escola para todos os responsáveis da plataforma.",
        "Gerencie contratos, alunos, turnos e horários em um único painel.",
        "Reduza a inadimplência com cobrança recorrente gerenciada pela plataforma.",
        "Otimize a rota e exporte as paradas direto para o Waze ou Google Maps.",
        "Controle seus documentos com alertas antecipados de vencimento.",
        "Acompanhe o financeiro: total a receber, cobranças e comissões automáticas."
      ]
    }
  },

  differentials: {
    eyebrow: "Diferenciais",
    title: "Pensado para o dia a dia da rota.",
    checklistTitle: "Checklist de rota com 4 fases por aluno",
    checklistSubtitle:
      "Cada fase dispara uma notificação em tempo real para o responsável.",
    phases: [
      { n: "01", label: "Embarque em casa" },
      { n: "02", label: "Chegada na escola" },
      { n: "03", label: "Embarque na volta" },
      { n: "04", label: "Chegada em casa" }
    ],
    items: [
      {
        title: "Status do motorista automático",
        body: "O status é derivado do próprio fluxo da operação — sem input manual durante a rota."
      },
      {
        title: "Gestão documental com alertas",
        body: "Avisos antecipados de vencimento, vinculados ao bloqueio de novas contratações."
      },
      {
        title: "Modelo alinhado ao sucesso",
        body: "A comissão só é cobrada enquanto há contrato ativo: a Vanep ganha quando o motorista ganha."
      },
      {
        title: "Foco exclusivo no escolar",
        body: "Nada de generalizar para outros mercados. Cada detalhe é pensado para o transporte escolar."
      }
    ]
  },

  howItWorks: {
    eyebrow: "Como funciona",
    title: "Da descoberta à operação diária.",
    steps: [
      {
        n: "1",
        title: "Descubra",
        body: "O responsável busca motoristas verificados por rota ou escola e compara perfis e avaliações."
      },
      {
        n: "2",
        title: "Negocie e contrate",
        body: "Propostas com aceite, recusa ou contraproposta geram um contrato digital formal."
      },
      {
        n: "3",
        title: "Acompanhe",
        body: "Rastreamento em tempo real e notificações a cada uma das quatro fases do trajeto."
      },
      {
        n: "4",
        title: "Pague e gerencie",
        body: "Cobrança recorrente centralizada, com gestão financeira e documental para o motorista."
      }
    ]
  },

  finalCta: {
    title: "O transporte escolar do seu filho, finalmente digital.",
    description:
      "Estamos chegando. Em breve disponível para iOS e Android — segurança para as famílias e gestão completa para os motoristas.",
    cta: "Conheça a história"
  },

  footer: {
    tagline: "Van + App · Transporte escolar inteligente",
    copyright: "Vanep"
  }
} as const;
