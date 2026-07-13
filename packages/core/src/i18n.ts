import type { Middleware } from './composer'
import type { Context } from './context'

type Dict = Record<string, string>

export interface I18nOptions {
  fallback?: string
  locale?: (ctx: Context) => string | undefined
}

// flat key -> string dictionaries with {var} interpolation. locale comes from
// ctx.session.locale if set, else telegram's language_code
export function i18n(locales: Record<string, Dict>, opts: I18nOptions = {}): Middleware {
  const fallback = opts.fallback ?? Object.keys(locales)[0]
  const pick = opts.locale ?? defaultLocale

  return (ctx, next) => {
    ctx.t = (key, vars = {}) => {
      const lang = normalize(pick(ctx))
      const msg =
        locales[lang]?.[key] ?? (fallback !== undefined ? locales[fallback]?.[key] : undefined) ?? key
      return interpolate(msg, vars)
    }
    return next()
  }
}

const defaultLocale = (ctx: Context) =>
  (ctx.session as { locale?: string } | undefined)?.locale ?? ctx.from?.language_code

function normalize(locale: string | undefined): string {
  return locale?.toLowerCase().split(/[-_]/)[0] ?? ''
}

function interpolate(msg: string, vars: Record<string, unknown>): string {
  return msg.replace(/\{(\w+)\}/g, (whole, key) => (key in vars ? String(vars[key]) : whole))
}
