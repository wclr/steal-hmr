// this is need to force System.js track loads
if (!System.getDependants) {
}

// StealJs has _traceData
if (System._traceData) {
  System.loads = System._traceData.loads
} else {
  System.trace = true
// TODO: implement getDependants for System.js
// System.getDependants = function(moduleName){
//  var deps = [];
//  var pars = this._traceData.parentMap[moduleName] || {};
//  eachOf(pars, function(name) { deps.push(name); });
//  return deps;
// }
}

var extend = function (dest, source) {
  for (var prop in source) {
    if (source[prop] !== undefined) {
      dest[prop] = source[prop]
    }
  }
}

var defaultOptions = {
  bindReloadKeys: true,
  clearConsole: true,
  attachToSystem: 'hmr',
  attachToWindow: 'hrm',
  logPrepend: '[steal-hmr]',
  page: false,
  dependants: false,
  catchWindowError: true
}

var fetch = System.fetch

var testRules = function (tests, subject, fnSubject) {
  if (!tests || !subject) return false

  if (!Array.isArray(tests)) {
    tests = [tests]
  }

  return tests.reduce((found, test) =>
    found || (test instanceof RegExp
      ? test.test(subject)
      : typeof test === 'function'
        ? test(fnSubject || subject)
        : typeof test === 'string'
          ? subject.indexOf(test) >= 0
          : test)
  , false)
}

System.fetch = function (load) {
  var loaded = System.loads && System.loads[load.name]
  if (loaded && loaded.source) {
    return loaded.source
  } else {
    return fetch.call(this, load)
  }
}

class HotReload {

  output (type, args) {
    args = Array.prototype.slice.call(args)
    var prepend = this.options.logPrepend
    prepend && args.unshift(prepend)
    console[type].apply(console, args)
  }

  log () {
    this.output('log', arguments)
  }

  warn () {
    this.output('warn', arguments)
  }

  debug () {
    if (!this.options.debug) return
    this.output('info', arguments)
  }

  constructor (options) {
    this.options = {}
    this._errorFiles = []
    this._plugins = []

    extend(this.options, defaultOptions)
    this.config(options)
  }

  static start (options) {
    return new this(options)
  }

  static handle (options) {
    let hrm = this.start(options)
    return (changes) => {
      hrm.reloadChanges(changes)
    }
  }

  config (options) {
    extend(this.options, options)

    options = this.options

    if (this.options.bindReloadKeys && !this._bindReloadKeysHandler) {
      this._bindReloadKeysHandler = (ev) => {
        ev = ev || window.event
        if (ev.ctrlKey && ev.altKey && ev.keyCode === 'R'.charCodeAt(0)) {
          this.completeReload()
        }
      }
      document.addEventListener('keydown', this._bindReloadKeysHandler)
    }

    if (this.catchWindowError && !this._catchWindowErrorHandler) {
      this._catchWindowErrorHandler = (ev) => {
        // ev.error.stack, ev.lineno - on safarit
        ev.filename && this._errorFiles.push(ev.filename)
        var obj = {
          message: ev.message,
          filename: ev.filename,
          lineno: ev.lineno,
          colno: ev.colno,
          stack: ev.error && ev.error.stack
        }
        this.log('Hot-reload caught error:', ev.message, obj.filename, obj.lineno, obj.stack)
        ev.preventDefault()
      }
      window.addEventListener('error', this._catchWindowErrorHandler)
    }

    if (options.attachToSystem && !System[options.attachToSystem]) {
      System[options.attachToSystem] = this
    }

    if (options.attachToWindow && !window[options.attachToWindow]) {
      window[options.attachToWindow] = this
    }

    if (options.startup !== false) {
      if (typeof options.startup === 'function') {
        options.startup()
      } else {
        if (options.main) {
          System.import(options.main)
        }
      }
    }
    if (Array.isArray(options.plugin)) {
      options.plugin.forEach(p => this._plugins.push(p))
    }
    if (typeof options.handle === 'function') {
      this.handle(options.handle)
    }
  }

  completeReload () {
    if (this.options.clearConsole && console.clear) {
      console.clear()
    }
    if (this.options.teardown) {
      this.options.teardown([])
    }
    if (this.options.main) {
      System.delete(this.options.main)
      System.import(this.options.main)
    }
  }

  shouldReloadDependants (load) {
    if (!load) return false

    if (!load.name) {
      if (!System.loads[load]) {
        this.warn('Can not find module', load)
        return false
      }
      load = System.loads[load]
    }

    var hotMarks = ['@hot-deps', '@hot-reload deps']
    if (load.hotDeps || testRules(hotMarks, load.source)) {
      return true
    }
    let test = this.options.reloadDependants || this.options.dependants
    var should = test &&
        (testRules(test, load.address, load) || testRules(test, load.name, load))

    this.debug('shouldReloadDependants', load.name, should)

    return should
  }

  before (deleted) {
    this._plugins.forEach(
      p => typeof p.before === 'function' && p.before(deleted)
    )
    if (this.options.before) {
      this.options.before(deleted)
    }
  }

  after (deleted) {
    this._plugins.forEach(
      p => typeof p.after === 'function' && p.after(deleted)
    )
    if (this.options.after) {
      this.options.after(deleted)
    }
  }

  handle (eventFn) {
    eventFn((files) => {
      this.reloadChanges(files)
    })
  }

  plugin (plugin) {
    this._plugins.push(plugin)
  }

  reloadChanges (files) {
    var options = this.options
    var main = options.main

    if (!System.loads) {
      this.warn('No System.loads defined.')
    }
    var location = window.location
    var host = location.origin || (location.protocol + '//' + location.host)

    var deleted = []

    var deleteModule = (m, deps) => {
      if (!m || deleted.indexOf(m) >= 0) return
      deleted.push(m)
      if (deps) {
        var dependants = System.getDependants(m)
        dependants.forEach((dm) => {
          deleteModule(dm, this.shouldReloadDependants(dm))
        })
      }
    }

    if (options.clearConsole && console.clear) {
      console.clear()
    }

    // delete error modules
    this._errorFiles.forEach((fileName) => {
      var m = Object.keys(System.loads).filter((moduleName) => {
        var load = System.loads[moduleName]
        return load.address === fileName
      })[0]
      if (m) {
        console.warn('Deleting error module', m)
        deleteModule(m)
      }
    })

    files.forEach((file) => {
      var source = file.data || file.source

      var fileName = file.name || file.fileName ||
        file.address || file.url || file.file || file

      this.log('Processing change', fileName)

      if (typeof source !== 'string') {
        this.warn('Source type is not a string', fileName, source, typeof source)
        return
      }

      // find module by filename
      var m = Object.keys(System.loads).filter((moduleName) => {
        var load = System.loads[moduleName]
        let address = /^https?:/.test(fileName)
          ? fileName : host + '/' + fileName
        return load.address === address
      })[0]

      if (testRules(options.page, fileName, file)) {
        return location.reload()
      }

      if (m) {
        var load = System.loads[m]
        load.source = source
        deleteModule(m, this.shouldReloadDependants(m))
      }
    })

    if (deleted.length) {
      if (options.teardown && deleted.indexOf(main) >= 0) {
        options.teardown(deleted)
      }

      if (this.before) {
        this.before(deleted)
      }
      deleted.forEach(m => System.delete(m))

      Promise.all(deleted.map(m => System.import(m)))
        .then(() => {
          if (this.after) {
            this.after(deleted)
          }
        })
    }
    this._errorFiles = []
  }
}

export default HotReload
