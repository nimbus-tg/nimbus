#!/usr/bin/env node
import { cp, readdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const name = process.argv[2]

if (!name || name.startsWith('-')) {
  console.log('usage: npx create-nimbus-bot <project-name>')
  process.exit(1)
}

const target = path.resolve(name)
const dirName = path.basename(target)

const existing = await readdir(target).catch(() => null)
if (existing && existing.length > 0) {
  console.error(`${name} already exists and is not empty`)
  process.exit(1)
}

const template = fileURLToPath(new URL('./template', import.meta.url))
await cp(template, target, { recursive: true })

// npm strips .gitignore from published packages, hence the rename dance
await rename(path.join(target, '_gitignore'), path.join(target, '.gitignore'))

const pkgPath = path.join(target, 'package.json')
const pkg = JSON.parse(await readFile(pkgPath, 'utf8'))
pkg.name = dirName
await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

console.log(`created ${dirName}/

next:
  cd ${name}
  npm install        # or pnpm/yarn, whatever you like
  npm test           # runs offline, no telegram needed

when you have BotCloud access:
  npx nimbus vendor
  npx tgcloud push
`)
