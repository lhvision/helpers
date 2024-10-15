import { platform } from 'node:os'
import { exit } from 'node:process'
// import { fileURLToPath } from 'node:url'
// import { join, resolve } from 'node:path'
// import { existsSync, readFileSync } from 'node:fs'
import { $, question, usePowerShell } from 'zx'
import { colorLog } from '@lhvision/helpers'

// npm whoami  查看是否登陆
// npm adducer/npm login 进行登陆
// npm version major // 大改动,不向下兼容 第一位数字加1
// npm version minor  // 增加了新功能 中间的数字加1
// npm version patch  // 补丁版本,最后一位数加1
// $env:NPM_CONFIG_PROXY="http://127.0.0.1:7890"
// $env:NPM_CONFIG_HTTPS_PROXY="http://127.0.0.1:7890"

if (platform() === 'win32') {
  usePowerShell()
}

// const __filename = fileURLToPath(import.meta.url)
// const projectRoot = resolve(__filename, '../..')

// // 读取 .npmrc 文件路径
// const npmrcPath = join(projectRoot, '.npmrc')

// 检查 .npmrc 文件中的 registry 设置
// function checkNpmRegistry() {
//   if (!existsSync(npmrcPath)) {
//     colorLog('.npmrc file not found', 'error')
//     exit(1)
//   }

//   const npmrcContent = readFileSync(npmrcPath, 'utf-8')

//   // 检查是否有注释掉的正确 registry
//   const hasCommentedNpmRegistry = npmrcContent.includes('# registry=https://registry.npmjs.org')
//   const hasActiveNpmRegistry = !hasCommentedNpmRegistry && npmrcContent.includes('registry=https://registry.npmjs.org')

//   if (hasCommentedNpmRegistry && !hasActiveNpmRegistry) {
//     colorLog('Error: .npmrc 中的 "registry=https://registry.npmjs.org" 被设置为注释状态, 请调整后再运行脚本。', 'error')
//     exit(1)
//   }

//   if (!hasActiveNpmRegistry) {
//     colorLog('Error: .npmrc 中未找到 "registry=https://registry.npmjs.org" 设置。请检查并修改 .npmrc 文件。', 'error')
//     exit(1)
//   }
// }

// 检查 npm 登录状态
async function checkNpmLogin() {
  try {
    await $`npm whoami`
    colorLog('已登录 npm', 'success')
  }
  catch (error) {
    colorLog(`未登录 npm,请先登录，${error}`, 'error')
    await $`npm login`
  }
}

// 获取当前版本
async function getCurrentVersion() {
  const { stdout } = await $`npm version --json`
  const versions = JSON.parse(stdout)
  const name = Object.keys(versions)[0]
  return {
    name,
    version: versions[name],
  }
}

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
async function updateVersion(currentVersion) {
  const choices = ['patch', 'minor', 'major']
  console.log('选择要更新的版本类型:')
  choices.forEach((type, index) => {
    colorLog(`${index + 1}. ${type} (${incrementVersion(currentVersion, type)})`, 'info')
  })

  const response = await question('输入选择的版本类型的数字 (1, 2, or 3): ')
  const versionTypeIndex = Number.parseInt(response.trim(), 10) - 1
  const versionType = choices[versionTypeIndex]

  if (!versionType) {
    throw new Error('Invalid selection')
  }

  await $`npm version ${versionType}`
  colorLog(`版本已更新为 ${incrementVersion(currentVersion, versionType)}`, 'success')
}

// 校验 OTP
function validateOtp(otp) {
  return /^\d{6}$/.test(otp)
}

// 主函数
async function main() {
  // checkNpmRegistry()

  await checkNpmLogin()

  const { name, version } = await getCurrentVersion()
  colorLog(`${name} 当前版本: ${version}`, 'info')

  const response = await question('是否要更新版本? (y/n): ')
  const shouldUpdate = response.trim().toLowerCase() === 'y'

  if (shouldUpdate) {
    await updateVersion(version)
  }

  let otp
  while (true) {
    otp = await question('请输入 OTP (One-Time Password): ')
    if (validateOtp(otp)) {
      break
    }
    else {
      colorLog('请输入有效的 6 位数字 OTP', 'error')
    }
  }

  await $`npm publish --access public --registry https://registry.npmjs.org --otp ${otp}`
  colorLog('发布成功!', 'success')
}

main().catch((error) => {
  colorLog(`Error: ${error.message}`, 'error')
  exit(1)
})
