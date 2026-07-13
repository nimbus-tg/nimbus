import type { Context } from './context'

export type NextFn = () => Promise<void>
export type Middleware = (ctx: Context, next: NextFn) => unknown

export function compose(stack: Middleware[]): Middleware {
  return (ctx, next) => {
    let last = -1
    async function dispatch(i: number): Promise<void> {
      if (i <= last) throw new Error('next() called twice in the same middleware')
      last = i
      const fn = i === stack.length ? next : stack[i]
      if (fn) await fn(ctx, () => dispatch(i + 1))
    }
    return dispatch(0)
  }
}

function branch(pred: (ctx: Context) => boolean, mw: Middleware[]): Middleware {
  const handler = compose(mw)
  return (ctx, next) => (pred(ctx) ? handler(ctx, next) : next())
}

export class Composer {
  protected stack: Middleware[] = []

  use(...mw: Middleware[]): this {
    this.stack.push(...mw)
    return this
  }

  on(type: string, ...mw: Middleware[]): this {
    return this.use(branch((ctx) => ctx.updateType === type, mw))
  }

  command(name: string, ...mw: Middleware[]): this {
    return this.use(
      branch((ctx) => {
        const text = ctx.message?.text
        if (!text?.startsWith('/')) return false
        const [head = '', ...rest] = text.slice(1).split(/\s+/)
        if (head.split('@')[0] !== name) return false
        ctx.match = rest.join(' ')
        return true
      }, mw),
    )
  }

  hears(re: RegExp, ...mw: Middleware[]): this {
    return this.use(
      branch((ctx) => {
        const text = ctx.message?.text
        if (!text) return false
        const m = text.match(re)
        if (!m) return false
        ctx.match = m
        return true
      }, mw),
    )
  }

  middleware(): Middleware {
    return compose(this.stack)
  }
}
