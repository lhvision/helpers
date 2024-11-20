/// <reference types="vitest" />
import type { Plugin } from 'vite'
import { readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { traverse } from '@babel/core'
import generate from '@babel/generator'
import { parse } from '@babel/parser'
import { defineConfig } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// eslint-disable-next-line node/prefer-global/process
const isDev = process.env.__DEV__ === 'true'
const external = isDev ? undefined : ['hash-wasm']

function findEntriesWithIndexTs(baseDir: string): Record<string, string> {
  const entry: Record<string, string> = {}

  const items = readdirSync(baseDir) // 读取 src 的第一层内容

  for (const item of items) {
    // 排除 node 目录
    if (item === 'node')
      continue

    const itemPath = join(baseDir, item) // 构造完整路径
    const stats = statSync(itemPath)

    if (stats.isDirectory()) {
      const indexPath = join(itemPath, 'index.ts') // 检查子目录下是否有 index.ts
      if (statSync(indexPath, { throwIfNoEntry: false })) {
        entry[item] = indexPath // 添加到 entry 对象，键为子目录名
      }
    }
    else if (item === 'index.ts') {
      entry.index = itemPath // 根目录的 index.ts 用 'index' 作为键
    }
  }

  return entry
}

// 动态生成 entry, 只取 src 目录下的第一层文件，且文件名为 index.ts
const entry = findEntriesWithIndexTs(resolve(__dirname, 'src'))

interface RemoveClassCommentsOptions {
  sourcemap?: boolean
  include?: string[]
  exclude?: string[]
}

function removeClassCommentsPlugin(options: RemoveClassCommentsOptions = {}): Plugin {
  const {
    sourcemap = true,
    include = ['.ts'],
    exclude = ['node_modules'],
  } = options

  return {
    name: 'remove-class-comments',
    apply: 'build', // 只在构建时应用
    // enforce: 'pre', // 在其他插件之前运行
    transform(code, id) {
      // 检查文件是否需要处理
      if (!include.some(ext => id.endsWith(ext)))
        return null
      if (exclude.some(path => id.includes(path)))
        return null

      try {
        const ast = parse(code, {
          sourceType: 'module',
          plugins: ['typescript', 'decorators-legacy'],
          sourceFilename: id,
        })
        // 检查文件是否包含类声明
        let hasClass = false
        traverse(ast, {
          ClassDeclaration() {
            hasClass = true
          },
          // 也检查类表达式
          ClassExpression() {
            hasClass = true
          },
        })

        // 如果没有类声明，直接返回原代码
        if (!hasClass)
          return null

        traverse(ast, {
          // 处理类方法的注释
          ClassMethod(path) {
            if (path.node.leadingComments) {
              path.node.leadingComments = null
            }
            if (path.node.trailingComments) {
              path.node.trailingComments = null
            }
          },
          // 处理类属性的注释
          ClassProperty(path) {
            if (path.node.leadingComments) {
              path.node.leadingComments = null
            }
            if (path.node.trailingComments) {
              path.node.trailingComments = null
            }
          },
          // 处理类声明的注释
          ClassDeclaration(path) {
            if (path.node.leadingComments) {
              path.node.leadingComments = null
            }
            if (path.node.trailingComments) {
              path.node.trailingComments = null
            }
          },
        })

        const output = (generate as any).default(ast, {
          comments: true,
          sourceMaps: sourcemap,
          sourceFileName: id,
        }, code)

        return {
          code: output.code,
          map: sourcemap ? output.map : null,
        }
      }
      catch (error) {
        console.error('Error in remove-class-comments plugin:', error)
        return null
      }
    },
  }
}

export default defineConfig({
  plugins: [
    !isDev && removeClassCommentsPlugin({ sourcemap: false }),
  ],
  build: {
    target: 'node20',
    sourcemap: isDev,
    // 构建时清空目录
    // emptyOutDir: !isDev,
    lib: {
      entry,
      formats: ['es'],
    },
    rollupOptions: {
      external,
    },
  },
  // worker: {
  //   format: 'es',
  //   rollupOptions: {
  //     external,
  //     output: {
  //       format: 'es',
  //     },
  //   },
  // },
})
