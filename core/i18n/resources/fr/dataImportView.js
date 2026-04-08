export default {
  confirmDeleteAllRecords: "Supprimer tous les enregistrements avant l'importation ?",
  confirmDeleteAllRecordsInCycle: "Supprimer tous les enregistrements du cycle {{cycle}} avant l'importation ?",
  conflictResolutionStrategy: {
    label: 'Stratégie de résolution des conflits',
    info: 'Que faire si le même enregistrement (ou un enregistrement avec les mêmes attributs clés) est trouvé',
    skipExisting: 'Ignorer si déjà existant',
    overwriteIfUpdated: 'Écraser si mis à jour',
    merge: 'Fusionner les enregistrements',
  },
  deleteAllRecordsBeforeImport: "Supprimer tous les enregistrements avant l'importation",
  downloadAllTemplates: 'Télécharger tous les modèles',
  downloadAllTemplates_csv: 'Télécharger tous les modèles (CSV)',
  downloadAllTemplates_xlsx: 'Télécharger tous les modèles (Excel)',
  downloadTemplate: 'Télécharger le modèle',
  downloadTemplate_csv: 'Télécharger le modèle (CSV)',
  downloadTemplate_xlsx: 'Télécharger le modèle (Excel)',
  errors: {
    rowNum: 'Ligne n°',
  },
  fileUploadChunkSize: {
    label: 'Taille du fragment de téléversement',
  },
  forceImportFromAnotherSurvey: "Forcer l'importation depuis un autre formulaire",

  importFromArena: 'Arena/Arena Mobile',
  importFromCollect: 'Collect / Collect Mobile',
  importFromCsvExcel: 'CSV/Excel',
  importFromCsvStepsInfo: `### Étapes d'importation
1. Sélectionnez l'entité cible
2. Téléchargez un modèle
3. Remplissez le modèle et sauvegardez-le (si en CSV, utilisez UTF-8 comme encodage)
4. Vérifiez les options
5. Téléversez le fichier CSV/Excel
6. Validez le fichier
7. Démarrez l'importation
`,
  importIntoCycle: 'Importer dans le cycle',
  importIntoMultipleEntityOrAttribute: 'Importer dans une entité multiple ou un attribut',
  importType: {
    label: "Type d'importation",
    insertNewRecords: 'Insérer de nouveaux enregistrements',
    updateExistingRecords: 'Mettre à jour les enregistrements existants',
  },
  jobs: {
    ArenaDataImportJob: {
      importCompleteSuccessfully: `Importation de données Arena Mobile terminée :
{{summary}}`,
      importSummaryItem: {
        processed: 'enregistrements traités',
        insertedRecords: 'enregistrements créés',
        updatedRecords: 'enregistrements mis à jour',
        skippedRecords: 'enregistrements ignorés',
        missingFiles: 'fichiers manquants',
      },
    },
    CollectDataImportJob: {
      importCompleteSuccessfully: `Importation de données Collect terminée :
        - {{insertedRecords}} enregistrements créés`,
    },
    DataImportJob: {
      importCompleteSummary: `
        - {{processed}} lignes traitées
        - {{insertedRecords}} enregistrements créés
        - {{updatedRecords}} enregistrements mis à jour
        - {{entitiesCreated}} entités créées
        - {{entitiesDeleted}} entités supprimées
        - {{updatedValues}} valeurs mises à jour`,
      importCompleteSuccessfully: `## Importation terminée :
$t(dataImportView:jobs.DataImportJob.importCompleteSummary)`,
      importWithFilesCompleteSuccessfully: `$t(dataImportView:jobs.DataImportJob.importCompleteSuccessfully)
        - {{insertedFiles}} fichiers insérés
        - {{updatedFiles}} fichiers mis à jour
        - {{deletedFiles}} fichiers supprimés`,
      importCompleteWithErrors: `## Importation terminée (avec des erreurs) :
        - {{processed}} lignes traitées`,
    },
    DataImportValidationJob: {
      validationCompleteWithErrors: `## Validation terminée ({{errorsFoundMessage}})
        - {{processed}} lignes traitées`,
      validationWithFilesCompleteWithErrors: `$t(dataImportView:jobs.DataImportValidationJob.validationCompleteWithErrors)`,
      validationCompleteSuccessfully: `## Validation terminée sans erreurs
        - {{processed}} lignes traitées
        - {{insertedRecords}} enregistrements seraient créés
        - {{updatedRecords}} enregistrements seraient mis à jour
        - {{entitiesCreated}} entités seraient créées
        - {{entitiesDeleted}} entités seraient supprimées
        - {{updatedValues}} valeurs seraient mises à jour`,
      validationWithFilesCompleteSuccessfully: `$t(dataImportView:jobs.DataImportValidationJob.validationCompleteSuccessfully)
        - {{insertedFiles}} fichiers seraient insérés
        - {{updatedFiles}} fichiers seraient mis à jour
        - {{deletedFiles}} fichiers seraient supprimés`,
    },
  },
  options: {
    header: '$t(common.options)',
    abortOnErrors: "Abandonner en cas d'erreurs",
    preventAddingNewEntityData: "Empêcher l'ajout de nouvelles données d'entité",
    preventUpdatingRecordsInAnalysis: "Empêcher la mise à jour des enregistrements à l'étape d'analyse",
    includeFiles: 'Inclure les fichiers',
    deleteExistingEntities: `Supprimer les données de l'entité sélectionnée dans tous les enregistrements`,
  },
  optionsInfo: {
    deleteExistingEntities: `AVERTISSEMENT : toutes les entités "{{nodeDefName}}" 
et tous leurs descendants dans tous les enregistrements  
seront supprimés avant d'insérer les nouveaux.`,
  },
  startImport: "Démarrer l'importation",
  startImportConfirm: `En appuyant sur 'Ok', vous démarrez le processus d'importation.  
**Il ne sera pas possible d'annuler les modifications.**  
Êtes-vous sûr(e) de vouloir continuer ?`,
  startImportConfirmWithDeleteExistingEntities: `$t(dataImportView:startImportConfirm)  
**($t(dataImportView:options.deleteExistingEntities) option sélectionnée : les entités existantes seront supprimées avant d'en créer de nouvelles)**
`,
  steps: {
    selectImportType: "Sélectionner le type d'importation",
    selectCycle: 'Sélectionner le cycle',
    selectEntity: "Sélectionner l'entité",
    selectFile: 'Sélectionner le fichier',
    startImport: "Démarrer l'importation",
  },
  templateForImport: "Modèle pour l'importation",
  templateFor_specificDataImport_csv: "Modèle pour l'importation (CSV)",
  templateFor_specificDataImport_xlsx: "Modèle pour l'importation (Excel)",
  templateFor_genericDataImport_csv: "Modèle pour l'importation (générique, CSV)",
  templateFor_genericDataImport_xlsx: "Modèle pour l'importation (générique, Excel)",
  validateFile: 'Valider le fichier',
  validateFileInfo:
    'Le processus de validation vérifie que le fichier contient des données valides selon le type de données de chaque attribut.',
}
