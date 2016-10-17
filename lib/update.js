'use babel'

export const updateStorageKey = 'defoldIDEProviderUpdate'
export const updateStorageDataKey = 'defoldIDEProviderUpdateData'
const updateInterval = 1000 * 60 * 60 * 24
const luaVersion = '5.1'

function makeTable (table, path, info) {
  if (!path.length) { return table }
  const name = path[0]
  let child = table.fields[name]
  if (!child) {
    child = table.fields[name] = {
      type: 'table',
      fields: {},
      description: info.description,
      link: `http://www.defold.com/ref/${info.namespace}`
    }
  }
  return makeTable(child, path.slice(1), info)
}

function parseDocumentation (docs, options) {
  docs.elements.forEach(element => {
    if (element.type !== 'FUNCTION' && element.type !== 'VARIABLE') { return }
    if (element.deprecated) { return }

    const names = element.name.split('.')
    const name = names.pop()
    const table = makeTable(options.global, names, docs.info)

    const type = element.type === 'FUNCTION' ? 'function' : 'unknown'
    const description = element.brief

    let link = `http://www.defold.com/ref/${docs.info.namespace}#${element.name}`

    const paramPostfix = element.parameters
      .map(param => param.name.replace(/[^a-zA-Z0-9_]/g, '-'))
      .join('-')
    if (paramPostfix) { link += ':' + paramPostfix }

    const args = element.parameters
      .map(param => ({
        name: param.name.replace(/[^a-zA-Z0-9_]/g, ''),
        displayName: param.name
      }))

    const oldItem = table.fields[name]
    if (!oldItem) {
      table.fields[name] = { type, description, link, args }
    } else {
      if (!oldItem.variants) {
        const variant = {
          description: oldItem.description,
          link: oldItem.link,
          args: oldItem.args
        }
        delete oldItem.args
        delete oldItem.link
        delete oldItem.description
        oldItem.variants = [ variant ]
      }
      oldItem.variants.push({ description, link, args })
    }
  })
}

let isCheckingForUpdates = false
export const checkForUpdates = async function (force) {
  if (isCheckingForUpdates) { return }
  isCheckingForUpdates = true
  const r = _checkForUpdates(force)
  isCheckingForUpdates = false
  return r
}

const updateErrorOptions = ex => ({
  detail: ex.toString(),
  stack: ex.stack,
  dismisable: true,
  buttons: [{
    text: 'Retry',
    onDidClick: () => {
      checkForUpdates(true)
    }
  }]
})

function updateAttempt (sha1) {
  const updateData = {
    lastUpdate: Date.now(),
    sha1
  }
  window.localStorage.setItem(updateStorageKey, JSON.stringify(updateData))
}

const __NOT_LOADED__ = Symbol()
let cachedOptions = __NOT_LOADED__
export function getOptions () {
  if (cachedOptions === __NOT_LOADED__) {
    cachedOptions = null
    try {
      cachedOptions = JSON.parse(window.localStorage.getItem(updateStorageDataKey))
      cachedOptions.luaVersion = luaVersion
    } catch (ex) {}
  }
  return cachedOptions
}

function setOptions (options) {
  options.luaVersion = luaVersion
  cachedOptions = options
  window.localStorage.setItem(updateStorageDataKey, JSON.stringify(options))
}

async function _checkForUpdates (force = false) {
  if (!force && !window.atom.config.get('defold-ide.checkForUpdates', true)) {
    return false
  }

  let lastUpdate = null
  try {
    lastUpdate = JSON.parse(window.localStorage.getItem(updateStorageKey))
  } catch (ex) {}

  if (!force &&
    lastUpdate &&
    lastUpdate.sha1 &&
    lastUpdate.updatedAt > Date.now() + updateInterval
  ) {
    return
  }

  let sha1
  try {
    const response = await window.fetch('http://d.defold.com/stable/info.json')
    sha1 = (await response.json()).sha1
  } catch (ex) {
    if (force) {
      window.atom.notifications.addError('Could not check for updates to the Defold API references', updateErrorOptions(ex))
    }
    updateAttempt(lastUpdate && lastUpdate.sha1)
    return
  }

  if (!force && lastUpdate && lastUpdate.sha1 === sha1) {
    return
  }

  const notif = window.atom.notifications.addInfo('Updating Defold API references')

  const url = `http://d.defold.com/archive/${sha1}/engine/share/ref-doc.zip`
  try {
    const response = await window.fetch(url)
    const data = await response.arrayBuffer()
    const zip = await require('jszip').loadAsync(data)
    const files = zip.folder('doc').file(/\.json$/)

    const options = { global: { type: 'table', fields: {} } }
    await Promise.all(files.map(async function (file) {
      const jsonData = await file.async('string')
      const json = JSON.parse(jsonData)
      parseDocumentation(json, options)
    }))

    notif.dismiss()
    window.atom.notifications.addSuccess('Updated Defold API references')
    setOptions(options)
    updateAttempt(sha1)
  } catch (ex) {
    notif.dismiss()
    window.atom.notifications.addError('Failed to update Defold API references', updateErrorOptions(ex))
    updateAttempt(sha1)
  }
}
