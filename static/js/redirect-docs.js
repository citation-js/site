var docsPattern = /(\/api)(\/(?!0.[35]\/)|$)/

if (docsPattern.test(location.pathname)) {
  location.pathname = location.pathname.replace(docsPattern, '$1/0.3$2')
}
