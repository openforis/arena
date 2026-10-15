/**
 * Who may use a tool: the one set of `requires` checks (a tool is offered only when its check passes).
 */
import * as Survey from '@core/survey/survey'
import * as Authorizer from '@core/auth/authorizer'

import type { AiToolContext } from '../types'

/**
 * Returns true when a survey is open and the user may view it.
 * @param {AiToolContext} ctx - Tool context.
 * @returns {boolean} True when allowed.
 */
export const canViewCurrentSurvey = (ctx: AiToolContext): boolean => ctx.survey !== null && ctx.canViewSurvey

/**
 * Returns true when a survey is open and the user may edit it.
 * @param {AiToolContext} ctx - Tool context.
 * @returns {boolean} True when allowed.
 */
export const canEditCurrentSurvey = (ctx: AiToolContext): boolean => ctx.survey !== null && ctx.canEditSurvey

/**
 * Returns true when a survey is open and the user can cleanse its records.
 * @param {AiToolContext} ctx - Tool context.
 * @returns {boolean} True when allowed.
 */
export const canCleanseCurrentSurvey = (ctx: AiToolContext): boolean =>
  !!ctx.survey && Authorizer.canCleanseRecords(ctx.user, Survey.getSurveyInfo(ctx.survey))
