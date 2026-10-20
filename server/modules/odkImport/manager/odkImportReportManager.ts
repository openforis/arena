import * as OdkImportReportRepository from '../repository/odkImportReportRepository'

// CREATE
export const { insertItem, insertItems } = OdkImportReportRepository

// READ
export const { fetchItems, fetchItemsStream, countItems } = OdkImportReportRepository

// UPDATE
export const { updateItem } = OdkImportReportRepository
