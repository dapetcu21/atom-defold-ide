'use babel'

import { CompositeDisposable } from 'atom'
import DefoldProvider from './provider'
import { checkForUpdates } from './update'
import { hotReload } from './hot-reload'
import uniq from 'lodash.uniq'

window.__LOG__ = window.localStorage.getItem('__LOG__')

export default {
  activate () {
    require('atom-package-deps').install('defold-ide')
    this.disposables = new CompositeDisposable()
    this.disposables.add(window.atom.commands.add('atom-workspace', {
      'defold-ide:update-api-references': () => checkForUpdates(true),
      'defold-ide:hot-reload': () => hotReload(false)
    }))
    this.disposables.add(window.atom.workspace.observeTextEditors(editor => {
      this.disposables.add(editor.onDidSave(event => {
        if (window.atom.config.get('defold-ide.reloadOnSave', false)) {
          hotReload(true, event.path)
        }
      }))
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
      title: 'Check for updates to Defold\'s library definitions',
      order: 0
    },
    reloadOnSave: {
      type: 'boolean',
      default: false,
      title: 'Hot reload every time you save',
      order: 1
    },
    javaPath: {
      type: 'string',
      default: 'java',
      title: 'Path to Java binary',
      order: 2
    },
    bobPath: {
      type: 'string',
      default: '',
      title: 'Path to Defold\'s bob.jar. Download it from http://d.defold.com',
      order: 3
    }
  },

  getOptionProvider () {
    return new DefoldProvider()
  }
}
