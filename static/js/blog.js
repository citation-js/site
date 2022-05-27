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
    return items.map(templates.feedItem).join('')
  },
  feedItem: function (item) {
    var id = item.id.$t.replace(/^.*\.post-(\d+)$/, '$1')
    var content = item.content.$t
      .replace(/^[\s\S]*<div class="stackedit__html">([\s\S]*)<\/div>[\s\S]*$/, '$1')
      .replace(/<(\/?)table/g, function (match, slash) {
        if (slash) {
          return '</table></div'
        } else {
          return '<div class="table-container"><table'
        }
      })

    var highestLevel = content.match(/<h[1-6]/g)
    if (highestLevel) {
      highestLevel = Math.min.apply(null, highestLevel.map(function (header) {
        return parseInt(header.slice(2, 3))
      }))
    }

    content = content.replace(/<(\/?)h([1-6])/g, function (match, slash, level) {
      return '<' + slash + 'h' + (parseInt(level) - highestLevel + 3)
    })

    var metadata = '<h2><a href="?post=' + id + '">' + item.title.$t + '</a></h2>' +
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
    '</p>'

    if (item.category.length > 1) {
      metadata += '<p>' +
        '<span><i class="material-icons">bookmark</i> ' +
          item.category.map(templates.tag).join(' ') +
        '</span>' +
      '</p>'
    }

    return '<section id="' + item.id.$t + '">' +
      '<header>' + metadata + '</header>' +
      content +
    '</section>'
  },
  tag: function (tag) {
    if (tag.term === 'Citation.js') {
      return ''
    }

    var text = tag.term
    if (tag.count !== undefined) {
      text += ' (' + tag.count + ')'
    }

    return '<span class="chip">' +
      '<a href="?tag=' + tag.term + '">' + text + '</a>' +
    '</span>'
  },
  author: function (author) {
    return '<span class="chip">' +
      '<img src="' + author.gd$image.src + '"></img>' +
      '<a href="' + author.uri.$t + '">' + author.name.$t + '</a>' +
    '</span>'
  },
  sidebar: function (items) {
    var html = ''
    var currentYear

    for (var i = 0; i < items.length; i++) {
      var item = items[i]
      var year = (new Date(item.published.$t)).getFullYear()
      if (year !== currentYear) {
        if (currentYear) {
          html += '</section>'
        }
        html += '<section>'
        html += '<h2><a href="#' + item.id.$t + '">' + year + '</a></h2>'
        currentYear = year
      }
      html += '<p><a href="#' + item.id.$t + '">' + item.title.$t + '</a></p>'
    }

    return html + '</section>'
  }
}

function cb (data) {
  var content = document.getElementById('content')
  content.innerHTML = data.feed ? templates.feed(data.feed.entry) : templates.feedItem(data.entry)

  if (data.feed) {
    // pagination
    var href = location.href
    var hasIndex = href.indexOf('start-index') > -1
    var hasParams = href.indexOf('?') > -1
    var indexPattern = /start-index=(\d+)/

    var pages = Math.ceil(data.feed.openSearch$totalResults.$t / data.feed.openSearch$itemsPerPage.$t)
    if (pages > 1) {
      var paginate = document.getElementById('pagination')

      var paginatePrev = document.createElement('a')
      var prev = find(data.feed.link, function (link) { return link.rel === 'previous' })
      if (prev) {
        prev = 'start-index=' + prev.href.match(indexPattern)[1]
        var url = hasIndex ? href.replace(indexPattern, prev) : href + (hasParams ? '?' : '') + prev
        paginatePrev.setAttribute('href', url)
      }
      paginatePrev.setAttribute('class', 'material-icons')
      paginatePrev.textContent = 'navigate_before'
      paginate.appendChild(paginatePrev)

      var paginateNext = document.createElement('a')
      var next = find(data.feed.link, function (link) { return link.rel === 'next' })
      if (next) {
        next = 'start-index=' + next.href.match(indexPattern)[1]
        var url = hasIndex ? href.replace(indexPattern, next) : href + (hasParams ? '&' : '?') + next
        paginateNext.setAttribute('href', url)
      }
      paginateNext.setAttribute('class', 'material-icons')
      paginateNext.textContent = 'navigate_next'
      paginate.appendChild(paginateNext)
    }

    // tags
    var tags = []
    var tagCounts = {}
    for (var i = 0; i < data.feed.entry.length; i++) {
      var entry = data.feed.entry[i]
      for (var j = 0; j < entry.category.length; j++) {
        var tag = entry.category[j]
        if (tag.term in tagCounts) {
          tagCounts[tag.term]++
        } else if (tag.term !== 'Citation.js') {
          tagCounts[tag.term] = 1
          tags.push(tag)
        }
      }
    }
    tags.sort(function (a, b) {
      return tagCounts[b.term] - tagCounts[a.term]
    })

    document.getElementById('tags').innerHTML = tags.map(function (tag) {
      return templates.tag({
        term: tag.term,
        count: tagCounts[tag.term]
      })
    }).join(' ')

    // sidebar
    document.getElementById('sidebar').innerHTML = templates.sidebar(data.feed.entry)
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

  if (params.post || params.tag || params.query) {
    document.getElementById('clear-filters').removeAttribute('hidden')
  }

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
