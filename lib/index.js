'use babel'

import { CompositeDisposable } from 'atom'
import DefoldProvider from './provider'
import { checkForUpdates } from './update'
import uniq from 'lodash.uniq'

window.__LOG__ = window.localStorage.getItem('__LOG__')

export default {
  activate () {
    require('atom-package-deps').install('defold-ide')
    this.disposables = new CompositeDisposable()
    this.disposables.add(window.atom.commands.add('atom-workspace', {
      'defold-ide:update-api-references': () => checkForUpdates(true)
    }))

    const fileTypes = window.atom.config.get('core.customFileTypes') || {}
    const types = fileTypes['source.lua'] || []
    types.push('script')
    types.push('gui_script')
    types.push('render_script')
    fileTypes['source.lua'] = uniq(types)
    window.atom.config.set('core.customFileTypes', fileTypes)
  },

  deactivate () {
    this.disposables.dispose()
  },

  config: {
    checkForUpdates: {
      type: 'boolean',
      default: true,
      title: 'Check for updates to Defold\'s library definitions'
    }
  },

  getOptionProvider () {
    return new DefoldProvider()
  }
}
