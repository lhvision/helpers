import { argv, exit } from 'node:process'
import { fileURLToPath } from 'node:url'
import { join, resolve } from 'node:path'
import { readFile, writeFile } from 'node:fs/promises'
import { $ } from 'zx'
import { colorLog } from '@lhvision/helpers'

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
  colorLog(`版本已更新为 ${currentVersion}`, 'success')
  return currentVersion
}

// 主函数
async function main() {
  const currentVersion = await updateVersion()

  await $`pnpm publish --access public --registry https://registry.npmjs.org`
  colorLog('发布成功!', 'success')

  await $`git add .`
  await $`git commit -m "chore(release): v${currentVersion}"`
  await $`git tag v${currentVersion}`
  await $`git push origin HEAD --tags`
  colorLog('推送代码成功!', 'success')
}

main().catch((error) => {
  colorLog(`Error: ${error.message}`, 'error')
  exit(1)
})
