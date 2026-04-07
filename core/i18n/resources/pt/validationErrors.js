export default {
  // Common
  invalidEmail: 'Email inválido',
  invalidField: '"{{field}}" é inválido',
  invalidNumber: 'Número inválido',
  invalidDate: 'Data inválida',
  minLengthNotRespected: 'Comprimento mínimo de {{minLength}} caracteres não respeitado',
  nameDuplicate: 'Nome duplicado',
  nameCannotBeKeyword: `O nome "{{value}}" não pode ser usado: é uma palavra reservada`,
  nameInvalid:
    'O nome "{{name}}" é inválido: deve ter no máximo 40 caracteres e conter apenas letras minúsculas, números e os símbolos "-" e "_", começando com uma letra',
  nameRequired: 'Nome é obrigatório',
  requiredField: '{{field}} é obrigatório',
  rowsDuplicate: 'linha: {{row}} linha duplicada: {{duplicateRow}}',

  analysis: {
    labelDefaultLangRequired: 'Rótulo no idioma padrão do inventário é obrigatório',
    analysisNodeDefsRequired: 'Pelo menos um atributo calculado é obrigatório',
  },

  categoryEdit: {
    childrenEmpty: '$t(common.childrenEmpty)',
    childrenInvalid: 'Pelo menos um filho inválido',
    codeCannotBeKeyword: `O código "{{value}}" não pode ser usado: é uma palavra reservada`,
    codeDuplicate: 'Código duplicado',
    codeRequired: 'Código obrigatório',
    itemExtraPropDataTypeRequired: 'Tipo de dado obrigatório para $t(extraProp.label) "{{key}}"',
    itemExtraPropNameInvalid: 'Nome inválido para $t(extraProp.label) "{{key}}"',
    itemExtraPropInvalidNumber: 'Número inválido para $t(extraProp.label) "{{key}}"',
    itemExtraPropInvalidGeometryPoint: 'Ponto geométrico inválido para $t(extraProp.label) "{{key}}"',
    itemsInvalid: 'Pelo menos um item inválido',
    itemsEmpty: 'Defina pelo menos um item',
    levelDuplicate: 'Nome de nível duplicado',
    levelsInvalid: 'Pelo menos um nível inválido',
    nameNotSpecified: 'Nome da categoria não especificado',
  },

  categoryImport: {
    cannotDeleteItemsOfPublishedCategory:
      'Não é possível excluir itens de categoria publicados. Itens ausentes no arquivo importado: {{deletedItemCodes}}',
    cannotDeleteLevelsOfPublishedCategory:
      'Não é possível excluir níveis de categoria publicada. Níveis ausentes no arquivo importado: {{deletedLevelNames}}',
    codeColumnMissing: 'Deve haver pelo menos uma coluna "code"',
    codeRequired: '{{columnName}}: um código é obrigatório',
    codeDuplicate: '{{columnName}}: código duplicado "{{code}}"',
    columnMissing: 'Coluna ausente: {{columnNameMissing}}',
    emptyHeaderFound: 'O arquivo contém um cabeçalho vazio',
    emptyFile: '$t(validationErrors:dataImport.emptyFile)',
    invalidImportFile:
      'O arquivo ZIP deve conter apenas arquivos .csv ou .xlsx (um para cada categoria), sem diretórios',
    invalidParentItemOrder: 'O item com códigos {{parentItemCodes}} deve vir antes de seus filhos',
    nameDuplicate: 'Já existe uma categoria com o mesmo nome: {{name}}',
    srsNotDefined: 'SRS com código {{srs}} não definido no inventário',
  },

  dataImport: {
    emptyFile: 'O arquivo que você está tentando importar está vazio',
    invalidHeaders: 'Colunas inválidas: {{invalidHeaders}}',
    invalidBoolean: 'Valor booleano inválido na coluna {{headers}}: {{value}}',
    invalidCode: `Código inválido para o atributo '{{attributeName}}': {{code}}`,
    invalidCoordinate: 'Coordenada inválida na coluna {{headers}}: {{value}}',
    invalidDate:
      'Data inválida na coluna {{headers}}: {{value}}. As datas devem estar no formato YYYY-MM-DD ou DD/MM/YYYY. Ex.: 2023-01-15 ou 15/01/2023',
    invalidNumber: 'Número inválido na coluna {{headers}}: {{value}}',
    invalidTaxonCode: 'Código inválido na coluna {{headers}}: {{value}}',
    invalidTime:
      'Hora inválida na coluna {{headers}}: {{value}}. A hora deve estar no formato HH:mm. Ex.: 09:45 ou 16:30',
    missingRequiredHeaders: 'Colunas obrigatórias ausentes: {{missingRequiredHeaders}}',
    errorUpdatingValues: 'Erro ao atualizar valores: {{details}}',
    multipleRecordsMatchingKeys: 'Vários registros encontrados com as chaves "{{keyValues}}"',
    recordAlreadyExisting: 'Registro com chaves "{{keyValues}}" já existente',
    recordInAnalysisStepCannotBeUpdated:
      'Registro com chaves "{{keyValues}}" está na etapa Análise e não pode ser atualizado',
    recordKeyMissingOrInvalid: 'Valor ausente ou inválido para o atributo-chave "{{keyName}}"',
    recordNotFound: 'Registro com chaves "{{keyValues}}" não encontrado',
  },

  expressions: {
    cannotGetChildOfAttribute: 'não foi possível obter o nó filho {{childName}} do atributo {{parentName}}',
    cannotUseCurrentNode: 'não é possível usar o nó atual {{name}} nesta expressão',
    circularDependencyError: 'não é possível referenciar o nó {{name}} porque ele referencia o nó atual',
    expressionInvalid: 'Expressão inválida: {{details}}',
    unableToFindNode: 'não foi possível encontrar o nó: {{name}}',
    unableToFindNodeChild: 'não foi possível encontrar o nó filho: {{name}}',
    unableToFindNodeParent: 'não foi possível encontrar o nó pai: {{name}}',
    unableToFindNodeSibling: 'não foi possível encontrar o nó irmão: {{name}}',
  },

  extraPropEdit: {
    nameInvalid: 'Nome inválido',
    nameRequired: 'Nome obrigatório',
    dataTypeRequired: 'Tipo de dado obrigatório',
    valueRequired: 'Valor obrigatório',
  },

  message: {
    bodyRequired: 'O corpo é obrigatório',
    subjectRequired: 'O assunto é obrigatório',
    notificationTypeRequired: 'O tipo de notificação é obrigatório',
    targetsRequired: 'É necessário pelo menos um destino',
  },

  nodeDefEdit: {
    analysisParentEntityRequired: 'Entidade obrigatória',
    applyIfDuplicate: 'A condição "$t(nodeDefEdit.expressionsProp.applyIf)" está duplicada',
    applyIfInvalid: 'Condição "$t(nodeDefEdit.advancedProps.relevantIf)" inválida',
    columnWidthCannotBeGreaterThan: 'A largura da coluna não pode ser maior que {{max}}',
    columnWidthCannotBeLessThan: 'A largura da coluna não pode ser menor que {{min}}',
    countMaxMustBePositiveNumber: 'A contagem máxima deve ser um inteiro positivo',
    countMinMustBePositiveNumber: 'A contagem mínima deve ser um inteiro positivo',
    categoryRequired: 'Categoria obrigatória',
    childrenEmpty: '$t(common.childrenEmpty)',
    defaultValuesInvalid: '"Valores padrão" inválidos',
    defaultValuesNotSpecified: 'Valor padrão não especificado',
    entitySourceRequired: 'Origem da entidade obrigatória',
    expressionApplyIfOnlyLastOneCanBeEmpty:
      'Somente a última expressão pode ter a condição "$t(nodeDefEdit.expressionsProp.applyIf)" vazia',
    expressionDuplicate: 'Expressão duplicada',
    expressionRequired: 'Expressão obrigatória',
    formulaInvalid: 'Fórmula inválida',
    keysEmpty: 'Defina pelo menos um atributo-chave',

    keysExceedingMax: 'Excede o número máximo de atributos-chave',
    maxFileSizeInvalid: 'O tamanho máximo do arquivo deve ser maior que 0 e menor que {{max}}',
    nameInvalid: 'Nome inválido (deve conter apenas letras minúsculas, números e sublinhados, começando com uma letra)',
    taxonomyRequired: 'Taxonomia obrigatória',
    validationsInvalid: '"Validações" inválidas',
    countMaxInvalid: '"Contagem máxima" inválida',
    countMinInvalid: '"Contagem mínima" inválida',
  },

  record: {
    keyDuplicate: 'Chave de registro duplicada',
    entityKeyDuplicate: 'Chave duplicada',
    entityKeyValueNotSpecified: 'Valor da chave para "{{keyDefName}}" não especificado',
    missingAncestorForEntity: 'Não foi possível encontrar "{{ancestorName}}" com estas chaves: {{keyValues}}',
    oneOrMoreInvalidValues: 'Um ou mais valores são inválidos',
    uniqueAttributeDuplicate: 'Valor duplicado',
    valueInvalid: 'Valor inválido',
    valueRequired: 'Valor obrigatório',
  },

  recordClone: {
    differentKeyAttributes: 'Os atributos-chave são diferentes no Ciclo {{cycleFrom}} e no Ciclo {{cycleTo}}',
  },

  surveyInfoEdit: {
    langRequired: 'Idioma obrigatório',
    srsRequired: 'Sistema de Referência Espacial obrigatório',
    cycleRequired: 'Ciclo obrigatório',
    cyclesRequired: 'Pelo menos um ciclo deve ser definido',
    cyclesExceedingMax: 'Um inventário pode ter no máximo 10 ciclos',
    cycleDateStartBeforeDateEnd: 'A data de início do ciclo deve ser anterior à data de término',
    cycleDateStartAfterPrevDateEnd: 'A data de início do ciclo deve ser posterior ao término do ciclo anterior',
    cycleDateStartInvalid: 'Data de início do ciclo inválida',
    cycleDateStartMandatory: 'A data de início do ciclo é obrigatória',
    cycleDateEndInvalid: 'Data de término do ciclo inválida',
    cycleDateEndMandatoryExceptForLastCycle:
      'A data de término do ciclo é obrigatória para todos os ciclos, exceto o último',
    fieldManualLinksInvalid: 'Link do manual de campo inválido',
  },

  surveyLabelsImport: {
    invalidHeaders: 'Colunas inválidas: {{invalidHeaders}}',
    cannotFindNodeDef: "Não foi possível encontrar definição de atributo ou entidade com nome '{{name}}'",
  },

  taxonomyEdit: {
    codeChangedAfterPublishing: `O código publicado foi alterado: '{{oldCode}}' => '{{newCode}}'`,
    codeDuplicate: 'Código duplicado {{value}}; $t(validationErrors:rowsDuplicate)',
    codeRequired: 'Código obrigatório',
    familyRequired: 'Família obrigatória',
    genusRequired: 'Gênero obrigatório',
    scientificNameDuplicate: 'Nome científico duplicado {{value}}; $t(validationErrors:rowsDuplicate)',
    scientificNameRequired: 'Nome científico obrigatório',
    taxaEmpty: 'Táxons vazios',
    vernacularNamesDuplicate: `Nome vernacular duplicado '{{name}}' para o idioma '{{lang}}'`,
  },

  taxonomyImportJob: {
    duplicateExtraPropsColumns: 'Colunas de informação extra duplicadas: {{duplicateColumns}}',
    invalidExtraPropColumn:
      'Nome de coluna de informação extra inválido "{{columnName}}": não pode ser palavra reservada',
    missingRequiredColumns: 'Coluna(s) obrigatória(s) ausente(s): {{columns}}',
  },

  user: {
    emailDuplicate: 'Usuário com o mesmo email já existe',
    emailRequired: 'Email obrigatório',
    emailInvalid: 'Email inválido',
    emailNotFound: 'Email não encontrado',
    groupRequired: 'Grupo obrigatório',
    nameRequired: 'Nome obrigatório',
    titleRequired: 'Título obrigatório',
    passwordRequired: 'Senha obrigatória',
    passwordInvalid: 'A senha não deve conter espaços em branco',
    passwordUnsafe: 'A senha deve ter pelo menos 8 caracteres e conter letras minúsculas, letras maiúsculas e números',
    passwordsDoNotMatch: `As senhas não coincidem`,

    userNotFound: 'Usuário não encontrado. Verifique se email e senha estão corretos',
    passwordChangeRequired: 'Alteração de senha obrigatória',
    passwordResetNotAllowedWithPendingInvitation: `Redefinição de senha não permitida: o usuário foi convidado para um inventário, mas o convite ainda não foi aceito`,
    twoFactorTokenRequired: 'Código de verificação obrigatório',
  },

  userAccessRequest: {
    countryRequired: 'País obrigatório',
    emailRequired: '$t(validationErrors:user.emailRequired)',
    firstNameRequired: 'Nome obrigatório',
    institutionRequired: 'Instituição obrigatória',
    lastNameRequired: 'Sobrenome obrigatório',
    purposeRequired: 'Finalidade obrigatória',
    surveyNameRequired: 'Nome do inventário obrigatório',
    invalidRequest: 'Solicitação de acesso de usuário inválida',
    userAlreadyExisting: 'Usuário com email {{email}} já existe',
    requestAlreadySent: `Solicitação de acesso para o usuário com email {{email}} já enviada`,
    invalidReCaptcha: 'ReCaptcha inválido',
  },

  userAccessRequestAccept: {
    accessRequestAlreadyProcessed: 'Solicitação de acesso de usuário já processada',
    accessRequestNotFound: 'Solicitação de acesso de usuário não encontrada',
    emailRequired: '$t(validationErrors:user.emailRequired)',
    emailInvalid: '$t(validationErrors:user.emailInvalid)',
    roleRequired: 'Papel obrigatório',
    surveyNameRequired: 'Nome do inventário obrigatório',
  },

  userPasswordChange: {
    oldPasswordRequired: 'Senha antiga obrigatória',
    oldPasswordWrong: 'Senha antiga incorreta',
    newPasswordRequired: 'Nova senha obrigatória',
    confirmPasswordRequired: 'Confirmação de senha obrigatória',
    confirmedPasswordNotMatching: 'Nova senha e confirmação de senha não coincidem',
  },

  userInvite: {
    messageContainsLinks: 'A mensagem de convite não pode conter links',
    messageTooLong: 'A mensagem de convite é muito longa (máximo de {{maxLength}} caracteres)',
  },

  user2FADevice: {
    nameDuplicate: 'Já existe dispositivo com o mesmo nome',
    nameRequired: 'Nome do dispositivo obrigatório',
  },
}
