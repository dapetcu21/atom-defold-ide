'use babel'

import { checkForUpdates, getOptions } from './update'
import { getPathToProject } from './project-detect'

export default class DefoldProvider {
  priority = 20;

  getDefoldOptions = async function (utils) {
    await checkForUpdates()
    const options = await getOptions()
    if (options !== this.options) {
      this.options = options
      this.revivedOptions = utils.reviveOptions(options)
    }
    return this.revivedOptions
  };

  getOptions = async function (request, getPreviousOptions, utils, cache) {
    const previousOptions = getPreviousOptions()
    try {
      const pathToProject = await getPathToProject(request.filePath)
      if (!pathToProject) {
        return { options: (await previousOptions) }
      }

      __LOG__ && console.log('Defold detected. Passing autocomplete options...')

      const options = await this.getDefoldOptions(utils)
      if (!options) {
        return { options: (await previousOptions) }
      }
      return utils.mergeOptionsCached(await previousOptions, options, cache, (merged) => {
        merged.cwd = pathToProject
      })
    } catch (ex) {
      __LOG__ && console.error(ex)
      return { options: (await previousOptions) }
    }
  };
}
