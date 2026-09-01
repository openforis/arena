import TaxonomyImportJob from '../../../server/modules/taxonomy/service/taxonomyImportJob'

const createJob = () => new TaxonomyImportJob({ taxonomyUuid: 'uuid', filePath: 'path', fileFormat: 'csv' })

describe('TaxonomyImportJob', () => {
  describe('generateResult', () => {
    it('does not include missingPublishedTaxaCodes when empty', () => {
      const job = createJob()
      job.missingPublishedTaxaCodes = []

      const result = job.generateResult()

      expect(result.missingPublishedTaxaCodes).toBeUndefined()
      expect(result.missingPublishedTaxaCodesTotal).toBeUndefined()
    })

    it('includes all codes and matching total when below the limit', () => {
      const job = createJob()
      job.missingPublishedTaxaCodes = ['code_1', 'code_2']

      const result = job.generateResult()

      expect(result.missingPublishedTaxaCodes).toEqual(['code_1', 'code_2'])
      expect(result.missingPublishedTaxaCodesTotal).toBe(2)
    })

    it('truncates codes to the max preview size while reporting the full total', () => {
      const job = createJob()
      const allCodes = Array.from({ length: 25 }, (_, index) => `code_${index}`)
      job.missingPublishedTaxaCodes = allCodes

      const result = job.generateResult()

      expect(result.missingPublishedTaxaCodes).toEqual(
        allCodes.slice(0, TaxonomyImportJob.maxMissingPublishedTaxaCodesPreview)
      )
      expect(result.missingPublishedTaxaCodesTotal).toBe(25)
    })
  })
})
