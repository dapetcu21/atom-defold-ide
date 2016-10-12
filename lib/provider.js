'use babel'

import path from 'path'
import fs from 'fs'

import { checkForUpdates, getOptions } from './update'

export default class DefoldProvider {
  priority = 20;
  fileCache = {}

  getFileData = async function (fileName, modifDate) {
    const entry = this.fileCache[fileName]
    const modifTime = modifDate.getTime()
    if (entry && entry.modifTime >= modifTime) {
      return entry.data
    }

    const rawData = await (new Promise((resolve, reject) => {
      fs.readFile(fileName, (err, stats) => {
        if (err) { reject(err) } else { resolve(stats) }
      })
    }))

    const data = JSON.parse(rawData)
    this.fileCache[fileName] = { modifTime, data }
    return data
  }

  getDefoldOptions = async function () {
    await checkForUpdates()
    return await getOptions()
  };

  getOptions = async function (request, getPreviousOptions) {
    const previousOptions = getPreviousOptions()
    try {
      let filePath = request.editor.getBuffer().getPath()
      let isDefoldProject = false

      while (true) {
        const dirName = path.dirname(filePath)
        if (dirName === filePath) { break }
        filePath = dirName

        const _rcPath = path.join(dirName, 'game.project')
        const stat = await (new Promise((resolve, reject) => {
          fs.stat(_rcPath, (err, stats) => {
            if (err) { reject(err) } else { resolve(stats) }
          })
        }).catch(err => {
          if (err.code === 'ENOENT') { return null }
          throw err
        }))

        if (stat && stat.isFile()) {
          isDefoldProject = true
          break
        }
      }

      if (!isDefoldProject) {
        return { options: (await previousOptions) }
      }

      __LOG__ && console.log('Defold detected. Passing autocomplete options...')

      const options = await this.getDefoldOptions()
      if (!options) {
        return { options: (await previousOptions) }
      }

      // TODO: Merge options
      return { options }
    } catch (ex) {
      __LOG__ && console.error(ex)
      return { options: (await previousOptions) }
    }
  };
}
