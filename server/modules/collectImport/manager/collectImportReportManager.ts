import CollectImportReportRepository from '../repository/collectImportReportRepository';

export default {
  insertItem: CollectImportReportRepository.insertItem,

  // READ
  fetchItems: CollectImportReportRepository.fetchItems,
  countItems: CollectImportReportRepository.countItems,

  // UPDATE
  updateItem: CollectImportReportRepository.updateItem
};
