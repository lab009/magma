import uuidv4 from 'uuid/v4'
import hpp from 'hpp'
import helmet from 'helmet'
import connect from 'connect'

import config from '@lab009/magma-config'

const cspConfig = {
  directives: {
    childSrc: ["'self'"],
    // Note: Setting this to stricter than * breaks the service worker. :(
    // I can't figure out how to get around this, so if you know of a safer
    // implementation that is kinder to service workers please let me know.
    connectSrc: ['*'], // ["'self'", 'ws:'],
    defaultSrc: ["'self'"],
    imgSrc: [
      "'self'",
      // If you use Base64 encoded images (i.e. inlined images), then you will
      // need the following:
      // 'data:',
    ],
    fontSrc: ["'self'"],
    objectSrc: ["'self'"],
    mediaSrc: ["'self'"],
    manifestSrc: ["'self'"],
    scriptSrc: [
      // Allow scripts hosted from our application.
      "'self'",
      // Note: We will execution of any inline scripts that have the following
      // nonce identifier attached to them.
      // This is useful for guarding your application whilst allowing an inline
      // script to do data store rehydration (redux/mobx/apollo) for example.
      // @see https://helmetjs.github.io/docs/csp/
      (req, res) => `'nonce-${res.locals.nonce}'`,
      // This is a know workaround for browsers that don't support nonces.
      // It will be ignored by browsers that do support nonces as they will
      // recognise that we have also provided a nonce configuration and
      // use the stricter rule.
      "'unsafe-inline'",
    ],
    styleSrc: [
      "'self'",
      // Webpack generates JS that loads our CSS, so this is needed:
      "'unsafe-inline'",
      'blob:',
    ],
  },
}

// Add any additional CSP from the static config.
const cspExtensions = config('cspExtensions')
Object.keys(cspExtensions).forEach((key) => {
  if (cspConfig.directives[key]) {
    cspConfig.directives[key] = cspConfig.directives[key].concat(
      cspExtensions[key]
    )
  } else {
    cspConfig.directives[key] = cspExtensions[key]
  }
})

if (process.env.BUILD_FLAG_IS_DEV === 'true') {
  // When in development mode we need to add our secondary server that
  // is used to host our client bundle to our csp config.
  Object.keys(cspConfig.directives).forEach((directive) => {
    cspConfig.directives[directive].push(
      `${config('host')}:${config('clientDevServerPort')}`
    )
  })
}

// Attach a unique "nonce" to every response.  This allows use to declare
// inline scripts as being safe for execution against our content security policy.
// @see https://helmetjs.github.io/docs/csp/
function nonceMiddleware(req, res, next) {
  // eslint-disable-next-line no-param-reassign
  res.locals.nonce = uuidv4()
  next()
}

const securityMiddleware = {
  nonceMiddleware,

  // Prevent HTTP Parameter pollution.
  // @see http://bit.ly/2f8q7Td
  hpp: hpp(),

  // The xssFilter middleware sets the X-XSS-Protection header to prevent
  // reflected XSS attacks.
  // @see https://helmetjs.github.io/docs/xss-filter/
  xssFilter: helmet.xssFilter(),

  // Frameguard mitigates clickjacking attacks by setting the X-Frame-Options header.
  // @see https://helmetjs.github.io/docs/frameguard/
  frameguard: helmet.frameguard('deny'),

  // Sets the X-Download-Options to prevent Internet Explorer from executing
  // downloads in your site’s context.
  // @see https://helmetjs.github.io/docs/ienoopen/
  ieNoOpen: helmet.ieNoOpen(),

  // Don’t Sniff Mimetype middleware, noSniff, helps prevent browsers from trying
  // to guess (“sniff”) the MIME type, which can have security implications. It
  // does this by setting the X-Content-Type-Options header to nosniff.
  // @see https://helmetjs.github.io/docs/dont-sniff-mimetype/
  noSniff: helmet.noSniff(),

  // Content Security Policy
  //
  // If you are unfamiliar with CSPs then I highly recommend that you do some
  // reading on the subject:
  //  - https://content-security-policy.com/
  //  - https://developers.google.com/web/fundamentals/security/csp/
  //  - https://developer.mozilla.org/en/docs/Web/Security/CSP
  //  - https://helmetjs.github.io/docs/csp/
  //
  // If you are relying on scripts/styles/assets from other servers (internal
  // or external to your company) then you will need to explicitly configure
  // the CSP below to allow for this.  For example you can see I have had to
  // add the polyfill.io CDN in order to allow us to use the polyfill script.
  // It can be a pain to manage these, but it's a really great habit to get
  // in to.
  //
  // You may find CSPs annoying at first, but it is a great habit to build.
  // The CSP configuration is an optional item for helmet, however you should
  // not remove it without making a serious consideration that you do not
  // require the added security.
  contentSecurityPolicy: helmet.contentSecurityPolicy(cspConfig),
}

const middlewares = Object.keys(securityMiddleware)
const defaultMiddleware = [
  'nonceMiddleware',
  'hpp',
  'xssFilter',
  'frameguard',
  'ieNoOpen',
  'noSniff',
  'contentSecurityPolicy',
]

function security(options = {}) {
  const chain = connect()

  middlewares.forEach((middlewareName) => {
    const middleware = securityMiddleware[middlewareName]
    const option = options[middlewareName]
    const isDefault = defaultMiddleware.indexOf(middlewareName) !== -1

    if (option === false) {
      return
    }

    if (option === true) {
      chain.use(middleware)
    } else if (isDefault) {
      chain.use(middleware)
    }
  })

  return chain
}

export default security
