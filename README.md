# Steal-HMR

Frictionless **hot module replacement** for apps loaded with [StealJS](https://github.com/stealjs/steal)

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

##What is it

[StealJS](https://github.com/stealjs/steal) is a great module loader on top of [System.js](https://github.com/systemjs/systemjs)
that allows you to load ES6/CJS/AMD modules right inside your browser while working with NPM packages too.

And **Steal-HMR** is a small add-on for StealJS/System.js that **allow to tune hot module replacement** nicely.

Hot module replacement/reloading with StealJS/System.js works **actually faster (in terms of DX)** 
than alternative solutions  for example [Webpack](https://github.com/webpack/webpack). Because there is no need 
to prepare something (for example diff bundle) on on server side, it just loads only changed file(s) 
and replaces already loaded modules using SystemJS mechanics.

###This demo shows hot reloading implemented with Steal-HMR for [CanJS UI framework](http://github.com/whitecolor/can-hot)
![can-hot](https://cloud.githubusercontent.com/assets/736697/12709893/5b1727e8-c8d2-11e5-8f69-faf73ede4559.gif)

##Install

```bash
npm install steal-hmr
```

##Usage

**NB!** To use HMR module you need something that will notify it about file changes.
This example uses [Watchalive Dev Server](https://github.com/whitecolor/watchalive)
that *generously provides* HMR not only with a list of changes but also supplies with 
sources of changed files so loader will not even have to make a single request to the server.

```html
<script src="/node_modules/steal/steal.js" config="/package.json!npm">
  import HMR from 'steal-hmr'

  // map styles to use build-in support for css hot-reload
  System.config({map: {
    $css: 'steal-hmr/css',
    $less: 'steal-hmr/css'
  }})

  new HMR({
    // auto load of main module will happen
    main: 'app/app',
    
    // to output some debug messages
    debug: true,
    
    // tells HRM to reload dependants for all *.js, 
    // `false` by default
    dependants: /\.js$/,
        
    // tells when to reload whole page
    page: [/index\.html/, /node_modules/],
    
    // event that provides file changes: 
    // it should be a function that produces an array of changes 
    // that are file names (relative to host root) or urls,  
    // changes can also contain a source data in format 
    // {name: ... , source: ....}
    handle: watchalive.onFiles,
    
    // teardown happens when 'main' reloads
    teardown: () => document.body.innerHTML = ''
  })
</script> 
```

##Try demo app

Try and test how all this works with module's demo app.
```bash
git clone http://github.com/whitecolor/steal-hmr
npm install # please, use NPM 3, otherwice remove system.npmAlgorithm in package.json
npm run start # app will run on 7000, to use other port: npm run start -- --port your_port
```
- Open your browser `http://localhost:7000`
- You can changes files `js/css/less` *inside the app folder* and see what happens
- Notice that css/less reload do not made any changes to apps current state
- See example of hot reloading for [CanJS UI framework](http://github.com/whitecolor/can-hot)

##Licence

ISC.
