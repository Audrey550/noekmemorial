const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..', 'public', 'models')
const output = path.join(__dirname, '..', 'src', 'data', 'assets.js')

const iconMap = {
  meubels: '🪑',
  apparaten: '💻',
  licht: '💡',
  planten: '🪴',
  hobby: '🎨',
  voertuigen: '🚗',
}

function prettyName(file) {
  return path.basename(file, '.glb')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

function walk(dir) {
  let results = []

  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item)

    if (fs.statSync(full).isDirectory()) {
      results = results.concat(walk(full))
    } else if (item.endsWith('.glb')) {
      results.push(full)
    }
  }

  return results
}

const files = walk(root)

const assets = files.map((fullPath) => {
  const relative = fullPath
    .replace(path.join(__dirname, '..', 'public'), '')
    .replace(/\\/g, '/')

  const parts = relative.split('/').filter(Boolean)

  const category = parts[1] || 'overig'

  const id = path.basename(fullPath, '.glb')

  return {
    id,
    category,
    name: prettyName(fullPath),
    detail: '3D-model voor de herdenkingskamer.',
    icon: iconMap[category] || '📦',
    file: relative,
  }
})

const content =
`export const modelAssets = ${JSON.stringify(assets, null, 2)}
`

fs.writeFileSync(output, content)

console.log(`Generated ${assets.length} assets.`)