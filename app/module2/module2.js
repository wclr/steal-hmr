import dict from './dict!lp'

console.log(`module2 ES6 loaded`)

window.changeLanguageM2 = function (val) {
  val && dict(val).then((dict) => {
    document.getElementById('m2-age').innerHTML = dict.age
  })
}

export default () => {
  var div = document.createElement('div')
  div.setAttribute('class', 'module2')

  div.innerHTML = `
  <div>module2 <b>age</b> (choose language):</div>
  <select onchange="changeLanguageM2(value)">
    <option></option>
    <option>en</option>
    <option>es</option>
    <option>ru</option>
  </select>
  <b id="m2-age"></b>
`
  document.body.appendChild(div)
}
