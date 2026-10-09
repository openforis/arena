/**
 * Assistant tools: what the model may call in the browser. The shape matches WebMCP (name, description, JSON-schema
 * input), so the tools can be registered with navigator.modelContext later.
 */
import type { z } from 'zod'
import type { Survey as ArenaSurvey, User as ArenaUser } from '@openforis/arena-core'

import type { AiDataClass } from '@common/ai/features'

import type { ChangeSet } from '@webapp/ai/changeSets/types'

import type { AnalysisQueryStore } from './analysis/queryStore'

export type AiToolArea = 'design' | 'help' | 'analysis' | 'cleaning'

export type AiToolEffect = 'read' | 'propose'

export type AiCurrentView = { module: string | null; subModule: string | null; selectedNodeDefUuid: string | null }

export type AiTranslate = (key: string, params?: Record<string, unknown>) => string

export type AiToolContext = {
  getState: () => any
  dispatch: (action: any) => any
  user: ArenaUser
  // the draft survey in Redux; null in the Help area (no survey content leaves the browser there)
  survey: ArenaSurvey | null
  cycle: string | null
  // survey preferred language
  lang: string
  // the user's interface language
  uiLang: string
  signal: AbortSignal
  // computed once with the Authorizer, so `requires` stays a pure function
  canViewSurvey: boolean
  canEditSurvey: boolean
  getCurrentView: () => AiCurrentView
  // translates i18n keys (validation messages of a refused proposal)
  t: AiTranslate
  // a propose tool hands its validated change set to the conversation here (never persisted by the tool)
  onChangeSet: (changeSet: ChangeSet) => void
  // analysis area: queries proposed in the current conversation (D2)
  analysisQueries?: AnalysisQueryStore
}

export type AiTool<I = any, O = unknown> = {
  // /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/: valid for WebMCP and every provider's function names
  name: string
  description: string
  inputSchema: z.ZodType<I>
  area: AiToolArea[]
  // what the result may expose (checked against the survey AI policy)
  dataClass: AiDataClass
  effect: AiToolEffect
  requires: (ctx: AiToolContext) => boolean
  execute: (input: I, ctx: AiToolContext) => Promise<O>
}

export type AiToolErrorResult = { error: { code: string; message: string; [detail: string]: unknown } }
