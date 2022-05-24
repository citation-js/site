$(window).on('load', function () {
  var Cite = require('citation-js')

  function getType (element) {
    var type = Cite.plugins.input.type(element.textContent)
    if (type.slice(-4) === 'json' || type.slice(-6) === 'object') {
      return 'json'
    } else if (type.includes('@bibtex') || type.includes('@biblatex')) {
      return 'bib'
    } else if (type.slice(-3) === 'url' || type.includes('api')) {
      return 'url'
    }
  }

  // Update
  var data
  var old = {}
  function updateInput () {
    var text = $('#input').text()
    var options = { generateGraph: false }

    var type = $('#input-type').val()
    if (type) {
      options.forceType = type
    }

    if (text !== old.text || type !== old.type) {
      old = { text: text, type: type }
      Cite.async(text, options).then(function (result) {
        data = result
        $('#input-error').text('')
        updateOutput()
      }).catch(function (error) {
        $('#input-error').text(error.message)
      })
    }
  }

  function updateOutput () {
    var format = $('#format').val()
    if (format === 'bibliography') {
      $('#output').html(data.format(format, {
        template: $('#style').val(),
        lang: $('#lang').val(),
        format: 'html'
      }))
      return
    }

    var type = $('#type').val()
    if (type === 'object') {
      var object = data.format(format, { type: type })
      $('#output').html('<pre>' + JSON.stringify(object, null, 2) + '</pre>')
    } else {
      $('#output').html('<pre>' + data.format(format, {
        type: type
      }) + '</pre>')
    }

    // Highlight
    if (type === 'object' || format === 'data') {
      $('#output pre').attr('data-type', 'json')
      $('#output pre').data('type', 'json')
      $('#output pre').highlight()
    } else if (format === 'bibtex' || format === 'biblatex') {
      $('#output pre').attr('data-type', 'bib')
      $('#output pre').data('type', 'bib')
      $('#output pre').highlight()
    }
  }

  // Display info
  $('#info-version').html(Cite.version.cite)
  $('#info-plugins').html(Cite.plugins.list().join(', '))
  var types = Cite.plugins.input.list()
  for (var i = 0; i < types.length; i++) {
    var parts = types[i].split('/')
    var scope = parts[0]
    var type = parts[1]
    var optgroup
    while (!(optgroup = $('#input-type optgroup[label="' + scope + '"]')).length) {
      $('#input-type').append('<optgroup label="' + scope + '"></optgroup>')
    }
    optgroup.append('<option value="' + scope + '/' + type + '">' + type + '</option>')
  }

  // Highlight all code
  $('#input').highlight()
  $('#input').focus(function () {
    $(this).find('span').each(function () {
      $(this).after(this.textContent)
      $(this).remove()
    })
  })
  $('#input').blur(function () {
    var type = getType(this)
    $(this).attr('data-type', type)
    $(this).data('type', type)
    $(this).highlight()
  })

  // Interactive forms
  $('#format').change(function () {
    if ($(this).val() === 'bibliography') {
      $('#fieldset-bibliography').show()
      $('#fieldset-files').hide()
    } else {
      $('#fieldset-bibliography').hide()
      $('#fieldset-files').show()
    }
  })

  $('#input').blur(updateInput)
  $('#input-type').change(updateInput)
  $('#format, #type, #style, #lang').change(updateOutput)
  updateInput()
})
