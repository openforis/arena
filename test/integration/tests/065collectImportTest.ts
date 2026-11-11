import AdmZip from 'adm-zip'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as Taxon from '@core/survey/taxon'
import * as Taxonomy from '@core/survey/taxonomy'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'

import * as CategoryManager from '@server/modules/category/manager/categoryManager'
import CollectImportJob from '@server/modules/collectImport/service/collectImport/collectImportJob'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as TaxonomyRepository from '@server/modules/taxonomy/repository/taxonomyRepository'
import * as FileUtils from '@server/utils/file/fileUtils'

import { getContextUser } from '../config/context'

// a simple Collect survey: a code list (level name to be normalized), a species list (vernacular names and an
// extra column to be normalized) and a cluster with a multiple tree entity
const idml = `<?xml version="1.0" encoding="UTF-8"?>
<survey xmlns="http://www.openforis.org/idml/3.0" lastId="10">
  <project xml:lang="en">Collect import test</project>
  <uri>http://www.openforis.org/idm/collect_import_test</uri>
  <cycle>1</cycle>
  <language>en</language>
  <codeLists>
    <list id="1" name="land_use">
      <label type="item" xml:lang="en">Land use</label>
      <hierarchy>
        <level name="Land Use"/>
      </hierarchy>
      <items>
        <item><code>1</code><label xml:lang="en">Forest</label></item>
        <item><code>2</code><label xml:lang="en">Cropland</label></item>
      </items>
    </list>
  </codeLists>
  <schema>
    <entity name="cluster" id="2">
      <label type="instance" xml:lang="en">Cluster</label>
      <number name="cluster_id" id="3" key="true" type="integer">
        <label type="instance" xml:lang="en">Cluster ID</label>
      </number>
      <code name="land_use" id="4" list="land_use">
        <label type="instance" xml:lang="en">Land use</label>
      </code>
      <entity name="tree" id="5" multiple="true">
        <label type="instance" xml:lang="en">Tree</label>
        <number name="tree_no" id="6" key="true" type="integer">
          <label type="instance" xml:lang="en">Tree number</label>
        </number>
        <taxon name="species" id="7" taxonomy="trees">
          <label type="instance" xml:lang="en">Species</label>
        </taxon>
        <number name="dbh" id="8" type="real">
          <label type="instance" xml:lang="en">DBH</label>
        </number>
      </entity>
    </entity>
  </schema>
</survey>
`

// family and genus rows have no code: only the species rows are imported as taxa
const speciesCsv = `id,parent_id,rank,scientific_name,code,eng,synonyms,Max Height (m)
1,,family,Fabaceae,,,,
2,1,genus,Afzelia,,,,
3,2,species,Afzelia quanzensis,AFZ_QUA,Pod mahogany,,25
4,1,genus,Acacia,,,,
5,4,species,Acacia tortilis,ACA_TOR,Umbrella thorn,,20
`

const createCollectSurveyFile = (): string => {
  const zip = new AdmZip()
  zip.addFile('idml.xml', Buffer.from(idml, 'utf-8'))
  zip.addFile('species/trees.csv', Buffer.from(speciesCsv, 'utf-8'))
  const filePath = FileUtils.newTempFilePath()
  zip.writeZip(filePath)
  return filePath
}

describe('Collect import', () => {
  let surveyId: number = null

  afterAll(async () => {
    if (surveyId) {
      await SurveyManager.deleteSurvey(surveyId)
    }
  })

  test('a simple Collect survey is imported', async () => {
    const user = getContextUser()
    // the job deletes the file when it ends
    const job: any = new CollectImportJob({ user, filePath: createCollectSurveyFile(), newSurvey: {} })
    await job.start()
    expect(job.errors).toEqual({})
    expect(job.isSucceeded()).toBe(true)

    surveyId = job.result.surveyId
    const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId({
      surveyId,
      cycle: Survey.cycleOneKey,
      draft: true,
      advanced: true,
    })
    const surveyInfo = Survey.getSurveyInfo(survey)
    expect(Survey.getName(surveyInfo)).toMatch(/^collect_import_test/)
    expect(Survey.getLanguages(surveyInfo)).toEqual(['en'])

    // node defs
    const getNodeDef = (name: string) => Survey.getNodeDefByName(name)(survey)
    expect(NodeDef.isRoot(getNodeDef('cluster'))).toBe(true)
    expect(NodeDef.isKey(getNodeDef('cluster_id'))).toBe(true)
    expect(NodeDef.isMultipleEntity(getNodeDef('tree'))).toBe(true)
    expect(NodeDef.getType(getNodeDef('dbh'))).toBe(NodeDef.nodeDefType.decimal)

    // category: level name normalized
    const category = Survey.getCategoryByName('land_use')(survey)
    expect(NodeDef.getCategoryUuid(getNodeDef('land_use'))).toBe(Category.getUuid(category))
    expect(Category.getLevelsArray(category).map(CategoryLevel.getName)).toEqual(['land_use'])
    const items = await CategoryManager.fetchItemsByCategoryUuid({
      surveyId,
      categoryUuid: Category.getUuid(category),
      draft: true,
    })
    expect(items.map(CategoryItem.getCode).sort()).toEqual(['1', '2'])

    // taxonomy: vernacular names and extra prop (name normalized)
    const taxonomy = Survey.getTaxonomyByName('trees')(survey)
    expect(NodeDef.getTaxonomyUuid(getNodeDef('species'))).toBe(Taxonomy.getUuid(taxonomy))
    expect(Taxonomy.getVernacularLanguageCodes(taxonomy)).toEqual(['eng'])
    expect(Object.keys(Taxonomy.getExtraPropsDefs(taxonomy))).toEqual(['max_height__m_'])

    const taxa = await TaxonomyRepository.fetchTaxaWithVernacularNames({
      surveyId,
      taxonomyUuid: Taxonomy.getUuid(taxonomy),
      draft: true,
    })
    const afzelia = taxa.find((taxon: any) => Taxon.getCode(taxon) === 'AFZ_QUA')
    expect(Taxon.getScientificName(afzelia)).toBe('Afzelia quanzensis')
    expect(Taxon.getFamily(afzelia)).toBe('Fabaceae')
    expect(Taxon.getGenus(afzelia)).toBe('Afzelia')
    expect(Taxon.getVernacularNamesByLang('eng')(afzelia).map(TaxonVernacularName.getName)).toEqual(['Pod mahogany'])
    expect(Taxon.getExtra(afzelia)).toEqual({ max_height__m_: '25' })
    expect(taxa.some((taxon: any) => Taxon.getCode(taxon) === 'ACA_TOR')).toBe(true)
  })
})
