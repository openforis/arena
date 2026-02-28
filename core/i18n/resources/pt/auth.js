export default {
  authGroups: {
    systemAdmin: {
      label: 'Administrador do sistema',
      label_plural: 'Administradores do sistema',
      description: 'Administradores do sistema OF Arena',
    },
    surveyManager: {
      label: 'Gerente de inventário',
      label_plural: 'Gerentes de inventário',
      description: 'Gerentes de inventário do OF Arena',
    },
    surveyAdmin: {
      label: 'Administrador de inventário',
      label_plural: 'Administradores de inventário',
      description: 'Acesso completo',
    },
    surveyEditor: {
      label: 'Editor de inventário',
      label_plural: 'Editores de inventário',
      description: 'Pode editar inventário, registros e convidar usuários',
    },
    dataEditor: {
      label: 'Editor de dados',
      label_plural: 'Editores de dados',
      description: 'Pode editar registros na etapa de entrada de dados',
    },
    dataCleanser: {
      label: 'Revisor de dados',
      label_plural: 'Revisores de dados',
      description: 'Pode editar registros na etapa de limpeza de dados',
    },
    dataAnalyst: {
      label: 'Analista de dados',
      label_plural: 'Analistas de dados',
      description: 'Pode editar registros na etapa de análise de dados',
    },
    surveyGuest: {
      label: 'Convidado do inventário',
      label_plural: 'Convidados do inventário',
      description: 'Pode visualizar registros',
    },
  },
}
