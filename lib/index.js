'use babel'

import { CompositeDisposable } from 'atom'
import DefoldProvider from './provider'
import { checkForUpdates } from './update'

window.__LOG__ = window.localStorage.getItem('__LOG__')

export default {
  activate () {
    this.disposables = new CompositeDisposable()
    this.disposables.add(window.atom.commands.add('atom-workspace', {
      'defold-ide:update-api-references': () => checkForUpdates(true)
    }))
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
