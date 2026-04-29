export default {
  cannotGetChild: `Não foi possível obter o filho '{{childName}}' do atributo {{name}}`,
  cannotImportFilesExceedingQuota:
    'Não é possível importar arquivos de registros: a cota de armazenamento seria excedida',
  cannotInsertFileExceedingQuota: 'Não é possível inserir o arquivo: a cota de armazenamento seria excedida',
  cannotOverridePublishedTaxa: 'Não é possível sobrescrever táxons publicados',
  cantUpdateStep: `Não foi possível atualizar a etapa`,
  chainCannotBeSaved: 'A cadeia é inválida e não pode ser salva',
  csv: {
    emptyHeaderFound: 'Cabeçalho vazio encontrado na coluna {{columnPosition}}',
    emptyHeaders: 'Cabeçalhos vazios encontrados',
  },
  dataExport: {
    excelMaxCellsLimitExceeded: 'Erro ao exportar dados (itens demais). Tente exportar em formato CSV.',
    noRecordsMatchingSearchCriteria: 'Nenhum registro corresponde aos critérios de busca',
  },
  dataImport: {
    importFromMobileNotAllawed: 'Importação de dados do Arena Mobile não permitida',
    noRecordsFound: 'Nenhum registro encontrado no arquivo de importação ou formato de arquivo incorreto',
    recordOwnedByAnotherUser: 'Tentando atualizar um registro de outro usuário',
  },
  entryDataNotFound: 'Dados de entrada não encontrados: {{entryName}}',
  expression: {
    identifierNotFound: '$t(expression.identifierNotFound)',
    undefinedFunction: '$t(expression.undefinedFunction)',
  },
  functionHasTooFewArguments: 'A função {{fnName}} requer no mínimo {{minArity}} (recebido {{numArgs}})',
  functionHasTooManyArguments: 'A função {{fnName}} aceita no máximo {{maxArity}} (recebido {{numArgs}})',
  generic: 'Erro inesperado: {{text}}',
  importingDataIntoWrongCollectSurvey: 'Importando dados no inventário errado. URI esperada: {{collectSurveyUri}}',
  invalidType: 'Tipo inválido {{type}}',
  jobCanceledOrErrorsFound: 'Job cancelado ou erros encontrados; revertendo transação',
  paramIsRequired: 'O parâmetro {{param}} é obrigatório',
  unableToFindParent: 'Não foi possível encontrar o pai de {{name}}',
  unableToFindNode: 'Não foi possível encontrar nó com nome {{name}}',
  unableToFindSibling: 'Não foi possível encontrar irmão com nome {{name}}',
  undefinedFunction: `Função '{{fnName}}' indefinida ou tipos de parâmetros incorretos`,
  invalidSyntax: 'Sintaxe da expressão é inválida',
  networkError: 'Erro de comunicação com o servidor',
  record: {
    errorUpdating: 'Erro ao atualizar registro',
    entityNotFound: 'Entidade "{{entityName}}" com chaves "{{keyValues}}" não encontrada',
    updateSelfAndDependentsDefaultValues:
      '$t(appErrors:record.errorUpdating); erro ao avaliar expressão no nó {{nodeDefName}}: {{details}}',
  },
  sessionExpiredRefreshPage: `A sessão pode ter expirado.
Tente atualizar a página.`,
  survey: {
    nodeDefNameNotFound: 'Definição de nó não encontrada: {{name}}',
  },
  unsupportedFunctionType: 'Tipo de função não suportado: {{exprType}}',
  userHasPendingInvitation: `Já existe um convite pendente para o usuário com email '{{email}}'; ele(a) não pode ser convidado(a) para este inventário até aceitá-lo`,
  userHasRole: 'O usuário informado já possui uma função neste inventário',
  userHasRole_other: 'Os usuários informados já possuem uma função neste inventário',
  userInvalid: 'Usuário inválido',
  userIsAdmin: 'O usuário informado já é administrador do sistema',
  userNotAllowedToChangePref: 'Usuário sem permissão para alterar preferências',
  userNotAuthorized: 'Usuário {{userName}} não está autorizado',
}
