import { readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { argv, exit } from 'node:process'
import { fileURLToPath } from 'node:url'
import chalk from 'chalk'
import { $ } from 'zx'

const args = argv.slice(2)
const releaseType = args.find(arg => ['patch', 'minor', 'major'].includes(arg))

if (!releaseType) {
  console.error('请提供有效的发布类型: patch, minor, major')
  exit(1)
}

const __filename = fileURLToPath(import.meta.url)
const projectRoot = resolve(__filename, '../..')
const packageJsonPath = join(projectRoot, './package.json')
const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'))

// 增加版本号
function incrementVersion(version, type) {
  const parts = version.split('.').map(Number)
  switch (type) {
    case 'major':
      return `${parts[0] + 1}.0.0`
    case 'minor':
      return `${parts[0]}.${parts[1] + 1}.0`
    case 'patch':
      return `${parts[0]}.${parts[1]}.${parts[2] + 1}`
    default:
      throw new Error('Invalid version type')
  }
}

// 更新版本
async function updateVersion() {
  const currentVersion = incrementVersion(packageJson.version, releaseType)
  packageJson.version = currentVersion
  await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`)
  chalk.green(`版本已更新为 ${currentVersion}`)
  return currentVersion
}

// 主函数
async function main() {
  const currentVersion = await updateVersion()

  await $`pnpm changelog`
  await $`git add .`
  await $`git commit -m "chore(release): v${currentVersion}"`
  await $`git tag v${currentVersion}`

  await $`pnpm publish --access public --registry https://registry.npmjs.org`
  chalk.green('发布成功!')

  await $`git push origin HEAD`
  await $`git push origin v${currentVersion}`
  chalk.green('推送代码成功!')
}

main().catch((error) => {
  chalk.red(`Error: ${error.message}`)
  exit(1)
})
