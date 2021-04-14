import { BASE_URL } from '../config'

import login from '../tests/login'

import surveyCreate from '../tests/surveyCreate'
import surveyInfoEdit from '../tests/surveyInfoEdit'

import nodeDefAtomicEdit from '../tests/nodeDefAtomicEdit'
import nodeDefCodeAndCategoryEdit from '../tests/nodeDefCodeAndCategoryEdit'
import nodeDefTaxonAndTaxonomyEdit from '../tests/nodeDefTaxonAndTaxonomyEdit'
import nodeDefReorder from '../tests/nodeDefReorder'
import nodeDefExpressionsEdit from '../tests/nodeDefExpressionsEdit'
import surveyFormPreview from '../tests/surveyFormPreview'
import exportCsvData from '../tests/exportCsvData'

import recordAdd from '../tests/recordAdd'
import recordVerify from '../tests/recordVerify'

// import userInvite from '../tests/userInvite'

import templateCreate from '../tests/templateCreate'

import surveyExport from '../tests/surveyExport'
import surveyImport from '../tests/surveyImport'
import surveyClone from '../tests/surveyClone'

import validationReport from '../tests/validationReport'
import recordDelete from '../tests/recordDelete'
import surveyDelete from '../tests/surveyDelete'
import templateDelete from '../tests/templateDelete'

import { insertTestUser } from '../tests/utils/insertTestUser'

beforeAll(async () => {
  await insertTestUser()
  await page.goto(BASE_URL)
})

describe('E2E Tests', () => {
  login()
  /**
   * Survey create and info edit.
   */
  surveyCreate()
  surveyInfoEdit()

  /**
   * Node def edit.
   */
  nodeDefAtomicEdit()
  nodeDefCodeAndCategoryEdit()
  nodeDefTaxonAndTaxonomyEdit()
  nodeDefReorder()
  nodeDefExpressionsEdit()
  surveyFormPreview()

  /**
   * Data edit.
   */
  recordAdd()
  recordVerify()

  /**
   * User.
   */
  // TODO: Enable userInvite when implementing user delete.
  // userInvite()

  /**
   * Survey export data.
   */
  exportCsvData()

  /**
   * Survey template.
   */
  templateCreate()
  templateDelete()

  /**
   * Survey export/import/clone.
   */
  surveyExport()
  surveyImport()
  surveyClone()

  /**
   * Validation Report.
   */
  validationReport()

  /**
   * Delete.
   */
  recordDelete()
  surveyDelete()
})
