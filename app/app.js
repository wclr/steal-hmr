import module1 from './module1/'
import module2 from './module2/'
import './app.css'

console.log('app loaded')

function render () {
  document.body.innerHTML += `
  <h3>This is a demo app for Steal-HMR (Hot Module Replacement).</h3>
  <p>You may try to change sources (js/css/less) inside "app" folder and see what happens.</p>
  <p>Choose the language and lookup in console network<br> to see how language files are loaded on demand.</p>
`
  module1()
  module2()
}

document.body
  ? render()
  : window.onload = () => render()
