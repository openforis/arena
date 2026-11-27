export default {
  confirmDeleteAllRecords: 'Hapus semua catatan sebelum impor?',
  confirmDeleteAllRecordsInCycle: 'Hapus semua catatan di siklus {{cycle}} sebelum impor?',
  conflictResolutionStrategy: {
    label: 'Strategi penyelesaian konflik',
    info: 'Apa yang harus dilakukan jika ditemukan catatan yang sama (atau catatan dengan atribut kunci yang sama)',
    skipExisting: 'Lewati jika sudah ada',
    overwriteIfUpdated: 'Timpa jika diperbarui',
    merge: 'Gabungkan catatan',
  },
  deleteAllRecordsBeforeImport: 'Hapus semua catatan sebelum impor',
  downloadAllTemplates: 'Unduh semua templat',
  downloadAllTemplates_csv: 'Unduh semua templat (CSV)',
  downloadAllTemplates_xlsx: 'Unduh semua templat (Excel)',
  downloadTemplate: 'Unduh templat',
  downloadTemplate_csv: 'Unduh templat (CSV)',
  downloadTemplate_xlsx: 'Unduh templat (Excel)',
  errors: {
    rowNum: 'Baris #',
  },
  fileUploadChunkSize: {
    label: 'Ukuran potongan unggahan file',
  },
  forceImportFromAnotherSurvey: 'Paksa impor dari survei lain',

  importFromArena: 'Arena/Arena Mobile',
  importFromCollect: 'Collect / Collect Mobile',
  importFromOdk: 'ODK / ODK Collect',
  importFromCsvExcel: 'CSV/Excel',
  importFromCsvStepsInfo: `### Langkah-langkah impor
1. Pilih entitas tujuan
2. Unduh templat
3. Isi templat dan simpan (jika dalam CSV, gunakan pengodean UTF-8)
4. Periksa opsi
5. Unggah file CSV/Excel
6. Validasi file
7. Mulai impor
`,
  importIntoCycle: 'Impor ke siklus',
  importIntoMultipleEntityOrAttribute: 'Impor ke entitas atau atribut jamak',
  importPreview: {
    title: 'Pratinjau impor',
    generatePreview: 'Buat pratinjau',
    skipInfo:
      'Catatan yang ditandai "Lewati" tidak dapat dipilih: sudah ada catatan yang diubah lebih baru, sehingga catatan tersebut tidak akan diimpor.',
    confirmImport: 'Impor catatan yang dipilih ({{count}})',
    columns: {
      exists: 'Sudah ada',
      action: 'Tindakan',
      dateModified: 'Catatan impor diubah',
      existingDateModified: 'Catatan yang ada diubah',
    },
    action: {
      insert: 'Sisipkan',
      overwrite: 'Timpa',
      merge: 'Gabungkan',
      skip: 'Lewati',
    },
  },
  importType: {
    label: 'Jenis impor',
    insertNewRecords: 'Sisipkan catatan baru',
    updateExistingRecords: 'Perbarui catatan yang ada',
  },
  jobs: {
    ArenaDataImportJob: {
      importCompleteSuccessfully: `Impor data Arena Mobile selesai:
{{summary}}`,
      importSummaryItem: {
        processed: 'catatan diproses',
        insertedRecords: 'catatan dibuat',
        updatedRecords: 'catatan diperbarui',
        skippedRecords: 'catatan dilewati',
        missingFiles: 'file hilang',
      },
    },
    CollectDataImportJob: {
      importCompleteSuccessfully: `Impor data Collect selesai:
        - {{insertedRecords}} catatan dibuat`,
    },
    OdkDataImportJob: {
      importCompleteSuccessfully: `Impor data ODK selesai:
        - {{submittedCount}} catatan dibuat
        - {{skippedCount}} kiriman duplikat dilewati`,
    },
    DataImportJob: {
      importCompleteSummary: `
        - {{processed}} baris diproses
        - {{insertedRecords}} catatan dibuat
        - {{updatedRecords}} catatan diperbarui
        - {{entitiesCreated}} entitas dibuat
        - {{entitiesDeleted}} entitas dihapus
        - {{updatedValues}} nilai diperbarui`,
      importCompleteSuccessfully: `## Impor selesai:
$t(dataImportView:jobs.DataImportJob.importCompleteSummary)`,
      importWithFilesCompleteSuccessfully: `$t(dataImportView:jobs.DataImportJob.importCompleteSuccessfully)
        - {{insertedFiles}} file disisipkan
        - {{updatedFiles}} file diperbarui
        - {{deletedFiles}} file dihapus`,
      importCompleteWithErrors: `## Impor selesai (dengan kesalahan):
        - {{processed}} baris diproses`,
      tooLong: 'Impor ini memerlukan waktu cukup lama. $t(common.trySplittingFileIntoSmallerChunks)',
    },
    DataImportValidationJob: {
      validationCompleteWithErrors: `## Validasi selesai ({{errorsFoundMessage}})
        - {{processed}} baris diproses`,
      validationWithFilesCompleteWithErrors: `$t(dataImportView:jobs.DataImportValidationJob.validationCompleteWithErrors)`,
      validationCompleteSuccessfully: `## Validasi selesai tanpa kesalahan
        - {{processed}} baris diproses
        - {{insertedRecords}} catatan akan dibuat
        - {{updatedRecords}} catatan akan diperbarui
        - {{entitiesCreated}} entitas akan dibuat
        - {{entitiesDeleted}} entitas akan dihapus
        - {{updatedValues}} nilai akan diperbarui`,
      validationWithFilesCompleteSuccessfully: `$t(dataImportView:jobs.DataImportValidationJob.validationCompleteSuccessfully)
        - {{insertedFiles}} file akan disisipkan
        - {{updatedFiles}} file akan diperbarui
        - {{deletedFiles}} file akan dihapus`,
      tooLong: 'Validasi ini memerlukan waktu cukup lama. $t(common.trySplittingFileIntoSmallerChunks)',
    },
  },
  options: {
    header: '$t(common.options)',
    abortOnErrors: 'Batalkan jika ada kesalahan',
    preventAddingNewEntityData: 'Cegah penambahan data entitas baru',
    preventUpdatingRecordsInAnalysis: 'Cegah pembaruan catatan pada tahap Analisis',
    includeFiles: 'Sertakan file',
    skipMissingFiles: 'Abaikan file yang hilang',
    deleteExistingEntities: `Hapus data entitas yang dipilih di semua catatan`,
  },
  optionsInfo: {
    deleteExistingEntities: `PERINGATAN: semua entitas "{{nodeDefName}}"
beserta semua turunannya di semua catatan
akan dihapus sebelum yang baru disisipkan.`,
  },
  startImport: 'Mulai impor',
  startImportConfirm: `Dengan menekan 'Ok', Anda akan memulai proses impor.
**Perubahan tidak dapat dibatalkan.**
Apakah Anda yakin ingin melanjutkan?`,
  startImportConfirmWithDeleteExistingEntities: `$t(dataImportView:startImportConfirm)
**(Opsi $t(dataImportView:options.deleteExistingEntities) dipilih: entitas yang ada akan dihapus sebelum membuat entitas baru)**
`,
  steps: {
    selectImportType: 'Pilih Jenis Impor',
    selectCycle: 'Pilih Siklus',
    selectEntity: 'Pilih Entitas',
    selectFile: 'Pilih File',
    startImport: 'Mulai impor',
  },
  templateForImport: 'Templat untuk impor',
  templateFor_specificDataImport_csv: 'Templat untuk impor (CSV)',
  templateFor_specificDataImport_xlsx: 'Templat untuk impor (Excel)',
  templateFor_genericDataImport_csv: 'Templat untuk impor (generik, CSV)',
  templateFor_genericDataImport_xlsx: 'Templat untuk impor (generik, Excel)',
  validateFile: 'Validasi file',
  validateFileInfo:
    'Proses validasi memeriksa apakah file berisi data yang valid sesuai dengan jenis data setiap atribut.',
}
