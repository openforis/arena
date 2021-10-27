import * as CollectImportReportRepository from '../repository/collectImportReportRepository'

// CREATE
export const { insertItem } = CollectImportReportRepository

// READ
export const { fetchItems, fetchItemsStream, countItems } = CollectImportReportRepository

// UPDATE
export const { updateItem } = CollectImportReportRepository
