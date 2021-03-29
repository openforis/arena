import * as CollectExpressionConverter from '@server/modules/collectImport/service/collectImport/metaImportJobs/nodeDefsImportJob/collectExpressionConverter'

describe('CollectExpressionConverter Test', () => {
  // ====== value expr tests
  const queries = [
    // custom functions
    { q: 'idm:isBlank(cluster_id)', r: 'isEmpty(cluster_id)' },
    { q: 'idm:isNotBlank(cluster_id)', r: '!isEmpty(cluster_id)' },
    { q: 'idm:currentDate()', r: 'now()' },
    { q: 'idm:currentTime()', r: 'now()' },
    // operators
    { q: 'cluster_id = 10', r: 'cluster_id == 10' },
    { q: '1 = 1 and 2 = 2', r: '1 == 1 && 2 == 2' },
    { q: '1 = 1 AND 2 = 2', r: '1 == 1 && 2 == 2' },
    { q: '1 = 1 or 2 = 2', r: '1 == 1 || 2 == 2' },
    { q: '1 = 1 OR 2 = 2', r: '1 == 1 || 2 == 2' },
    { q: 'true()', r: 'true' },
    { q: 'false()', r: 'false' },
    { q: 'TRUE', r: 'true' },
    { q: 'FALSE', r: 'false' },
    { q: 'false() or TRUE', r: 'false || true' },
  ]

  queries.forEach((query) => {
    const { q: collectExpression, r: result } = query
    it(collectExpression, () => {
      const expression = CollectExpressionConverter.convertExpression({ collectExpression })
      expect(expression).toBe(result)
    })
  })
})
