import * as ActivityLog from '@common/activityLog/activityLog'

export default {
  messages: {
    // Survey
    [ActivityLog.type.surveyCreate]: 'membuat survei',
    [ActivityLog.type.surveyPropUpdate]: 'memperbarui {{key}} survei',
    [ActivityLog.type.surveyAiPolicyUpdate]: 'mengubah kebijakan AI survei',
    [ActivityLog.type.surveyPublish]: 'menerbitkan survei',
    [ActivityLog.type.surveyCollectImport]: 'mengimpor survei dari Collect',

    // NodeDef
    [ActivityLog.type.nodeDefCreate]: 'menambahkan definisi node {{type}} di entitas {{parentName}}',
    [ActivityLog.type.nodeDefUpdate]: 'memperbarui {{keys}} dari definisi node {{name}}',
    [ActivityLog.type.nodeDefMarkDeleted]: 'menghapus definisi node {{name}}',

    // Category
    [ActivityLog.type.categoryInsert]: 'menambahkan kategori',
    [ActivityLog.type.categoryPropUpdate]: 'memperbarui {{key}} dari kategori {{categoryName}}',
    [ActivityLog.type.categoryDelete]: 'menghapus kategori {{categoryName}}',
    [ActivityLog.type.categoryLevelInsert]: 'menambahkan tingkat pada indeks {{index}} ke kategori {{categoryName}}',
    [ActivityLog.type.categoryLevelPropUpdate]: 'memperbarui {{key}} tingkat {{index}} dari kategori {{categoryName}}',
    [ActivityLog.type.categoryLevelDelete]: 'menghapus tingkat {{index}} dari kategori {{categoryName}}',
    [ActivityLog.type.categoryItemInsert]: 'menambahkan item ke tingkat {{levelIndex}} dari kategori {{categoryName}}',
    [ActivityLog.type.categoryItemPropUpdate]: 'memperbarui {{key}} item {{code}} dari kategori {{categoryName}}',
    [ActivityLog.type.categoryItemDelete]:
      'menghapus item {{code}} pada tingkat {{levelIndex}} dari kategori {{categoryName}}',
    [ActivityLog.type.categoryImport]: 'mengimpor file CSV ke kategori {{categoryName}}',

    // Taxonomy
    [ActivityLog.type.taxonomyCreate]: 'menambahkan taksonomi',
    [ActivityLog.type.taxonomyPropUpdate]: 'memperbarui {{key}} dari taksonomi {{taxonomyName}}',
    [ActivityLog.type.taxonomyDelete]: 'menghapus taksonomi {{taxonomyName}}',
    [ActivityLog.type.taxonomyTaxaImport]: 'mengimpor file CSV ke taksonomi {{taxonomyName}}',
    [ActivityLog.type.taxonInsert]: 'menambahkan takson ke taksonomi {{taxonomyName}}',

    // Record
    [ActivityLog.type.recordCreate]: 'menambahkan catatan',
    [ActivityLog.type.recordDelete]: 'menghapus catatan {{keys}}',
    [ActivityLog.type.recordImport]: 'catatan diimpor',
    [ActivityLog.type.recordStepUpdate]: 'memperbarui tahap catatan {{keys}} dari {{stepFrom}} ke {{stepTo}}',
    [ActivityLog.type.recordMerge]: 'catatan {{sourceRecordKeys}} digabungkan ke catatan {{targetRecordKeys}}',

    // Node
    [ActivityLog.type.nodeCreate]: 'menambahkan node {{name}} di {{parentPath}} ke catatan {{recordKeys}}',
    [ActivityLog.type.nodeValueUpdate]: 'memperbarui node {{name}} di {{parentPath}} dari catatan {{recordKeys}}',
    [ActivityLog.type.nodeDelete]: 'menghapus node {{name}} dari catatan {{recordKeys}}',

    // User
    [ActivityLog.type.userInvite]: 'mengundang pengguna {{email}} dengan peran {{groupName}}',
    [ActivityLog.type.userUpdate]: 'memperbarui pengguna {{name}}',
    [ActivityLog.type.userRemove]: 'mengeluarkan pengguna {{name}} dari survei',

    // Analysis
    [ActivityLog.type.chainCreate]: 'menambahkan rantai analisis',
    [ActivityLog.type.chainPropUpdate]: 'memperbarui {{key}} dari rantai analisis {{label}}',
    [ActivityLog.type.analysisNodeDefPropUpdate]:
      'memperbarui {{key}} menjadi {{value}} dari definisi node terhitung {{name}}',
    [ActivityLog.type.chainStatusExecSuccess]: 'berhasil menjalankan rantai analisis {{label}}',
    [ActivityLog.type.chainDelete]: 'menghapus rantai analisis {{label}}',
  },
}
