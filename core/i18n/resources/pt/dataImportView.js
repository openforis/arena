export default {
  confirmDeleteAllRecords: 'Excluir todos os registros antes da importação?',
  confirmDeleteAllRecordsInCycle: 'Excluir todos os registros do ciclo {{cycle}} antes da importação?',
  conflictResolutionStrategy: {
    label: 'Estratégia de resolução de conflitos',
    info: 'O que fazer caso o mesmo registro (ou um registro com os mesmos atributos-chave) seja encontrado',
    skipExisting: 'Ignorar se já existir',
    overwriteIfUpdated: 'Sobrescrever se atualizado',
    merge: 'Mesclar registros',
  },
  deleteAllRecordsBeforeImport: 'Exclua todos os registros antes de importar',
  downloadAllTemplates: 'Baixe todos os modelos',
  downloadAllTemplates_csv: 'Baixe todos os modelos (CSV)',
  downloadAllTemplates_xlsx: 'Baixe todos os modelos (Excel)',
  downloadTemplate: 'Baixar modelo',
  downloadTemplate_csv: 'Baixar modelo (CSV)',
  downloadTemplate_xlsx: 'Baixar modelo (Excel)',
  errors: {
    rowNum: 'Linha #',
  },
  fileUploadChunkSize: {
    label: 'Tamanho do bloco de upload de arquivo',
  },
  forceImportFromAnotherSurvey: 'Forçar importação de outro inventário',

  importFromArena: 'Arena/Arena Mobile',
  importFromCollect: 'Collect / Collect Mobile',
  importFromCsvExcel: 'CSV/Excel',
  importFromCsvStepsInfo: `### Importando etapas
1. Selecione a entidade alvo
2. Baixe um modelo
3. Preencha o modelo e salve-o (se estiver em CSV, use UTF-8 como codificação)
4. Verifique as opções
5. Carregue o arquivo CSV/Excel
6. Valide o arquivo
7. Inicie a importação`,
  importIntoCycle: 'Importar para o ciclo',
  importIntoMultipleEntityOrAttribute: 'Importar para múltiplas entidades ou atributos',
  importType: {
    label: 'Tipo de importação',
    insertNewRecords: 'Inserir novos registros',
    updateExistingRecords: 'Atualizar registros existentes',
  },
  jobs: {
    ArenaDataImportJob: {
      importCompleteSuccessfully: `Importação de dados do Arena Mobile concluída:
{{summary}}`,
      importSummaryItem: {
        processed: 'registros processados',
        insertedRecords: 'registros criados',
        updatedRecords: 'registros atualizados',
        skippedRecords: 'registros ignorados',
        missingFiles: 'arquivos faltando',
      },
    },
    CollectDataImportJob: {
      importCompleteSuccessfully: `Coleta de importação de dados concluída:
        - {{insertedRecords}} registros criados`,
    },
    DataImportJob: {
      importCompleteSummary: `- {{processed}} linhas processadas
        - {{insertedRecords}} registros criados
        - Registros {{updatedRecords}} atualizados
        - {{entitiesCreated}} entidades criadas
        - {{entitiesDeleted}} entidades excluídas
        - Valores {{updatedValues}} atualizados`,
      importCompleteSuccessfully: `## Importação concluída:
$t(dataImportView:jobs.DataImportJob.importCompleteSummary)`,
      importWithFilesCompleteSuccessfully: `$t(dataImportView:jobs.DataImportJob.importCompleteSuccessfully)
        - {{insertedFiles}} arquivos inseridos
        - {{updatedFiles}} arquivos atualizados
        - {{deletedFiles}} arquivos excluídos`,
      importCompleteWithErrors: `## Importação concluída (com erros):
        - {{processed}} linhas processadas`,
    },
    DataImportValidationJob: {
      validationCompleteWithErrors: `## Validação concluída ({{errorsFoundMessage}})
        - {{processed}} linhas processadas`,
      validationWithFilesCompleteWithErrors: `$t(dataImportView:jobs.DataImportValidationJob.validationCompleteWithErrors)`,
      validationCompleteSuccessfully: `## Validação concluída sem erros
        - {{processed}} linhas processadas
        - registros {{insertedRecords}} seriam criados
        - Os registros {{updatedRecords}} seriam atualizados
        - Entidades {{entitiesCreated}} seriam criadas
        - Entidades {{entitiesDeleted}} seriam excluídas
        - Os valores {{updatedValues}} seriam atualizados`,
      validationWithFilesCompleteSuccessfully: `$t(dataImportView:jobs.DataImportValidationJob.validationCompleteSuccessfully)
        - {{insertedFiles}} arquivos seriam inseridos
        - {{updatedFiles}} arquivos seriam atualizados
        - {{deletedFiles}} arquivos seriam excluídos`,
    },
  },
  options: {
    header: '$t(common.options)',
    abortOnErrors: 'Abortar em caso de erros',
    preventAddingNewEntityData: 'Impedir a adição de novos dados de entidade',
    preventUpdatingRecordsInAnalysis: 'Impedir a atualização de registros na etapa Análise',
    includeFiles: 'Incluir arquivos',
    deleteExistingEntities: `Excluir os dados da entidade selecionada em todos os registros`,
  },
  optionsInfo: {
    deleteExistingEntities: `AVISO: todas as entidades "{{nodeDefName}}" 
e todos os seus descendentes em todos os registros  
serão excluídos antes de inserir os novos.`,
  },
  startImport: 'Iniciar importação',
  startImportConfirm: `Ao pressionar 'Ok' você iniciará o processo de importação.  
**Não será possível reverter as alterações.**  
Tem certeza de que deseja continuar?`,
  startImportConfirmWithDeleteExistingEntities: `$t(dataImportView:startImportConfirm)  
**(opção $t(dataImportView:options.deleteExistingEntities) selecionada: entidades existentes serão excluídas antes da criação das novas)**
`,
  steps: {
    selectImportType: 'Selecione o tipo de importação',
    selectCycle: 'Selecione Ciclo',
    selectEntity: 'Selecione Entidade',
    selectFile: 'Selecione o arquivo',
    startImport: 'Iniciar importação',
  },
  templateForImport: 'Modelo para importação',
  templateFor_specificDataImport_csv: 'Modelo para importação de dados (CSV)',
  templateFor_specificDataImport_xlsx: 'Modelo para importação de dados (Excel)',
  templateFor_genericDataImport_csv: 'Modelo para importação de dados (genérico, CSV)',
  templateFor_genericDataImport_xlsx: 'Modelo para importação de dados (genérico, Excel)',
  validateFile: 'Validar arquivo',
  validateFileInfo:
    'O processo de validação verifica se o arquivo contém dados válidos de acordo com o tipo de dados de cada atributo.',
}
