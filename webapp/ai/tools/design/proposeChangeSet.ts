/**
 * Shared end of every propose tool: validate the proposal on a survey copy and hand it to the conversation.
 * Nothing is written: the user applies the change set from its card.
 */
import { z } from 'zod'

import * as NodeDefExpression from '@core/survey/nodeDefExpression'

import { AiLimits } from '@common/ai/limits'

import { buildChangeSet } from '@webapp/ai/changeSets/buildChangeSet'
import { isDeepEqual } from '@webapp/ai/changeSets/deepEqual'
import { previewChangeSet } from '@webapp/ai/changeSets/previewChangeSet'
import type { ChangeOperationDraft, ChangeSetIssue } from '@webapp/ai/changeSets/types'

import { AiToolFailure } from '../toolFailure'
import type { AiToolContext } from '../types'
import { requireSurvey } from './surveyLookup'

export const textItemSchema = z.object({
  lang: z.string().min(2).max(10).describe('Language code of the survey, e.g. "en"'),
  text: z.string().trim().min(1).max(2000),
})

export const summarySchema = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .describe('One sentence for the user: what the proposal changes and why')

export type ProposeResult = { changeSetId: string; operations: number; status: 'shownToUser'; note: string }

/**
 * Converts `[{ lang, text }]` to `{ [lang]: text }` (the last text of a language wins).
 * @param {object[]} [items] - Texts by language.
 * @returns {object|undefined} The map, undefined when there are no items.
 */
export const toTextMap = (items?: { lang: string; text: string }[]): Record<string, string> | undefined => {
  if (!items || items.length === 0) return undefined
  return Object.fromEntries(items.map(({ lang, text }) => [lang, text]))
}

/**
 * Tells whether two expression lists are the same for the user (expression, severity and messages).
 * @param {object[]} from - Current expressions.
 * @param {object[]} to - Proposed expressions.
 * @returns {boolean} True when nothing differs.
 */
const expressionsAreSimilar = (from: any[], to: any[]): boolean =>
  from.length === to.length &&
  from.every(
    (expression, index) =>
      NodeDefExpression.isSimilarTo(expression)(to[index]) &&
      isDeepEqual(expression.severity, to[index].severity) &&
      isDeepEqual(expression.messages, to[index].messages)
  )

/**
 * Tells whether the target already has the proposed value (it would only add noise to the card).
 * @param {ChangeOperationDraft} draft - The proposed operation.
 * @returns {boolean} True when the operation changes nothing.
 */
const changesNothing = (draft: ChangeOperationDraft): boolean => {
  if (draft.type === 'nodeDef.create') return false
  if (draft.type === 'expression.set') return expressionsAreSimilar(draft.from, draft.to)
  return isDeepEqual(draft.from, draft.to)
}

/**
 * Validates the proposed operations and hands the change set to the conversation.
 * @param {object} params - Parameters.
 * @param {AiToolContext} params.ctx - Tool context.
 * @param {ChangeOperationDraft[]} params.drafts - Proposed operations, in order.
 * @param {string} params.summary - The model's summary.
 * @returns {Promise<ProposeResult>} The change set id and the number of operations.
 */
const ISSUES_BUDGET = AiLimits.assistantToolResultMaxChars - 500

/**
 * Keeps the first issues whose JSON fits the result budget.
 * @param {ChangeSetIssue[]} issues - All issues.
 * @returns {ChangeSetIssue[]} The leading issues that fit.
 */
const capIssues = (issues: ChangeSetIssue[]): ChangeSetIssue[] => {
  const kept: ChangeSetIssue[] = []
  let size = 2
  for (const issue of issues) {
    size += JSON.stringify(issue).length + 1
    if (size > ISSUES_BUDGET) break
    kept.push(issue)
  }
  return kept
}

export const proposeChangeSet = async ({
  ctx,
  drafts,
  summary,
}: {
  ctx: AiToolContext
  drafts: ChangeOperationDraft[]
  summary: string
}): Promise<ProposeResult> => {
  const survey = requireSurvey(ctx)
  // issue indexes must point at the model's own list, not at the filtered one
  const originalIndexes: number[] = []
  const effective = drafts.filter((draft, index) => {
    const keep = !changesNothing(draft)
    if (keep) originalIndexes.push(index)
    return keep
  })
  if (effective.length === 0) {
    throw new AiToolFailure('noChange', 'Every proposed value is already set: there is nothing to propose.')
  }
  const changeSet = buildChangeSet({ drafts: effective, survey, summary })
  const { validation } = await previewChangeSet(changeSet, survey, { t: ctx.t })
  if (!validation.valid) {
    throw new AiToolFailure(
      'invalidProposal',
      'The proposal was not shown to the user. Fix the issues (operation = index in your proposal) and propose again.',
      {
        issues: capIssues(
          validation.issues.map((issue) => ({
            ...issue,
            operation: originalIndexes[issue.operation] ?? issue.operation,
          }))
        ),
        issuesTotal: validation.issues.length,
      }
    )
  }
  ctx.onChangeSet(changeSet)
  return {
    changeSetId: changeSet.id,
    operations: changeSet.operations.length,
    status: 'shownToUser',
    note: 'The user reviews the card and applies it. Nothing is saved yet: never say it was.',
  }
}
