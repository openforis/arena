import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'
import { TableDataNodeDef, ViewDataNodeDef } from '@common/model/db'
import TableOlapData from '@common/model/db/tables/olapData/table'

import SystemError from '@core/systemError'

import * as DbUtils from '@server/db/dbUtils'
import Job from '@server/job/job'
import { checkNodeDef, checkNodeDefProps } from '@server/modules/nodeDef/repository/nodeDefWriteCheck'
import RFile from '@server/modules/analysis/service/rChain/rFile'

import * as SB from '../../utils/surveyBuilder'

const getError = (fn: () => void) => {
  try {
    fn()
    return null
  } catch (error: any) {
    return { key: error.key, params: error.params, statusCode: error.statusCode }
  }
}

describe('Node def write check', () => {
  const newNodeDef = (type: string, props: Record<string, unknown>) => ({
    ...NodeDef.newNodeDef(null, type, ['0']),
    props,
  })

  test.each(['plot', 'tree_dbh', '2nd_plot', '', null, undefined])('name %p is accepted', (name) => {
    expect(getError(() => checkNodeDefProps({ [NodeDef.propKeys.name]: name }))).toBeNull()
    expect(getError(() => checkNodeDefProps({ [NodeDef.propKeys.labels]: { en: 'Any label' } }))).toBeNull()
  })

  test.each(['Plot', 'plot name', 'x"; DROP TABLE survey; --', '../../tmp/x', 'a.b', 12])(
    'name %p is rejected',
    (name) => {
      expect(getError(() => checkNodeDefProps({ [NodeDef.propKeys.name]: name }))).toEqual({
        key: Validation.messageKeys.nodeDefEdit.nameInvalid,
        params: { name },
        statusCode: 400,
      })
    }
  )

  test('names in the draft props and unknown types are rejected', () => {
    const nodeDef = {
      ...newNodeDef(NodeDef.nodeDefType.integer, { name: 'plot_no' }),
      propsDraft: { name: 'plot no' },
    }
    expect(getError(() => checkNodeDef(nodeDef))?.key).toBe(Validation.messageKeys.nodeDefEdit.nameInvalid)
    expect(getError(() => checkNodeDef(newNodeDef('script', { name: 'plot_no' })))).toEqual({
      key: 'nodeDefTypeInvalid',
      params: { type: 'script' },
      statusCode: 400,
    })
    expect(getError(() => checkNodeDef(newNodeDef(NodeDef.nodeDefType.integer, { name: 'plot_no' })))).toBeNull()
  })
})

describe('Node def names in the data tables SQL', () => {
  const buildSurvey = async () => {
    const survey = await SB.survey(
      { uuid: 'test-user' },
      SB.entity('cluster', SB.attribute('cluster_no', NodeDef.nodeDefType.integer).key(), SB.entity('plot').multiple())
    ).build()
    return { ...survey, id: 1 }
  }

  test('constraint names and view id columns are quoted', async () => {
    const survey = await buildSurvey()
    const plotDef = Survey.getNodeDefByName('plot')(survey)
    const table = new TableDataNodeDef(survey, plotDef)
    expect(table.getConstraintUuidUnique()).toBe('CONSTRAINT "plot_uuid_unique_ix1" UNIQUE (uuid)')
    expect(table.getConstraintFkParent()).toMatch(/^CONSTRAINT "data_plot_data_cluster_fk"\s/)
    expect(new ViewDataNodeDef(survey, plotDef).columnIdName).toBe('"_plot_id"')
  })

  test('OLAP data table columns are quoted', async () => {
    const survey = await buildSurvey()
    const clusterDef = Survey.getNodeDefByName('cluster')(survey)
    const table = new TableOlapData({ survey, cycle: '0', entityDef: clusterDef, baseUnitDef: clusterDef })
    expect(table.columnNamesAndTypes).toContain('"cluster_uuid" UUID')
  })

  test('DbUtils.asName keeps only properly quoted names as they are', () => {
    expect(DbUtils.asName('plot')).toBe('"plot"')
    expect(DbUtils.asName('"plot"')).toBe('"plot"')
    expect(DbUtils.asName('"a""b"')).toBe('"a""b"')
    expect(DbUtils.asName('"x" FROM y; --')).toBe('"""x"" FROM y; --"')
  })
})

describe('R files', () => {
  const rChain = { dir: '/tmp/arena-r-chain' }

  test('a file must be inside the R project folder', () => {
    expect(new RFile(rChain, '/tmp/arena-r-chain/user/001-plot', '001-plot_area').pathRelative).toBe(
      'user/001-plot/001-plot_area.R'
    )
    expect(() => new RFile(rChain, '/tmp/arena-r-chain/user', '001-../../../../tmp/x')).toThrow()
    expect(() => new RFile(rChain, '/tmp/arena-r-chain/../other', 'x')).toThrow()
  })
})

describe('Job errors', () => {
  test('namespaced error keys are kept, the other ones are app errors', () => {
    const job: any = new Job('TestJob')
    expect(job.getErrorInfo(new SystemError(Validation.messageKeys.nodeDefEdit.nameInvalid, { name: 'a b' }))).toEqual({
      key: Validation.messageKeys.nodeDefEdit.nameInvalid,
      params: { name: 'a b' },
    })
    expect(job.getErrorInfo(new SystemError('nodeDefTypeInvalid', { type: 'x' }))).toEqual({
      key: 'appErrors:nodeDefTypeInvalid',
      params: { type: 'x' },
    })
  })
})
