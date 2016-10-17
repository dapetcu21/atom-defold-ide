'use babel'

import { getPathToProject } from './project-detect'
import { BufferedProcess } from 'atom'
import path from 'path'

export async function hotReload (fromSaving = false, _filePath) {
  function info (msg, options) {
    if (!fromSaving) {
      window.atom.notifications.addInfo(msg, options)
    }
  }
  function error (msg, options) {
    if (!fromSaving) {
      window.atom.notifications.addError(msg, options)
    }
  }

  const javaPath = window.atom.config.get('defold-ide.javaPath')
  if (!javaPath) { error('Invalid path to Java executable'); return }
  const bobPath = window.atom.config.get('defold-ide.bobPath')
  if (!bobPath) {
    error('Hot reloading requires bob.jar', {
      detail: 'Download it from http://d.defold.com and set the path to it in Defold IDE preferences. Don\'t forget to update it when you update Defold'
    })
    return
  }

  let filePath = _filePath
  if (!filePath) {
    const editor = window.atom.workspace.getActiveTextEditor()
    if (!editor || !(filePath = editor.getBuffer().getPath())) {
      error('This is not a Defold file')
      return
    }
  }

  const pathToProject = await getPathToProject(filePath)
  if (!pathToProject) { error('This is not a Defold file in a project'); return }

  info('Hot reloading...')

  const shouldReturn = await new Promise((resolve, reject) => {
    let errorSub
    let stderr = []
    const process = new BufferedProcess({
      command: javaPath,
      options: { cwd: pathToProject },
      args: ['-jar', bobPath],
      stderr (output) {
        stderr.push(output)
      },
      exit (code) {
        if (errorSub) { errorSub.dispose() }
        if (code !== 0) {
          reject(stderr.join(''))
        } else {
          resolve(false)
        }
      }
    })
    errorSub = process.onWillThrowError(errorObject => {
      errorObject.handle()
      reject(errorObject.error.toString())
    })
  }).catch(stderr => {
    error('Build failed while hot reloading', {
      detail: stderr,
      dismissable: true
    })
    return true
  })

  if (shouldReturn) { return }

  const fileToReload = path.relative(pathToProject, filePath) + 'c'
  const pathBuffer = new window.TextEncoder().encode(fileToReload)
  if (pathBuffer.length > 255) {
    error('Cannot hot reload files with a relative path longer than 255 chars')
    return
  }

  const body = new Uint8Array(2 + pathBuffer.length)
  body[0] = 0x0a
  body[1] = pathBuffer.length
  body.set(pathBuffer, 2)

  const engineUrl = 'http://localhost:8001/post/@resource/reload'
  try {
    const response = await window.fetch(engineUrl, { method: 'POST', body })
    if (!response.ok) {
      throw new Error(`Recieved status ${response.status} ${response.statusText}`)
    }
    await response.text()
  } catch (ex) {
    let errString = ex.toString()
    if (/Failed to fetch/.test(errString)) {
      errString = 'Defold game is not running'
    }
    error(errString)
    return
  }

  window.atom.notifications.addInfo('Hot reloaded')
}
