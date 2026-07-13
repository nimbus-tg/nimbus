import type { Middleware } from './composer'
import type { Context } from './context'

type StepFn = (ctx: Context) => unknown

interface WizardState {
  id: string
  step: number
  data: Record<string, any>
}

// multi-step dialogs as a plain FSM in the session. no generator/replay magic:
// the platform gives us one isolate invocation per update, so state must be
// serializable and every step is just a function of (state, update).
export class Wizard {
  readonly id: string
  readonly steps: StepFn[] = []

  constructor(id: string) {
    this.id = id
  }

  step(fn: StepFn): this {
    this.steps.push(fn)
    return this
  }
}

export class WizardControl {
  #ctx: Context
  #registry: Map<string, Wizard>
  #hold = false

  constructor(ctx: Context, registry: Map<string, Wizard>) {
    this.#ctx = ctx
    this.#registry = registry
  }

  get active(): string | undefined {
    return this.#state?.id
  }

  get data(): Record<string, any> {
    const st = this.#state
    if (!st) throw new Error('no active wizard')
    return st.data
  }

  async enter(id: string, data: Record<string, any> = {}): Promise<void> {
    const w = this.#registry.get(id)
    if (!w) throw new Error(`unknown wizard "${id}"`)
    this.#session().__wizard = { id, step: 0, data } satisfies WizardState
    await this.#run(w)
  }

  // keep the current step for the next update (e.g. invalid input, ask again)
  stay(): void {
    this.#hold = true
  }

  exit(): void {
    delete this.#session().__wizard
  }

  /** @internal */
  async _resume(w: Wizard): Promise<void> {
    await this.#run(w)
  }

  async #run(w: Wizard): Promise<void> {
    const st = this.#state
    if (!st) return
    const fn = w.steps[st.step]
    if (!fn) return this.exit()

    this.#hold = false
    await fn(this.#ctx)

    // the step may have exit()ed or enter()ed another wizard; only advance if
    // we are still on the same state object
    if (this.#state !== st || this.#hold) return
    st.step++
    if (st.step >= w.steps.length) this.exit()
  }

  get #state(): WizardState | undefined {
    return this.#session().__wizard
  }

  #session(): Record<string, any> {
    const s = this.#ctx.session
    if (s === null || typeof s !== 'object') {
      throw new Error('wizards() requires session() middleware with an object session')
    }
    return s as Record<string, any>
  }
}

export function wizards(...list: Wizard[]): Middleware {
  const registry = new Map(list.map((w) => [w.id, w]))
  return async (ctx, next) => {
    ctx.wizard = new WizardControl(ctx, registry)
    const state = (ctx.session as Record<string, any> | undefined)?.__wizard as WizardState | undefined
    if (!state) return next()

    // commands always fall through to the router, so /cancel etc. keep working
    // mid-flow; the wizard state stays put until someone exit()s it
    if (ctx.message?.text?.startsWith('/')) return next()

    const w = registry.get(state.id)
    if (!w) {
      // wizard was renamed/removed between deploys, drop the stale state
      ctx.wizard.exit()
      return next()
    }
    await ctx.wizard._resume(w)
  }
}
