import { UniqueFileNamesGenerator } from '@openforis/arena-core'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import { ColumnNodeDef } from '@common/model/db'
import { Query } from '@common/model/query'

import { SurveyRdbCsvExport } from '@server/modules/surveyRdb/manager/surveyRdbCsvExport'
import { toSafeFileName } from '@server/utils/file/fileNames'

import * as SB from '../../utils/surveyBuilder'

describe('toSafeFileName', () => {
  test.each([
    ['photo 1.jpg', 'photo 1.jpg'],
    ['ça été.png', 'ça été.png'],
    ['../../../tmp/x.sh', '_.._.._tmp_x.sh'],
    [String.raw`..\..\x.txt`, '_.._x.txt'],
    ['/etc/passwd', '_etc_passwd'],
    ['a:b*c?"d"<e>|f.txt', 'a_b_c__d__e__f.txt'],
    ['line\nbreak.txt', 'line_break.txt'],
    ['.hidden', 'hidden'],
    ['..', ''],
    ['  ', ''],
    [null, ''],
  ])('%p becomes %p', (fileName, expected) => {
    expect(toSafeFileName(fileName)).toBe(expected)
  })
})

describe('Data export: names of the record files', () => {
  test('the exported file names are safe and unique', async () => {
    const survey = await SB.survey(
      { uuid: 'test-user' },
      SB.entity(
        'cluster',
        SB.attribute('cluster_no', NodeDef.nodeDefType.integer).key(),
        SB.attribute('photo', NodeDef.nodeDefType.file)
      )
    ).build()
    const clusterDef = Survey.getNodeDefByName('cluster')(survey)
    const photoDef = Survey.getNodeDefByName('photo')(survey)
    const query = Query.create({
      entityDefUuid: NodeDef.getUuid(clusterDef),
      attributeDefUuids: [NodeDef.getUuid(photoDef)],
    })
    const uniqueFileNamesGenerator = new UniqueFileNamesGenerator()
    const { transformers } = SurveyRdbCsvExport.getCsvObjectTransformer({
      survey,
      query,
      expandCategoryItems: false,
      keepFileNamesUnique: true,
      uniqueFileNamesGenerator,
    })
    const fileUuidCol = ColumnNodeDef.getFileUuidColumnName(photoDef)
    const fileNameCol = ColumnNodeDef.getFileNameColumnName(photoDef)
    const transform = (fileUuid: string, fileName: string) =>
      transformers.reduce((obj, transformer) => transformer(obj), { [fileUuidCol]: fileUuid, [fileNameCol]: fileName })

    expect(transform('uuid-1', '../../evil.sh')[fileNameCol]).toBe('_.._evil.sh')
    expect(transform('uuid-2', 'photo.jpg')[fileNameCol]).toBe('photo.jpg')
    expect(transform('uuid-3', 'photo.jpg')[fileNameCol]).toBe('photo (1).jpg')
    expect(transform('uuid-4', '..')[fileNameCol]).toBe('uuid-4')
    expect(uniqueFileNamesGenerator.fileNamesByKey).toEqual({
      'uuid-1': '_.._evil.sh',
      'uuid-2': 'photo.jpg',
      'uuid-3': 'photo (1).jpg',
      'uuid-4': 'uuid-4',
    })
  })
})
