import * as ActivityLog from '@common/activityLog/activityLog'

export default {
  messages: {
    // Survey
    [ActivityLog.type.surveyCreate]: 'hat die Erhebung erstellt',
    [ActivityLog.type.surveyPropUpdate]: 'hat {{key}} der Erhebung aktualisiert',
    [ActivityLog.type.surveyPublish]: 'hat die Erhebung veröffentlicht',
    [ActivityLog.type.surveyCollectImport]: 'hat die Erhebung aus Collect importiert',

    // NodeDef
    [ActivityLog.type.nodeDefCreate]: 'hat die Knotendefinition {{type}} zur Entität {{parentName}} hinzugefügt',
    [ActivityLog.type.nodeDefUpdate]: 'hat {{keys}} der Knotendefinition {{name}} aktualisiert',
    [ActivityLog.type.nodeDefMarkDeleted]: 'hat die Knotendefinition {{name}} gelöscht',

    // Category
    [ActivityLog.type.categoryInsert]: 'hat eine Kategorie hinzugefügt',
    [ActivityLog.type.categoryPropUpdate]: 'hat {{key}} der Kategorie {{categoryName}} aktualisiert',
    [ActivityLog.type.categoryDelete]: 'hat die Kategorie {{categoryName}} gelöscht',
    [ActivityLog.type.categoryLevelInsert]:
      'hat der Kategorie {{categoryName}} die Ebene am Index {{index}} hinzugefügt',
    [ActivityLog.type.categoryLevelPropUpdate]:
      'hat {{key}} der Ebene {{index}} in Kategorie {{categoryName}} aktualisiert',
    [ActivityLog.type.categoryLevelDelete]: 'hat Ebene {{index}} der Kategorie {{categoryName}} gelöscht',
    [ActivityLog.type.categoryItemInsert]:
      'hat ein Element zur Ebene {{levelIndex}} der Kategorie {{categoryName}} hinzugefügt',
    [ActivityLog.type.categoryItemPropUpdate]:
      'hat {{key}} des Elements {{code}} in Kategorie {{categoryName}} aktualisiert',
    [ActivityLog.type.categoryItemDelete]:
      'hat Element {{code}} auf Ebene {{levelIndex}} der Kategorie {{categoryName}} gelöscht',
    [ActivityLog.type.categoryImport]: 'hat eine CSV-Datei in die Kategorie {{categoryName}} importiert',

    // Taxonomy
    [ActivityLog.type.taxonomyCreate]: 'hat eine Taxonomie hinzugefügt',
    [ActivityLog.type.taxonomyPropUpdate]: 'hat {{key}} der Taxonomie {{taxonomyName}} aktualisiert',
    [ActivityLog.type.taxonomyDelete]: 'hat die Taxonomie {{taxonomyName}} gelöscht',
    [ActivityLog.type.taxonomyTaxaImport]: 'hat eine CSV-Datei in die Taxonomie {{taxonomyName}} importiert',
    [ActivityLog.type.taxonInsert]: 'hat ein Taxon zur Taxonomie {{taxonomyName}} hinzugefügt',

    // Record
    [ActivityLog.type.recordCreate]: 'hat einen Datensatz hinzugefügt',
    [ActivityLog.type.recordDelete]: 'hat Datensatz {{keys}} gelöscht',
    [ActivityLog.type.recordImport]: 'hat einen Datensatz importiert',
    [ActivityLog.type.recordStepUpdate]:
      'hat den Schritt von Datensatz {{keys}} von {{stepFrom}} auf {{stepTo}} geändert',
    [ActivityLog.type.recordMerge]:
      'hat Datensatz {{sourceRecordKeys}} in Datensatz {{targetRecordKeys}} zusammengeführt',

    // Node
    [ActivityLog.type.nodeCreate]: 'hat Knoten {{name}} unter {{parentPath}} zum Datensatz {{recordKeys}} hinzugefügt',
    [ActivityLog.type.nodeValueUpdate]:
      'hat Knoten {{name}} unter {{parentPath}} im Datensatz {{recordKeys}} aktualisiert',
    [ActivityLog.type.nodeDelete]: 'hat Knoten {{name}} aus Datensatz {{recordKeys}} gelöscht',

    // User
    [ActivityLog.type.userInvite]: 'hat Benutzer {{email}} mit der Rolle {{groupName}} eingeladen',
    [ActivityLog.type.userUpdate]: 'hat Benutzer {{name}} aktualisiert',
    [ActivityLog.type.userRemove]: 'hat Benutzer {{name}} aus der Erhebung entfernt',

    // Analysis
    [ActivityLog.type.chainCreate]: 'hat eine Verarbeitungskette hinzugefügt',
    [ActivityLog.type.chainPropUpdate]: 'hat {{key}} der Verarbeitungskette {{label}} aktualisiert',
    [ActivityLog.type.analysisNodeDefPropUpdate]:
      'hat {{key}} der berechneten Knotendefinition {{name}} auf {{value}} gesetzt',
    [ActivityLog.type.chainStatusExecSuccess]: 'hat die Verarbeitungskette {{label}} erfolgreich ausgeführt',
    [ActivityLog.type.chainDelete]: 'hat die Verarbeitungskette {{label}} gelöscht',
  },
}
