'use babel'

import path from 'path'
import fs from 'fs'

export async function getPathToProject (filePath) {
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
      return dirName
    }
  }
}
