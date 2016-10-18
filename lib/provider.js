'use babel'

import { checkForUpdates, getOptions } from './update'
import { getPathToProject } from './project-detect'

export default class DefoldProvider {
  priority = 20;

  getDefoldOptions = async function () {
    await checkForUpdates()
    return await getOptions()
  };

  getOptions = async function (filePathOrRequest, getPreviousOptions, utils, cache) {
    const previousOptions = getPreviousOptions()
    try {
      const filePath = (typeof filePathOrRequest === 'string')
        ? filePathOrRequest
        : filePathOrRequest.editor.getBuffer().getPath()

      if (!(await getPathToProject(filePath))) {
        return { options: (await previousOptions) }
      }

      __LOG__ && console.log('Defold detected. Passing autocomplete options...')

      const options = await this.getDefoldOptions()
      if (!options) {
        return { options: (await previousOptions) }
      }
      return utils.mergeOptionsCached(await previousOptions, options, cache)
    } catch (ex) {
      __LOG__ && console.error(ex)
      return { options: (await previousOptions) }
    }
  };
}
