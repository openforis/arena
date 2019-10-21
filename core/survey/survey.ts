import * as R from 'ramda';
import { uuidv4 } from '../uuid';
import SurveyInfo from './_survey/surveyInfo';
import SurveyCycle from './surveyCycle';
import SurveyNodeDefs, { INodeDefs } from './_survey/surveyNodeDefs';
import SurveyNodeDefsValidation from './_survey/surveyNodeDefsValidation';
import SurveyCategories from './_survey/surveyCategories';
import SurveyTaxonomies from './_survey/surveyTaxonomies';
import SurveyDefaults from './_survey/surveyDefaults';
import SurveyDependencies from './_survey/surveyDependencies';
import SurveyRefDataIndex from './_survey/surveyRefDataIndex';
import Srs, { ISRS } from '../geo/srs';

export interface IValidation {
  valid: boolean;
  fields: {};
  errors: any[];
  warnings: any[];
}
export interface ISurveyLabels { [s: string]: string; }
export interface ISurveyCycles { cycleOneKey: string; }
export interface ISurveyProps {
  name: string;
  labels: ISurveyLabels;
  languages: string[];
  srs: ISRS[];
  cycles: ISurveyCycles
}
export interface ISurveyInfo {
  uuid: string
  props: ISurveyProps;

  id?: string;
  published?: boolean;
  draft?: boolean;
  ownerUuid?: string;
  dateCreated?: string;
  dateModified?: string;
  authGroups?: Object[];
  validation?: IValidation | null
}

export interface ISurvey extends INodeDefs {
  info: ISurveyInfo;
  dependencyGraph: {
   defaultValues: {
     [uuid: string]: any[][];
   }
  }
}

const newSurvey = (ownerUuid, name, label, lang, collectUri = null) => ({
  uuid: uuidv4(),
  props: {
    name: name,
    labels: { [lang]: label },
    languages: [lang],
    srs: [R.omit([Srs.keys.wkt], Srs.latLonSrs)],
    ...((collectUri ? { collectUri } : {})),
    cycles: {
      [SurveyInfo.cycleOneKey]: SurveyCycle.newCycle()
    }
  },
  ownerUuid: ownerUuid,
})

export default {
  newSurvey,

  infoKeys: SurveyInfo.keys,
  dependencyTypes: SurveyDependencies.dependencyTypes,
  collectReportKeys: SurveyInfo.collectReportKeys,
  cycleOneKey: SurveyInfo.cycleOneKey,

  // ====== DEFAULTS
  getDefaultAuthGroups: SurveyDefaults.getDefaultAuthGroups,

  // READ
  getId: R.pipe(SurveyInfo.getInfo, SurveyInfo.getId),
  getIdSurveyInfo: SurveyInfo.getId,
  getSurveyInfo: SurveyInfo.getInfo,

  // === context is surveyInfo
  getUuid: SurveyInfo.getUuid,
  getName: SurveyInfo.getName,
  getLanguages: SurveyInfo.getLanguages,
  getLanguage: SurveyInfo.getLanguage,
  getDefaultLanguage: SurveyInfo.getDefaultLanguage,
  getLabels: SurveyInfo.getLabels,
  getLabel: SurveyInfo.getLabel,
  getDefaultLabel: SurveyInfo.getDefaultLabel,
  getDescriptions: SurveyInfo.getDescriptions,
  getSRS: SurveyInfo.getSRS,
  getDefaultSRS: SurveyInfo.getDefaultSRS,
  getStatus: SurveyInfo.getStatus,
  getCycles: SurveyInfo.getCycles,
  getCycleKeys: SurveyInfo.getCycleKeys,
  getDateCreated: SurveyInfo.getDateCreated,
  getDateModified: SurveyInfo.getDateModified,
  isPublished: SurveyInfo.isPublished,
  isDraft: SurveyInfo.isDraft,
  isValid: SurveyInfo.isValid,
  isFromCollect: SurveyInfo.isFromCollect,
  getCollectUri: SurveyInfo.getCollectUri,
  getCollectReport: SurveyInfo.getCollectReport,
  hasCollectReportIssues: SurveyInfo.hasCollectReportIssues,

  getAuthGroups: SurveyInfo.getAuthGroups,
  isAuthGroupAdmin: SurveyInfo.isAuthGroupAdmin,
  getAuthGroupAdmin: SurveyInfo.getAuthGroupAdmin,

  // UPDATE
  markDraft: SurveyInfo.markDraft,

  // ====== READ nodeDefs
  getNodeDefs: SurveyNodeDefs.getNodeDefs,
  getNodeDefsArray: SurveyNodeDefs.getNodeDefsArray,
  getNodeDefsByUuids: SurveyNodeDefs.getNodeDefsByUuids,
  getNodeDefRoot: SurveyNodeDefs.getNodeDefRoot,
  getNodeDefByUuid: SurveyNodeDefs.getNodeDefByUuid,
  getNodeDefChildren: SurveyNodeDefs.getNodeDefChildren,
  hasNodeDefChildrenEntities: SurveyNodeDefs.hasNodeDefChildrenEntities,
  getNodeDefChildByName: SurveyNodeDefs.getNodeDefChildByName,
  getNodeDefSiblingByName: SurveyNodeDefs.getNodeDefSiblingByName,
  getNodeDefByName: SurveyNodeDefs.getNodeDefByName,
  getNodeDefsByCategoryUuid: SurveyNodeDefs.getNodeDefsByCategoryUuid,
  getNodeDefsByTaxonomyUuid: SurveyNodeDefs.getNodeDefsByTaxonomyUuid,
  getNodeDefParent: SurveyNodeDefs.getNodeDefParent,
  getNodeDefKeys: SurveyNodeDefs.getNodeDefKeys,
  isNodeDefRootKey: SurveyNodeDefs.isNodeDefRootKey,
  findNodeDef: SurveyNodeDefs.findNodeDef,

  // hierarchy
  isNodeDefAncestor: SurveyNodeDefs.isNodeDefAncestor,
  visitAncestorsAndSelf: SurveyNodeDefs.visitAncestorsAndSelf,
  getHierarchy: SurveyNodeDefs.getHierarchy,
  traverseHierarchyItem: SurveyNodeDefs.traverseHierarchyItem,
  traverseHierarchyItemSync: SurveyNodeDefs.traverseHierarchyItemSync,

  // ====== READ dependencies
  getNodeDefDependencies: SurveyDependencies.getNodeDefDependencies,

  // ====== UPDATE
  assocNodeDefs: SurveyNodeDefs.assocNodeDefs,
  assocDependencyGraph: SurveyDependencies.assocDependencyGraph,
  buildDependencyGraph: SurveyDependencies.buildGraph,

  // ====== NodeDefsValidation
  getNodeDefsValidation: SurveyNodeDefsValidation.getNodeDefsValidation,
  assocNodeDefsValidation: SurveyNodeDefsValidation.assocNodeDefsValidation,
  getNodeDefValidation: SurveyNodeDefsValidation.getNodeDefValidation,

  // ====== NodeDef Code
  getNodeDefCategoryLevelIndex: SurveyNodeDefs.getNodeDefCategoryLevelIndex,
  getNodeDefParentCode: SurveyNodeDefs.getNodeDefParentCode,
  getNodeDefCodeCandidateParents: SurveyNodeDefs.getNodeDefCodeCandidateParents,

  //TODO check where used
  canUpdateCategory: SurveyNodeDefs.canUpdateCategory,
  isNodeDefParentCode: SurveyNodeDefs.isNodeDefParentCode,

  // ====== Categories
  getCategories: SurveyCategories.getCategories,
  getCategoriesArray: SurveyCategories.getCategoriesArray,
  getCategoryByUuid: SurveyCategories.getCategoryByUuid,
  assocCategories: SurveyCategories.assocCategories,

  // ====== Taxonomies
  getTaxonomiesArray: SurveyTaxonomies.getTaxonomiesArray,
  getTaxonomyByUuid: SurveyTaxonomies.getTaxonomyByUuid,
  assocTaxonomies: SurveyTaxonomies.assocTaxonomies,
  canUpdateTaxonomy: SurveyNodeDefs.canUpdateTaxonomy,

  // ====== Survey Reference data index
  // category index
  getCategoryItemUuidAndCodeHierarchy: SurveyRefDataIndex.getCategoryItemUuidAndCodeHierarchy,
  getCategoryItemByUuid: SurveyRefDataIndex.getCategoryItemByUuid,
  // taxon index
  getTaxonUuid: SurveyRefDataIndex.getTaxonUuid,
  getTaxonVernacularNameUuid: SurveyRefDataIndex.getTaxonVernacularNameUuid,
  getTaxonByUuid: SurveyRefDataIndex.getTaxonByUuid,
  includesTaxonVernacularName: SurveyRefDataIndex.includesTaxonVernacularName,

  assocRefData: SurveyRefDataIndex.assocRefData,
};
