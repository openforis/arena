import { getContextUser } from '../config/context'

import * as DataImportCsvTest from './_record/dataImportCsvTest'

describe('Data import (CSV)', () => {
  test('Insert records and nested entities, update existing values (calculated attributes updated)', async () =>
    DataImportCsvTest.dataImportCsvTest({ user: getContextUser() }))

  test('A row with an invalid value makes the import fail without persisting anything', async () =>
    DataImportCsvTest.dataImportCsvInvalidValueTest({ user: getContextUser() }))

  test('Importing values into a not existing entity without insertMissingNodes fails', async () =>
    DataImportCsvTest.dataImportCsvEntityNotFoundTest({ user: getContextUser() }))

  test('Importing values into a not existing record fails', async () =>
    DataImportCsvTest.dataImportCsvRecordNotFoundTest({ user: getContextUser() }))

  test('Dry run does not persist any change', async () =>
    DataImportCsvTest.dataImportCsvDryRunTest({ user: getContextUser() }))
})
