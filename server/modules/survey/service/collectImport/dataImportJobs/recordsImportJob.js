const R = require('ramda')
const { uuidv4 } = require('../../../../../../common/uuid')

const DateUtils = require('../../../../../../common/dateUtils')

const Survey = require('../../../../../../common/survey/survey')
const NodeDef = require('../../../../../../common/survey/nodeDef')
const { nodeDefType } = NodeDef
const Category = require('../../../../../../common/survey/category')
const Taxonomy = require('../../../../../../common/survey/taxonomy')
const Record = require('../../../../../../common/record/record')
const Node = require('../../../../../../common/record/node')
const RecordFile = require('../../../../../../common/record/recordFile')

const SurveyManager = require('../../../../survey/persistence/surveyManager')
const CategoryManager = require('../../../../category/persistence/categoryManager')
const TaxonomyManager = require('../../../../taxonomy/persistence/taxonomyManager')
const RecordManager = require('../../../../record/persistence/recordManager')
const NodeRepository = require('../../../../record/persistence/nodeRepository')
const FileManager = require('../../../../record/persistence/fileManager')

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
      const record = await RecordManager.insertRecord(surveyId, recordToCreate, tx)

      const collectRootEntityName = R.pipe(
        R.keys,
        R.head,
      )(collectRecordJson)

      const collectRootEntity = collectRecordJson[collectRootEntityName]

      await this.insertNode(survey, record, null, `/${collectRootEntityName}`, collectRootEntity, tx)

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

  async insertNode (survey, record, parentUuid, collectNodeDefPath, collectNode, tx) {
    const { nodeDefUuidByCollectPath } = this.context

    const nodeDefUuid = nodeDefUuidByCollectPath[collectNodeDefPath]
    const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

    let nodeToInsert = Node.newNode(nodeDefUuid, Record.getUuid(record), parentUuid)

    if (NodeDef.isNodeDefAttribute(nodeDef)) {
      const value = await this.extractAttributeValue(survey, nodeDef, nodeToInsert, collectNodeDefPath, collectNode, tx)
      nodeToInsert = Node.assocValue(value)(nodeToInsert)
    }

    const node = await NodeRepository.insertNode(Survey.getId(survey), nodeToInsert, tx)
    record = Record.assocNode(node)(record)

    if (NodeDef.isNodeDefEntity(nodeDef)) {
      for (const collectNodeDefChildName of R.keys(collectNode)) {
        const collectNodeDefChildPath = collectNodeDefPath + '/' + collectNodeDefChildName
        const nodeDefChildUuid = nodeDefUuidByCollectPath[collectNodeDefChildPath]

        if (nodeDefChildUuid) {
          const collectChildNodes = CollectIdmlParseUtils.getList([collectNodeDefChildName])(collectNode)
          for (const collectChildNode of collectChildNodes) {
            record = await this.insertNode(survey, record, Node.getUuid(node), collectNodeDefChildPath, collectChildNode, tx)
          }
        }
      }
    }
    return record
  }

  async extractAttributeValue (survey, nodeDef, node, collectNodeDefPath, collectNode, tx) {
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

        const { file_name, file_size } = collectNode
        const collectSurveyFileZip = this.getContextProp('collectSurveyFileZip')
        const collectNodeDef = this.getCollectNodeDefByPath(collectNodeDefPath)

        const collectNodeDefId = collectNodeDef._attr.id
        const content = collectSurveyFileZip.getEntryData(`upload/${collectNodeDefId}/${file_name}`)

        if (content) {
          const fileUuid = uuidv4()
          const file = RecordFile.createFile(fileUuid, file_name, file_size, content, Node.getRecordUuid(node), Node.getUuid(node))
          await FileManager.insertFile(surveyId, file, tx)

          return {
            [Node.valuePropKeys.fileUuid]: fileUuid,
            [Node.valuePropKeys.fileName]: file_name,
            [Node.valuePropKeys.fileSize]: file_size
          }
        } else {
          return null
        }
      }
    }
  }

  getCollectNodeDefByPath (collectNodeDefPath) {
    const collectSurvey = this.getContextProp('collectSurvey')

    const collectAncestorNodeNames = R.pipe(
      R.split('/'),
      R.reject(R.isEmpty)
    )(collectNodeDefPath)

    let currentCollectNode = collectSurvey.schema

    for (const collectAncestorNodeName of collectAncestorNodeNames) {
      const collectChildNodeDef = R.pipe(
        R.values,
        R.find(n => R.path(['_attr', 'name'], n) === collectAncestorNodeName)
      )(currentCollectNode)

      if (collectChildNodeDef)
        currentCollectNode = collectChildNodeDef
      else
        return null //node def not found
    }

    return currentCollectNode
  }

}

module.exports = RecordsImportJob