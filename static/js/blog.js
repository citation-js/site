if (!Array.prototype.map) {
  Array.prototype.map = function (mapper) {
    let array = this
    for (var i = 0; i < array.length; i++) {
      array[i] = mapper.call(array[i], i, array)
    }
    return array
  }
}

function formatDate (string) {
  var date = new Date(string)
  return date.toLocaleString()
}

function canonical (links) {
  for (var i = 0; i < links.length; i++) {
    if (links[i].rel === 'alternate' && links[i].type === 'text/html') {
      return links[i].href
    }
  }
}

var templates = {
  feed: function (items) {
    return '<div>' +
      items.map(templates.feedItem).join('') +
    '</div>'
  },
  feedItem: function (item) {
    var id = item.id.$t.replace(/^.*\.post-(\d+)$/, '$1')

    return '<div class="mdl-card mdl-shadow--2dp">' +
      '<div class="mdl-card__title">' +
        '<h2 class="mdl-card__title-text">' +
          '<a href="?post=' + id + '">' + item.title.$t + '</a>' +
        '</h2>' +
      '</div>' +
      '<div class="header mdl-card__supporting-text">' +
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
            item.category.map(templates.tag).join(' ') +
          '</span>' +
        '</p>' +
      '</div>' +
      '<div class="mdl-card__supporting-text">' +
        item.content.$t +
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

  if (params.post) {
    load('https://larsgw.blogspot.com/feeds/posts/default/' + params.post + '?alt=json-in-script&callback=cb')
  } else if (params.tag) {
    load('https://larsgw.blogspot.com/feeds/posts/default/-/Citation.js/' + params.tag + '?alt=json-in-script&callback=cb')
  } else {
    load('https://larsgw.blogspot.com/feeds/posts/default/-/Citation.js?alt=json-in-script&callback=cb')
  }
}
