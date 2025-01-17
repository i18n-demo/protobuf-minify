#!/usr/bin/env coffee

> path > join
  terser > minify
  esbuild > build
  @3-/read
  @3-/write
  fs > readdirSync

ROOT = import.meta.dirname

minjs = (fname)=>
  js_fp = join ROOT,fname
  console.log js_fp
  {
    outputFiles:[{text}]
  } = await build {
    entryPoints: [
      js_fp
    ]
    bundle: true
    treeShaking: true
    minifyWhitespace: false
    minifySyntax: true
    minifyIdentifiers: false
    format: 'esm'
    target: 'esnext'
    platform: 'browser'
    write: false
    # outfile: join(ROOT,'bundle.js')
  }

# text = text.replace(
#   '''assert = (condition) => {'''
#   'assert = ()=>{ return;'
# ).replace(
#   '''fail = (message) => {
#     throw new Error(message);
#   }'''
#   'fail = ()=>{}'
# )
  {code} = await minify(
    # read join ROOT,'bundle.js'
    text
    {
      ecma: 2025
      module: true
      compress:
        drop_console: true
      mangle:
        toplevel: true
    }
  )

  write(
    js_fp.slice(0,-3)+'.minify.js'
    code
  )
  return

await Promise.all [
  'export.protoscript.js'
  'export.protoscript@3-.js'
].map minjs

process.exit()
