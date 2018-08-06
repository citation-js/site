function map (array, mapper) {
  for (var i = 0; i < array.length; i++) {
    array[i] = mapper(array[i], i, array)
  }
  return array
}

function find (array, predicate) {
  for (var i = 0; i < array.length; i++) {
    if (predicate(array[i], i, array)) {
      return array[i]
    }
  }
}

function formatDate (string) {
  var date = new Date(string)
  return date.toLocaleString()
}

function canonical (links) {
  return find(links, function (link) {
    return link.rel === 'alternate' && link.type === 'text/html'
  }).href
}

var templates = {
  feed: function (items) {
    return map(items, templates.feedItem).join('')
  },
  feedItem: function (item) {
    var id = item.id.$t.replace(/^.*\.post-(\d+)$/, '$1')
    var content = item.content.$t
      .replace(/^[\s\S]*<div class="stackedit__html">([\s\S]*)<\/div>[\s\S]*$/, '$1')
      .replace(/<(\/?)h([1-6])/g, function (match, slash, level) {
        if (+level > 4) {
          return '<' + slash + 'b'
        } else {
          return '<' + slash + 'h' + (+level + 2)
        }
      })

    return '<div class="mdl-card mdl-shadow--2dp mdl-cell mdl-cell--12-col">' +
      '<div class="mdl-card__title">' +
        '<h2 class="mdl-card__title-text">' +
          '<a href="?post=' + id + '">' + item.title.$t + '</a>' +
        '</h2>' +
      '</div>' +
      '<div class="mdl-card__supporting-text mdl-card--border">' +
        '<p>' +
          '<span><i class="material-icons">edit</i> ' +
            templates.author(item.author[0]) +
          '</span>' +
          '<span><i class="material-icons">access_time</i> ' +
            formatDate(item.updated.$t) +
          '</span>' +
          '<span><i class="material-icons">link</i> <a href="' +
            canonical(item.link) +
          '">Original post</a></span>' +
        '</p>' +
        '<p>' +
          '<span><i class="material-icons">bookmark</i> ' +
            map(item.category, templates.tag).join(' ') +
          '</span>' +
        '</p>' +
      '</div>' +
      '<div class="mdl-card__supporting-text">' +
        content +
      '</div>' +
    '</div>'
  },
  tag: function (tag) {
    if (tag.term === 'Citation.js') {
      return ''
    }

    return '<span class="mdl-chip">' +
      '<a href="?tag=' + tag.term + '">' +
        '<span class="mdl-chip__text">' + tag.term + '</span>' +
      '</a>' +
    '</span>'
  },
  author: function (author) {
    return '<span class="mdl-chip mdl-chip--contact">' +
      '<img class="mdl-chip__contact" src="' + author.gd$image.src + '"></img>' +
      '<a href="' + author.uri.$t + '">' +
        '<span class="mdl-chip__text">' + author.name.$t + '</span>' +
      '</a>' +
    '</span>'
  }
}

function cb (data) {
  content.innerHTML = data.feed ? templates.feed(data.feed.entry) : templates.feedItem(data.entry)

  // pagination
  if (data.feed) {
    var href = location.href
    var hasIndex = href.indexOf('start-index') > -1
    var hasParams = href.indexOf('?') > -1
    var indexPattern = /start-index=(\d+)/

    var prev = find(data.feed.link, function (link) { return link.rel === 'previous' })
    if (prev) {
      prev = 'start-index=' + prev.href.match(indexPattern)[1]
      var url = hasIndex ? href.replace(indexPattern, prev) : href + (hasParams ? '?' : '') + prev
      paginatePrev.setAttribute('href', url)
    }

    var next = find(data.feed.link, function (link) { return link.rel === 'next' })
    if (next) {
      next = 'start-index=' + next.href.match(indexPattern)[1]
      var url = hasIndex ? href.replace(indexPattern, next) : href + (hasParams ? '&' : '?') + next
      paginateNext.setAttribute('href', url)
    }
  }
}

function load (url) {
  loader.setAttribute('src', url)
}

window.onload = function () {
  var params = {}
  
  location.search.slice(1).split('&').map(function (pair) {
    pair = pair.split('=')
    params[pair[0]] = pair[1]
  })

  var url

  if (params.post) {
    url = 'https://larsgw.blogspot.com/feeds/posts/default/' + params.post + '?alt=json-in-script&callback=cb'
  } else if (params.tag) {
    url = 'https://larsgw.blogspot.com/feeds/posts/default/-/Citation.js/' + params.tag + '?alt=json-in-script&callback=cb'
  } else if (params.query) {
    url = 'https://larsgw.blogspot.com/feeds/posts/default/-/Citation.js/?q=' + params.query + '&alt=json-in-script&callback=cb'
  } else {
    url = 'https://larsgw.blogspot.com/feeds/posts/default/-/Citation.js?alt=json-in-script&callback=cb'
  }

  var startIndex = location.href.match(/start-index=(\d+)/)
  if (startIndex) {
    url += '&' + startIndex[0]
  }

  load(url)
}
