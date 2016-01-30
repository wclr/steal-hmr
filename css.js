exports.instantiate = function (load) {
  load.metadata.deps = []
  load.metadata.execute = function () {
    if (load.source) {
      var source = load.source + '\n/*# sourceURL=' + load.address + ' */'

      // make source load relative to the current page
      source = source.replace(/url\(['"]?([^'"\)]*)['"]?\)/g,
        function (whole, part) {
          return 'url(' + window.steal.joinURIs(load.address, part) + ')'
        })

      for (var i = 0; i < document.styleSheets.length; i++) {
        var ss = document.styleSheets[i]
        if (ss.ownerNode.getAttribute('source-url') === load.name) {
          ss.ownerNode.innerHTML = source
          return System.newModule({})
        }
      }

      var head = document.head || document.getElementsByTagName('head')[0]
      var style = document.createElement('style')

      style.setAttribute('source-url', load.name)
      style.type = 'text/css'

      if (style.styleSheet) {
        style.styleSheet.cssText = source
      } else {
        style.appendChild(document.createTextNode(source))
      }
      head.appendChild(style)
    }
    return System.newModule({})
  }
  load.metadata.format = 'css'
}
