export default {
  authGroups: {
    systemAdmin: {
      label: 'Administrador do sistema',
      label_other: 'Administradores do sistema',
      description: 'Administradores do sistema OF Arena',
    },
    surveyManager: {
      label: 'Gerente de inventário',
      label_other: 'Gerentes de inventário',
      description: 'Gerentes de inventário do OF Arena',
    },
    surveyAdmin: {
      label: 'Administrador de inventário',
      label_other: 'Administradores de inventário',
      description: 'Acesso completo',
    },
    surveyEditor: {
      label: 'Editor de inventário',
      label_other: 'Editores de inventário',
      description: 'Pode editar inventário, registros e convidar usuários',
    },
    dataEditor: {
      label: 'Editor de dados',
      label_other: 'Editores de dados',
      description: 'Pode editar registros na etapa de entrada de dados',
    },
    dataCleanser: {
      label: 'Revisor de dados',
      label_other: 'Revisores de dados',
      description: 'Pode editar registros na etapa de limpeza de dados',
    },
    dataAnalyst: {
      label: 'Analista de dados',
      label_other: 'Analistas de dados',
      description: 'Pode editar registros na etapa de análise de dados',
    },
    surveyGuest: {
      label: 'Convidado do inventário',
      label_other: 'Convidados do inventário',
      description: 'Pode visualizar registros',
    },
  },
}
