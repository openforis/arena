import * as Survey from '@core/survey/survey'
import * as SurveyAreaOfInterest from '@core/survey/surveyAreaOfInterest'
import * as SurveyFile from '@core/survey/surveyFile'
import * as SurveyBranding from '@core/survey/surveyBranding'
import * as ObjectUtils from '@core/objectUtils'

import {
  SurveyCompareApplicabilityStatus,
  SurveyComparePropGroup,
  SurveyCompareReason,
  SurveyCompareStatus,
  SurveyCompareSurveyFileDiff,
  SurveyCompareSurveyInfoDiff,
} from './surveyCompareTypes'
import { getDifferentKeys, normalizeValue } from './surveyCompareValues'

const { infoKeys } = Survey

export const surveyInfoChangeId = (key: string): string => `surveyInfo:${key}`
export const surveyFileChangeId = ({ kind, key }: { kind: string; key: string }): string => `surveyFile:${kind}:${key}`

/** Survey info props compared (and updated) by the survey comparison. */
export const comparedSurveyInfoProps: string[] = [
  infoKeys.languages,
  infoKeys.labels,
  infoKeys.descriptions,
  infoKeys.cycles,
  infoKeys.defaultCycleKey,
  infoKeys.srs,
  infoKeys.fieldManualLinks,
  infoKeys.keepNonApplicableValues,
  infoKeys.sampleBasedImageInterpretationEnabled,
  infoKeys.samplingPolygon,
  infoKeys.userExtraPropDefs,
  infoKeys.preloadedMapLayersEnabled,
  infoKeys.surveyDocOptions,
  infoKeys.branding,
]

const brandingImageKeys: string[] = [...SurveyBranding.surveyLogoKeys, SurveyBranding.keys.landingBackground]

// branding images are compared as survey files
const withoutBrandingImages = (branding: Record<string, any> = {}) =>
  Object.fromEntries(Object.entries(branding ?? {}).filter(([key]) => !brandingImageKeys.includes(key)))

const getInfoProps = (survey: any): Record<string, any> => ObjectUtils.getProps(Survey.getSurveyInfo(survey)) ?? {}

// the area of interest file uuids differ in every survey: the files are identified by name and summary
const withoutFileUuids = (areasOfInterest: Record<string, any>[] | null | undefined) =>
  areasOfInterest?.map((areaOfInterest) =>
    Object.fromEntries(Object.entries(areaOfInterest).filter(([key]) => key !== SurveyAreaOfInterest.keys.fileUuid))
  )

export const normalizeSurveyInfoProp = ({ key, value }: { key: string; value: any }) => {
  if (key === infoKeys.srs) {
    return normalizeValue((value ?? []).map((srs: any) => srs.code).sort((a: string, b: string) => a.localeCompare(b)))
  }
  if (key === infoKeys.branding) return normalizeValue(withoutBrandingImages(value))
  if (key === infoKeys.areasOfInterest) return normalizeValue(withoutFileUuids(value))
  return normalizeValue(value, key)
}

const normalizeSurveyInfo = (survey: any): Record<string, any> => {
  const props = getInfoProps(survey)
  const result = {}
  for (const key of comparedSurveyInfoProps) {
    const value = normalizeSurveyInfoProp({ key, value: props[key] })
    if (value !== undefined) result[key] = value
  }
  return result
}

const isTargetPublished = (targetSurvey: any): boolean => {
  const surveyInfo = Survey.getSurveyInfo(targetSurvey)
  return Survey.isPublished(surveyInfo) && !Survey.isTemplate(surveyInfo)
}

const toApplicability = (warnings: string[]) => ({
  status:
    warnings.length > 0
      ? SurveyCompareApplicabilityStatus.applicableWithWarning
      : SurveyCompareApplicabilityStatus.applicable,
  reasons: warnings as any[],
})

const getRemovedKeys = ({ source, target }) => {
  const sourceKeys = Array.isArray(source) ? source : Object.keys(source ?? {})
  const targetKeys = Array.isArray(target) ? target : Object.keys(target ?? {})
  return targetKeys.filter((key: string) => !sourceKeys.includes(key))
}

const getSurveyInfoDiffApplicability = ({ key, source, target, published, diffKeys }) => {
  if (key === infoKeys.languages && published && getRemovedKeys({ source, target }).length > 0) {
    return { applicability: toApplicability([SurveyCompareReason.publishedLanguagesRemoved]), dependsOn: [] }
  }
  if (key === infoKeys.cycles && published && getRemovedKeys({ source, target }).length > 0) {
    return { applicability: toApplicability([SurveyCompareReason.publishedSurveyCyclesRemoved]), dependsOn: [] }
  }
  // the default cycle must exist: cycles are updated first
  if (key === infoKeys.defaultCycleKey && diffKeys.includes(infoKeys.cycles)) {
    return { applicability: toApplicability([]), dependsOn: [surveyInfoChangeId(infoKeys.cycles)] }
  }
  return { applicability: toApplicability([]), dependsOn: [] }
}

/**
 * Compares the survey info (languages, labels, cycles, SRS, ...) of two surveys.
 * @param {object} params - The parameters.
 * @param {any} params.sourceSurvey - Source survey.
 * @param {any} params.targetSurvey - Target survey.
 * @returns {SurveyCompareSurveyInfoDiff[]} - One diff for every different prop.
 */
export const compareSurveyInfo = ({ sourceSurvey, targetSurvey }): SurveyCompareSurveyInfoDiff[] => {
  const source = normalizeSurveyInfo(sourceSurvey)
  const target = normalizeSurveyInfo(targetSurvey)
  const published = isTargetPublished(targetSurvey)
  const diffKeys = getDifferentKeys({ source, target })
  return diffKeys.map((key) => ({
    id: surveyInfoChangeId(key),
    key,
    status: SurveyCompareStatus.changed,
    propDiffs: [{ key, group: SurveyComparePropGroup.props, source: source[key], target: target[key] }],
    ...getSurveyInfoDiffApplicability({ key, source: source[key], target: target[key], published, diffKeys }),
    linkedTo: [],
  }))
}

// ===== SURVEY FILES

const SurveyFileKind = {
  preloadedMapLayers: 'preloadedMapLayers',
  surveyDocImages: 'surveyDocImages',
  branding: 'branding',
  areaOfInterest: 'areaOfInterest',
} as const

// survey info prop holding the files of each kind (when different from the kind)
const surveyInfoKeyByFileKind: Record<string, string> = {
  [SurveyFileKind.areaOfInterest]: infoKeys.areasOfInterest,
}

interface SurveyFileEntry {
  kind: string
  key: string
  name: string
  fileType: string
  fileUuid: string
  normalized: Record<string, any>
  summary: any
}

const getListFileEntries = ({ survey, kind }): SurveyFileEntry[] =>
  ((getInfoProps(survey)[kind] ?? []) as any[]).map((summary) => ({
    kind,
    key: SurveyFile.getName(summary),
    name: SurveyFile.getName(summary),
    fileType: SurveyFile.getType(summary),
    fileUuid: SurveyFile.getUuid(summary),
    normalized: normalizeValue({ size: SurveyFile.getSize(summary), labels: SurveyFile.getLabels(summary) }) ?? {},
    summary,
  }))

const getBrandingFileEntries = (survey: any): SurveyFileEntry[] => {
  const branding = getInfoProps(survey)[infoKeys.branding] ?? {}
  const summaryByUuid = Object.fromEntries(
    SurveyBranding.getBrandingFileSummaries(branding).map((summary) => [summary.uuid, summary])
  )
  return brandingImageKeys.flatMap((key) => {
    const descriptor = branding[key]
    const summary = summaryByUuid[descriptor?.[SurveyBranding.keys.fileUuid]]
    if (!summary) return []
    const { name, size } = descriptor
    return [
      {
        kind: SurveyFileKind.branding,
        key,
        name: name ?? key,
        fileType: summary.props.type,
        fileUuid: summary.uuid,
        normalized: normalizeValue({ name, size }) ?? {},
        summary,
      },
    ]
  })
}

const getAreaOfInterestFileEntries = (survey: any): SurveyFileEntry[] => {
  const summaries = SurveyAreaOfInterest.getAreaOfInterestFileSummaries(survey)
  return SurveyAreaOfInterest.getAreasOfInterest(survey).map(
    ({ name, labels, fileUuid, size, polygons, vertices }, index) => ({
      kind: SurveyFileKind.areaOfInterest,
      key: name,
      name,
      fileType: SurveyFile.SurveyFileType.areaOfInterest,
      fileUuid,
      normalized: normalizeValue({ labels, size, polygons, vertices }) ?? {},
      summary: summaries[index],
    })
  )
}

/**
 * Returns the survey files referenced by the survey info (preloaded map layers, survey doc images, branding images,
 * areas of interest).
 * @param {any} survey - The survey.
 * @returns {SurveyFileEntry[]} - The file entries.
 */
export const getSurveyFileEntries = (survey: any): SurveyFileEntry[] => [
  ...getListFileEntries({ survey, kind: SurveyFileKind.preloadedMapLayers }),
  ...getListFileEntries({ survey, kind: SurveyFileKind.surveyDocImages }),
  ...getBrandingFileEntries(survey),
  ...getAreaOfInterestFileEntries(survey),
]

const indexEntries = (entries: SurveyFileEntry[]): Record<string, SurveyFileEntry> =>
  Object.fromEntries(entries.map((entry) => [surveyFileChangeId(entry), entry]))

const newSurveyFileDiff = ({
  entry,
  status,
  sourceEntry,
  targetEntry,
  propDiffs = [],
}): SurveyCompareSurveyFileDiff => ({
  id: surveyFileChangeId(entry),
  sourceUuid: sourceEntry?.fileUuid,
  targetUuid: targetEntry?.fileUuid,
  name: entry.name,
  fileType: entry.fileType,
  status,
  propDiffs,
  applicability: { status: SurveyCompareApplicabilityStatus.applicable, reasons: [] },
  dependsOn: [],
  linkedTo: [],
})

/**
 * Compares the survey files (preloaded map layers, survey doc images, branding images, areas of interest) of two
 * surveys. Files are matched by name (branding images by slot, areas of interest by area name) and compared by size
 * and labels (areas of interest also by summary).
 * @param {object} params - The parameters.
 * @param {any} params.sourceSurvey - Source survey.
 * @param {any} params.targetSurvey - Target survey.
 * @returns {SurveyCompareSurveyFileDiff[]} - The survey file diffs (identical files excluded).
 */
export const compareSurveyFiles = ({ sourceSurvey, targetSurvey }): SurveyCompareSurveyFileDiff[] => {
  const sourceEntries = indexEntries(getSurveyFileEntries(sourceSurvey))
  const targetEntries = indexEntries(getSurveyFileEntries(targetSurvey))
  const diffs: SurveyCompareSurveyFileDiff[] = []
  for (const [id, sourceEntry] of Object.entries(sourceEntries)) {
    const targetEntry = targetEntries[id]
    if (!targetEntry) {
      diffs.push(newSurveyFileDiff({ entry: sourceEntry, status: SurveyCompareStatus.added, sourceEntry, targetEntry }))
      continue
    }
    const propDiffs = getDifferentKeys({ source: sourceEntry.normalized, target: targetEntry.normalized }).map(
      (key) => ({
        key,
        group: SurveyComparePropGroup.props,
        source: sourceEntry.normalized[key],
        target: targetEntry.normalized[key],
      })
    )
    if (propDiffs.length > 0) {
      diffs.push(
        newSurveyFileDiff({
          entry: sourceEntry,
          status: SurveyCompareStatus.changed,
          sourceEntry,
          targetEntry,
          propDiffs,
        })
      )
    }
  }
  for (const [id, targetEntry] of Object.entries(targetEntries)) {
    if (!sourceEntries[id]) {
      diffs.push(
        newSurveyFileDiff({ entry: targetEntry, status: SurveyCompareStatus.removed, sourceEntry: null, targetEntry })
      )
    }
  }
  return diffs.sort((diffA, diffB) => diffA.id.localeCompare(diffB.id))
}

// ===== APPLY PLAN

export interface SurveyInfoApplyPlan {
  /** Survey info props to update (complete values). */
  surveyProps: Record<string, any>
  /** Survey files to insert: content read from the source file with the source uuid. */
  surveyFilesToInsert: { sourceUuid: string; file: any }[]
  surveyFileUuidsToDelete: string[]
}

const getSourceSurveyInfoPropValue = ({ sourceSurvey, targetSurvey, key }) => {
  const sourceValue = getInfoProps(sourceSurvey)[key]
  if (key !== infoKeys.branding) return sourceValue ?? null
  // branding images are kept: they are updated as survey files
  const targetBranding = getInfoProps(targetSurvey)[key] ?? {}
  const targetImages = Object.fromEntries(Object.entries(targetBranding).filter(([k]) => brandingImageKeys.includes(k)))
  return { ...withoutBrandingImages(sourceValue), ...targetImages }
}

const newFileFromEntry = (entry: SurveyFileEntry) =>
  SurveyFile.createFile({
    // the entry name of an area of interest is the area name, not the file name
    name: entry.kind === SurveyFileKind.areaOfInterest ? entry.summary.props.name : entry.name,
    labels:
      entry.kind === SurveyFileKind.preloadedMapLayers || entry.kind === SurveyFileKind.surveyDocImages
        ? SurveyFile.getLabels(entry.summary)
        : null,
    size: entry.normalized.size ?? SurveyFile.getSize(entry.summary),
    type: entry.fileType,
  })

const toSummary = (file: any) => {
  const summary = { ...file }
  delete summary[SurveyFile.keys.content]
  return summary
}

const applyFileDiffToList = ({ list, diff, sourceEntry, newFile }) => {
  const withoutTarget = diff.targetUuid
    ? list.filter((summary) => SurveyFile.getUuid(summary) !== diff.targetUuid)
    : list
  if (!newFile) return withoutTarget
  const index = list.findIndex((summary) => SurveyFile.getUuid(summary) === diff.targetUuid)
  const newSummary = { ...sourceEntry.summary, ...toSummary(newFile) }
  if (index < 0) return [...withoutTarget, newSummary]
  const result = [...withoutTarget]
  result.splice(index, 0, newSummary)
  return result
}

// areas of interest are descriptors (not file summaries): matched by file uuid
const applyAreaOfInterestDiffToList = ({ list, diff, sourceSurvey, sourceEntry, newFile }) => {
  const index = list.findIndex((descriptor) => descriptor.fileUuid === diff.targetUuid)
  const result = index < 0 ? [...list] : list.filter((_descriptor, i) => i !== index)
  if (!newFile) return result
  const sourceDescriptor = SurveyAreaOfInterest.getAreasOfInterest(sourceSurvey).find(
    (descriptor) => descriptor.fileUuid === sourceEntry.fileUuid
  )
  const descriptor = { ...sourceDescriptor, fileUuid: SurveyFile.getUuid(newFile) }
  if (index < 0) return [...result, descriptor]
  result.splice(index, 0, descriptor)
  return result
}

const planSurveyFileDiff = ({ context, diff }) => {
  const { sourceSurvey, sourceEntries, targetEntries, plan, lists, branding } = context
  const sourceEntry = sourceEntries[diff.id]
  const targetEntry = targetEntries[diff.id]
  const entry = sourceEntry ?? targetEntry
  const newFile = sourceEntry ? newFileFromEntry(sourceEntry) : null
  if (newFile) plan.surveyFilesToInsert.push({ sourceUuid: sourceEntry.fileUuid, file: newFile })
  if (targetEntry) plan.surveyFileUuidsToDelete.push(targetEntry.fileUuid)
  if (entry.kind === SurveyFileKind.areaOfInterest) {
    lists[entry.kind] = applyAreaOfInterestDiffToList({
      list: lists[entry.kind],
      diff,
      sourceSurvey,
      sourceEntry,
      newFile,
    })
    context.listsChanged.add(entry.kind)
  } else if (entry.kind === SurveyFileKind.branding) {
    branding.value = { ...branding.value }
    if (newFile) {
      branding.value[entry.key] = SurveyBranding.newBrandingImageDescriptor({
        fileUuid: SurveyFile.getUuid(newFile),
        size: SurveyFile.getSize(newFile),
        name: SurveyFile.getName(newFile),
      })
    } else {
      delete branding.value[entry.key]
    }
    branding.changed = true
  } else {
    lists[entry.kind] = applyFileDiffToList({ list: lists[entry.kind], diff, sourceEntry, newFile })
    context.listsChanged.add(entry.kind)
  }
}

/**
 * Builds the changes to the survey info and to the survey files needed to apply the selected changes.
 * @param {object} params - The parameters.
 * @param {any} params.sourceSurvey - Source survey.
 * @param {any} params.targetSurvey - Target survey.
 * @param {SurveyCompareSurveyInfoDiff[]} params.surveyInfoDiffs - Survey info diffs.
 * @param {SurveyCompareSurveyFileDiff[]} params.surveyFileDiffs - Survey file diffs.
 * @param {Set<string>} params.appliedIds - Ids of the changes to apply.
 * @returns {SurveyInfoApplyPlan} - The plan.
 */
export const buildSurveyInfoApplyPlan = ({
  sourceSurvey,
  targetSurvey,
  surveyInfoDiffs,
  surveyFileDiffs,
  appliedIds,
}: {
  sourceSurvey: any
  targetSurvey: any
  surveyInfoDiffs: SurveyCompareSurveyInfoDiff[]
  surveyFileDiffs: SurveyCompareSurveyFileDiff[]
  appliedIds: Set<string>
}): SurveyInfoApplyPlan => {
  const plan: SurveyInfoApplyPlan = { surveyProps: {}, surveyFilesToInsert: [], surveyFileUuidsToDelete: [] }
  for (const diff of surveyInfoDiffs) {
    if (appliedIds.has(diff.id)) {
      plan.surveyProps[diff.key] = getSourceSurveyInfoPropValue({ sourceSurvey, targetSurvey, key: diff.key })
    }
  }
  const targetProps = getInfoProps(targetSurvey)
  const context = {
    sourceSurvey,
    sourceEntries: indexEntries(getSurveyFileEntries(sourceSurvey)),
    targetEntries: indexEntries(getSurveyFileEntries(targetSurvey)),
    plan,
    lists: {
      [SurveyFileKind.preloadedMapLayers]: targetProps[SurveyFileKind.preloadedMapLayers] ?? [],
      [SurveyFileKind.surveyDocImages]: targetProps[SurveyFileKind.surveyDocImages] ?? [],
      [SurveyFileKind.areaOfInterest]: targetProps[infoKeys.areasOfInterest] ?? [],
    },
    listsChanged: new Set<string>(),
    branding: { value: plan.surveyProps[infoKeys.branding] ?? targetProps[infoKeys.branding] ?? {}, changed: false },
  }
  for (const diff of surveyFileDiffs) {
    if (appliedIds.has(diff.id)) planSurveyFileDiff({ context, diff })
  }
  for (const kind of context.listsChanged) {
    plan.surveyProps[surveyInfoKeyByFileKind[kind] ?? kind] = context.lists[kind]
  }
  if (context.branding.changed) {
    plan.surveyProps[infoKeys.branding] = context.branding.value
  }
  return plan
}
