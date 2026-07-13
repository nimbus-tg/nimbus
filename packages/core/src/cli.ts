import { vendor } from './vendor'

const help = `usage: nimbus <command>

commands:
  vendor    bundle the framework into lib/_vendor/ and regenerate handler shims

options:
  --root <dir>    project root (default: cwd)
  --entry <file>  module that default-exports the Bot (default: lib/bot.js)
`

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(name)
  return i === -1 ? undefined : args[i + 1]
}

const [cmd, ...rest] = process.argv.slice(2)

switch (cmd) {
  case 'vendor':
    await vendor({
      root: flag(rest, '--root') ?? process.cwd(),
      entry: flag(rest, '--entry') ?? 'lib/bot.js',
    })
    break
  default:
    console.log(help)
    if (cmd) process.exitCode = 1
}
