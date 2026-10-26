import * as ActivityLog from '@common/activityLog/activityLog'

export default {
  messages: {
    // Survey
    [ActivityLog.type.surveyCreate]: 'je kreirao/la istraživanje',
    [ActivityLog.type.surveyPropUpdate]: 'je ažurirao/la {{key}} istraživanja',
    [ActivityLog.type.surveyPublish]: 'je objavio/la istraživanje',
    [ActivityLog.type.surveyCollectImport]: 'je uvezao/la istraživanje iz Collect',

    // NodeDef
    [ActivityLog.type.nodeDefCreate]: 'je dodao/la definiciju čvora {{type}} u entitet {{parentName}}',
    [ActivityLog.type.nodeDefUpdate]: 'je ažurirao/la {{keys}} definicije čvora {{name}}',
    [ActivityLog.type.nodeDefMarkDeleted]: 'je obrisao/la definiciju čvora {{name}}',

    // Category
    [ActivityLog.type.categoryInsert]: 'je dodao/la kategoriju',
    [ActivityLog.type.categoryPropUpdate]: 'je ažurirao/la {{key}} kategorije {{categoryName}}',
    [ActivityLog.type.categoryDelete]: 'je obrisao/la kategoriju {{categoryName}}',
    [ActivityLog.type.categoryLevelInsert]: 'je dodao/la nivo na indeksu {{index}} u kategoriju {{categoryName}}',
    [ActivityLog.type.categoryLevelPropUpdate]: 'je ažurirao/la {{key}} nivoa {{index}} kategorije {{categoryName}}',
    [ActivityLog.type.categoryLevelDelete]: 'je obrisao/la nivo {{index}} kategorije {{categoryName}}',
    [ActivityLog.type.categoryItemInsert]: 'je dodao/la stavku u nivo {{levelIndex}} kategorije {{categoryName}}',
    [ActivityLog.type.categoryItemPropUpdate]: 'je ažurirao/la {{key}} stavke {{code}} kategorije {{categoryName}}',
    [ActivityLog.type.categoryItemDelete]:
      'je obrisao/la stavku {{code}} na nivou {{levelIndex}} kategorije {{categoryName}}',
    [ActivityLog.type.categoryImport]: 'je uvezao/la CSV fajl u kategoriju {{categoryName}}',

    // Taxonomy
    [ActivityLog.type.taxonomyCreate]: 'je dodao/la taksonomiju',
    [ActivityLog.type.taxonomyPropUpdate]: 'je ažurirao/la {{key}} taksonomije {{taxonomyName}}',
    [ActivityLog.type.taxonomyDelete]: 'je obrisao/la taksonomiju {{taxonomyName}}',
    [ActivityLog.type.taxonomyTaxaImport]: 'je uvezao/la CSV fajl u taksonomiju {{taxonomyName}}',
    [ActivityLog.type.taxonInsert]: 'je dodao/la takson u taksonomiju {{taxonomyName}}',

    // Record
    [ActivityLog.type.recordCreate]: 'je dodao/la zapis',
    [ActivityLog.type.recordDelete]: 'je obrisao/la zapis {{keys}}',
    [ActivityLog.type.recordImport]: 'zapis je uvezen',
    [ActivityLog.type.recordStepUpdate]: 'je promijenio/la korak zapisa {{keys}} iz {{stepFrom}} u {{stepTo}}',
    [ActivityLog.type.recordMerge]: 'zapis {{sourceRecordKeys}} je spojen u zapis {{targetRecordKeys}}',

    // Node
    [ActivityLog.type.nodeCreate]: 'je dodao/la čvor {{name}} u {{parentPath}} u zapis {{recordKeys}}',
    [ActivityLog.type.nodeValueUpdate]: 'je ažurirao/la čvor {{name}} u {{parentPath}} zapisa {{recordKeys}}',
    [ActivityLog.type.nodeDelete]: 'je obrisao/la čvor {{name}} iz zapisa {{recordKeys}}',

    // User
    [ActivityLog.type.userInvite]: 'je pozvao/la korisnika {{email}} sa ulogom {{groupName}}',
    [ActivityLog.type.userUpdate]: 'je ažurirao/la korisnika {{name}}',
    [ActivityLog.type.userRemove]: 'je uklonio/la korisnika {{name}} iz istraživanja',

    // Analysis
    [ActivityLog.type.chainCreate]: 'je dodao/la lanac obrade',
    [ActivityLog.type.chainPropUpdate]: 'je ažurirao/la {{key}} lanca obrade {{label}}',
    [ActivityLog.type.analysisNodeDefPropUpdate]:
      'je ažurirao/la {{key}} na {{value}} izračunate definicije čvora {{name}}',
    [ActivityLog.type.chainStatusExecSuccess]: 'je uspješno izvršio/la lanac obrade {{label}}',
    [ActivityLog.type.chainDelete]: 'je obrisao/la lanac obrade {{label}}',
  },
}
