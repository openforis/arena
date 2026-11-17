import * as CollectImportReportRepository from '../repository/collectImportReportRepository'

// CREATE
export const { insertItem, insertItems } = CollectImportReportRepository

// READ
export const { fetchItems, fetchItemsStream, countItems } = CollectImportReportRepository

// UPDATE
export const { updateItem } = CollectImportReportRepository
