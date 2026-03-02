export default {
  dashboard: {
    activeSurveyNotSelected: `<title>Inventário ativo não selecionado</title>
      <p><label>Selecione um na</label><linkToSurveys>Lista de Inventários</linkToSurveys> ou <linkToNewSurvey>Crie um novo</linkToNewSurvey></p>`,
    activeUsers: 'Usuários ativos',
    activityLog: {
      title: 'Log de atividades',
      size: 'Tamanho do $t(homeView:dashboard.activityLog.title): {{size}}',
    },
    exportWithData: 'Exportar + dados (Backup)',
    exportWithDataNoActivityLog: 'Exportar + dados (SEM log de atividades)',
    exportWithDataNoResultAttributes: 'Exportar + dados (SEM atributos de resultado)',
    surveyPropUpdate: {
      main: `<title>Bem-vindo ao Arena</title>
  
        <p>Primeiro você precisa definir o <strong>nome</strong> e o <strong>rótulo</strong> do inventário.</p>
        
        <p>Clique abaixo em <linkWithIcon>$t(homeView:surveyInfo.editInfo)</linkWithIcon> ou no nome do inventário: <basicLink>{{surveyName}}</basicLink></p>
        `,
      secondary: `
        <p>Se nome e rótulo estiverem corretos, crie o primeiro atributo
        <linkWithIcon>Inventário \u003E Designer do formulário</linkWithIcon>
        </p>
        `,
    },
    nodeDefCreate: {
      main: `<title>Vamos criar o primeiro atributo de {{surveyName}}</title>
        
        <p>Vá para <linkWithIcon>Inventário \u003E Designer do formulário</linkWithIcon></p>
        <br />
        `,
    },
    storageSummary: {
      title: 'Uso de armazenamento',
      availableSpace: 'Disponível ({{size}})',
      usedSpace: 'Usado ({{size}})',
      usedSpaceOutOf: `Usado {{percent}}% ({{used}} de {{total}})`,
    },
    storageSummaryDb: {
      title: 'Uso de armazenamento (Banco de dados)',
    },
    storageSummaryFiles: {
      title: 'Uso de armazenamento (arquivos)',
    },
    samplingPointDataCompletion: {
      title: 'Conclusão de Dados de Pontos Amostrais',
      totalItems: 'Total de itens: {{totalItems}}',
      remainingItems: 'Itens restantes',
    },
    step: {
      entry: 'Entrada de dados',
      cleansing: 'Limpeza de dados',
      analysis: 'Análise de dados',
    },
    recordsByUser: 'Registros por usuário',
    recordsAddedPerUserWithCount: 'Registros adicionados por usuário (Total de {{totalCount}})',
    dailyRecordsByUser: 'Registros diários por usuário',
    totalRecords: 'Total de registros',
    selectUsers: 'Selecionar usuários...',
    noRecordsAddedInSelectedPeriod: 'Nenhum registro adicionado no período selecionado',
  },
  surveyDeleted: 'O inventário {{surveyName}} foi excluído',
  surveyInfo: {
    basic: 'Informações básicas',
    configuration: {
      title: 'Configuração',
      filesTotalSpace: 'Espaço total para arquivos (GB)',
    },
    confirmDeleteCycleHeader: 'Excluir este ciclo?',
    confirmDeleteCycle: `Tem certeza de que deseja excluir o ciclo {{cycle}}?\n\n$t(common.cantUndoWarning)\n\n
Se houver registros associados a este ciclo, eles serão excluídos.`,
    cycleForArenaMobile: 'Ciclo para Arena Mobile',
    deleteActivityLog: 'Limpar log de atividades',
    deleteActivityLogConfirm: {
      headerText: 'Limpar TODOS os dados de log de atividades deste inventário?',
      message: `
  - TODOS os dados de log de atividades do inventário **{{surveyName}}** serão excluídos;\n\n
  - o espaço ocupado no BD pelo inventário será reduzido;\n\n
  - isso não afetará os dados coletados do inventário;\n\n
  
  $t(common.cantUndoWarning)`,
      confirmName: 'Digite o nome deste inventário para confirmar:',
    },
    fieldManualLink: 'Link do manual de campo',
    editInfo: 'Editar informações',
    viewInfo: 'Ver informações',
    preferredLanguage: 'Idioma preferido',
    sampleBasedImageInterpretation: 'Interpretação de imagem baseada em amostra',
    sampleBasedImageInterpretationEnabled: 'Interpretação de imagem baseada em amostra habilitada',
    security: {
      title: 'Segurança',
      dataEditorViewNotOwnedRecordsAllowed: 'Editor de dados pode visualizar registros que não possui',
      visibleInMobile: 'Visível no Arena Mobile',
      allowRecordsDownloadInMobile: 'Permitir download de registros do servidor para o Arena Mobile',
      allowRecordsUploadFromMobile: 'Permitir upload de registros do Arena Mobile para o servidor',
      allowRecordsWithErrorsUploadFromMobile:
        'Permitir upload de registros com erros de validação do Arena Mobile para o servidor',
    },
    srsPlaceholder: 'Digite código ou rótulo',
    unpublish: 'Despublicar e excluir dados',
    unpublishSurveyDialog: {
      confirmUnpublish: 'Tem certeza de que deseja despublicar este inventário?',
      unpublishWarning: `Despublicar o inventário **{{surveyName}}** excluirá todos os seus dados.\n\n
  
  $t(common.cantUndoWarning)`,
      confirmName: 'Digite o nome deste inventário para confirmar:',
    },
    userExtraProps: {
      title: 'Propriedades extras do usuário',
      info: `Propriedades extras que podem ser atribuídas a cada usuário associado ao inventário.  
Essas propriedades podem ser usadas em valores padrão, regras de validação e expressões de aplicabilidade.  
Ex.: *userProp('property_name') == 'some_value'*`,
    },
  },
  deleteSurveyDialog: {
    confirmDelete: 'Tem certeza de que deseja excluir este inventário?',
    deleteWarning: `Excluir o inventário **{{surveyName}}** apagará todos os seus dados.\n\n

$t(common.cantUndoWarning)`,
    confirmName: 'Digite o nome deste inventário para confirmar:',
  },
  surveyList: {
    active: '$t(common.active)',
    activate: 'Ativar',
  },
  collectImportReport: {
    excludeResolvedItems: 'Excluir itens resolvidos',
    expression: 'Expressão',
    resolved: 'Resolvido',
    exprType: {
      applicable: '$t(nodeDefEdit.advancedProps.relevantIf)',
      codeParent: 'Código pai',
      defaultValue: 'Valor padrão',
      validationRule: 'Regra de validação',
    },
    title: 'Relatório de Importação do Collect',
  },
  recordsSummary: {
    recordsAddedInTheLast: 'Registros adicionados nos últimos:',
    fromToPeriod: 'de {{from}} até {{to}}',
    record: '{{count}} Registro',
    record_other: '{{count}} Registros',
    week: '{{count}} Semana',
    week_other: '{{count}} Semanas',
    month: '{{count}} Mês',
    month_other: '{{count}} Meses',
    year: '{{count}} Ano',
    year_other: '{{count}} Anos',
  },
}
