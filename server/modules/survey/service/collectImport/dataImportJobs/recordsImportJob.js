const R = require('ramda')

const DateUtils = require('../../../../../../common/dateUtils')

const Survey = require('../../../../../../common/survey/survey')
const NodeDef = require('../../../../../../common/survey/nodeDef')
const { nodeDefType } = NodeDef
const Category = require('../../../../../../common/survey/category')
const Taxonomy = require('../../../../../../common/survey/taxonomy')
const Record = require('../../../../../../common/record/record')
const Node = require('../../../../../../common/record/node')

const SurveyManager = require('../../../../survey/persistence/surveyManager')
const CategoryManager = require('../../../../category/persistence/categoryManager')
const TaxonomyManager = require('../../../../taxonomy/persistence/taxonomyManager')
const RecordManager = require('../../../../record/persistence/recordManager')
const NodeRepository = require('../../../../record/persistence/nodeRepository')
const RecordUpdateManager = require('../../../../record/persistence/recordUpdateManager')

const Job = require('../../../../../job/job')

const CollectIdmlParseUtils = require('../metaImportJobs/collectIdmlParseUtils')

class RecordsImportJob extends Job {

  constructor (params) {
    super('RecordsImportJob', params)
  }

  async execute (tx) {
    const user = this.getUser()
    const { collectSurveyFileZip, surveyId } = this.context

    const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId, false, false, false, tx)

    const entryNames = collectSurveyFileZip.getEntryNames('data/1/')

    this.total = entryNames.length

    for (const entryName of entryNames) {
      const collectRecordData = this.findCollectRecordData(entryName)
      const { collectRecordXml, step } = collectRecordData

      const collectRecordJson = CollectIdmlParseUtils.parseXmlToJson(collectRecordXml)

      const recordToCreate = Record.newRecord(user)
      const record = await RecordUpdateManager.createRecord(user, surveyId, recordToCreate, tx)
      const rootEntity = Record.getRootNode(record)

      const collectRootEntityName = R.pipe(
        R.keys,
        R.head,
      )(collectRecordJson)

      const collectRootEntity = collectRecordJson[collectRootEntityName]

      await this.insertEntityNodes(survey, record, Node.getUuid(rootEntity), `/${collectRootEntityName}`, collectRootEntity, tx)

      this.incrementProcessedItems()
    }
  }

  findCollectRecordData (entryName) {
    const { collectSurveyFileZip } = this.context

    const steps = [3, 2, 1]

    for (const step of steps) {

      const collectRecordXml = collectSurveyFileZip.getEntryAsText(`data/${step}/${entryName}`)
      if (collectRecordXml) {
        return { collectRecordXml, step }
      }
    }

    throw new Error(`Entry data not found: ${entryName}`)
  }

  async insertEntityNodes (survey, record, entityUuid, collectParentNodeDefPath, collectEntity, tx) {
    const { nodeDefUuidByCollectPath } = this.context

    for (const collectNodeDefChildName of R.keys(collectEntity)) {
      const collectNodeDefChildPath = collectParentNodeDefPath + '/' + collectNodeDefChildName
      const nodeDefChildUuid = nodeDefUuidByCollectPath[collectNodeDefChildPath]

      if (nodeDefChildUuid) {
        const childDef = Survey.getNodeDefByUuid(nodeDefChildUuid)(survey)

        const collectChildNodes = CollectIdmlParseUtils.getList([collectNodeDefChildName])(collectEntity)

        for (const collectChildNode of collectChildNodes) {

          let childNodeToInsert = Node.newNode(NodeDef.getUuid(childDef), Record.getUuid(record), entityUuid)

          if (NodeDef.isNodeDefAttribute(childDef)) {
            const value = await extractAttributeValue(survey, childDef, collectChildNode, tx)
            childNodeToInsert = Node.assocValue(value)(childNodeToInsert)
          }

          const childNode = await NodeRepository.insertNode(Survey.getId(survey), childNodeToInsert, tx)

          record = Record.assocNode(childNode)(record)

          if (NodeDef.isNodeDefEntity(childDef)) {
            await this.insertEntityNodes(survey, record, Node.getUuid(childNode), collectNodeDefChildPath, collectChildNode, tx)
          }
        }
      }
    }
  }
}

const extractAttributeValue = async (survey, nodeDef, collectNode, tx) => {
  const surveyId = Survey.getId(survey)

  switch (NodeDef.getType(nodeDef)) {
    case nodeDefType.boolean:
      const { value } = collectNode
      return value ? 'true' : 'false'
    case nodeDefType.decimal:
    case nodeDefType.integer:
    case nodeDefType.text:
      return collectNode['value']
    case nodeDefType.code: {
      const { code } = collectNode

      const categoryUuid = NodeDef.getNodeDefCategoryUuid(nodeDef)
      const levelIndex = Survey.getNodeDefCategoryLevelIndex(nodeDef)(survey)
      const items = await CategoryManager.fetchItemsByLevelIndex(surveyId, categoryUuid, levelIndex, false, tx)
      const item = R.find(item => Category.getItemCode(item) === code, items)
      return item
        ? { [Node.valuePropKeys.itemUuid]: Category.getUuid(item) }
        : null
    }
    case nodeDefType.coordinate: {
      const { x, y, srs } = collectNode

      return {
        [Node.valuePropKeys.x]: x,
        [Node.valuePropKeys.y]: y,
        [Node.valuePropKeys.srs]: srs
      }
    }
    case nodeDefType.date: {
      const { day, month, year } = collectNode

      return DateUtils.formatDate(day, month, year)
    }
    case nodeDefType.time: {
      const { hour, minute } = collectNode

      return DateUtils.formatTime(hour, minute)
    }
    case nodeDefType.taxon: {
      const { code, scientific_name, vernacularName } = collectNode

      const taxonomyUuid = NodeDef.getNodeDefTaxonomyUuid(nodeDef)

      const unlistedTaxon = await TaxonomyManager.fetchTaxonByCode(surveyId, taxonomyUuid, Taxonomy.unlistedCode, false, tx)

      if (vernacularName) {

        const taxa = await TaxonomyManager.fetchTaxaByVernacularName(surveyId, taxonomyUuid, vernacularName, false, false, tx)
        const taxon = R.head(taxa)

        return taxon
          ? {
            [Node.valuePropKeys.taxonUuid]: Taxonomy.getUuid(taxon),
            [Node.valuePropKeys.vernacularNameUuid]: Taxonomy.getTaxonVernacularNameUuid(taxon),
          }
          : {
            [Node.valuePropKeys.taxonUuid]: Taxonomy.getUuid(unlistedTaxon),
            [Node.valuePropKeys.vernacularName]: vernacularName
          }
      } else if (code) {
        const taxon = await TaxonomyManager.fetchTaxonByCode(surveyId, taxonomyUuid, code, false, tx)
        return taxon
          ? {
            [Node.valuePropKeys.taxonUuid]: Taxonomy.getUuid(taxon)
          }
          : {
            [Node.valuePropKeys.taxonUuid]: Taxonomy.getUuid(unlistedTaxon),
            [Node.valuePropKeys.scientificName]: scientific_name
          }

      } else {
        return null
      }
    }
    case nodeDefType.file: {
      //TODO
      return null
    }
  }

}

module.exports = RecordsImportJob