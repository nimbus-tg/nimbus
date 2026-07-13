import { Composer, type Middleware } from './composer'
import { Context, type RawCtx } from './context'

type ErrorHandler = (err: unknown, ctx: Context) => unknown

export class Bot extends Composer {
  #types = new Set<string>()
  #onError?: ErrorHandler

  on(type: string, ...mw: Middleware[]): this {
    this.#types.add(type)
    return super.on(type, ...mw)
  }

  command(name: string, ...mw: Middleware[]): this {
    this.#types.add('message')
    return super.command(name, ...mw)
  }

  hears(re: RegExp, ...mw: Middleware[]): this {
    this.#types.add('message')
    return super.hears(re, ...mw)
  }

  catch(handler: ErrorHandler): this {
    this.#onError = handler
    return this
  }

  // update types this bot subscribes to; `nimbus vendor` reads this to know
  // which handlers/*.js shims to generate
  updateTypes(): string[] {
    return [...this.#types].sort()
  }

  async handle(type: string, payload: unknown, raw?: RawCtx): Promise<Context> {
    const ctx = new Context(type, payload, raw)
    try {
      await this.middleware()(ctx, async () => {})
    } catch (err) {
      if (!this.#onError) throw err
      await this.#onError(err, ctx)
    }
    return ctx
  }
}
