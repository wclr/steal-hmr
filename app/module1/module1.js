var dict = require('./dict!lp')
require('./style.less!')

console.log(`module (CJS with ES6) loaded`)

window.changeLanguageM1 = function (val) {
  val && dict(val).then((dict) => {
    document.getElementById('m1-name').innerHTML = dict.name
  })
}

module.exports = function () {
  var div = document.createElement('div')
  div.setAttribute('class', 'module1')

  div.innerHTML = `
  <div>module1 <b>name</b> (choose language):</div>
  <select onchange="changeLanguageM1(value)">
    <option></option>
    <option>en</option>
    <option>es</option>
    <option>ru</option>
  </select>
  <b id="m1-name"></b>
`

  document.body.appendChild(div)
}
