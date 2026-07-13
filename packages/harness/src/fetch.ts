type RouteResponse = string | { status?: number; body?: string }
type Respond = RouteResponse | ((url: string, init: Record<string, unknown>) => RouteResponse)

export class MockFetch {
  requests: { url: string; init: Record<string, unknown> }[] = []
  #routes: { match: string | RegExp; respond: Respond }[] = []

  on(match: string | RegExp, respond: Respond): this {
    this.#routes.push({ match, respond })
    return this
  }

  handler() {
    return async (url: string, init: Record<string, unknown> = {}) => {
      this.requests.push({ url, init })
      const route = this.#routes.find((r) =>
        r.match instanceof RegExp ? r.match.test(url) : url.startsWith(r.match),
      )
      if (!route) throw new Error(`fetch: no mock registered for ${url}`)
      const raw = typeof route.respond === 'function' ? route.respond(url, init) : route.respond
      const { status = 200, body = '' } = typeof raw === 'string' ? { body: raw } : raw
      // platform fetch is text-only, so that is all we emulate. no json(), no
      // bytes -- if a test needs them the bot would break in prod anyway
      return { status, async text() { return body } }
    }
  }
}
