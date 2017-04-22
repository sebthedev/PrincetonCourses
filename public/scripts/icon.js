
// returns a HTML string for a favorite icon (heart)
// props is an object that contains the following info:
// -- title: indicates tags for display title if defined
function newHTMLfavIcon(courseId, props) {
  var isFav = (document.favorites.indexOf(courseId) !== -1)
  var isTitle = (props != undefined && props.hasOwnProperty('title'))

  var htmlString = (
    '<i '
    + 'data-toggle="tooltip" '
    + 'data-original-title="' + (isFav ? 'Click to unfavorite' : 'Click to favorite') + '" '
    + (isTitle ? 'data-placement="bottom" ' : '')
    + 'class="fa fa-heart ' + (isFav ? 'unfav-icon' : 'fav-icon') + '"'
  + '></i>'
  )

  return htmlString
}

// returns a HTML string for a score badge
// props is an object that contains the following info:
// -- title: indicates tags for display title if defined
function newHTMLscoreBadge(course, props) {
  var isTitle = (props != undefined && props.hasOwnProperty('title'))
  if (isTitle) {
    var hasScore = (course.hasOwnProperty('evaluations')
               && course.evaluations.hasOwnProperty('scores')
               && course.evaluations.scores.hasOwnProperty('Overall Quality of the Course'))
  } else {
    var hasScore = (course.hasOwnProperty('scores') && course.scores.hasOwnProperty('Overall Quality of the Course'))
  }
  var isPast = course.hasOwnProperty('scoresFromPreviousSemester') && course.scoresFromPreviousSemester
  var isNew = course.hasOwnProperty('new') && course.new

  if (hasScore) {
    if (isTitle) var score = course.evaluations.scores['Overall Quality of the Course']
    else var score = course.scores['Overall Quality of the Course']
  }

  var tooltip = 'No score available' // default
  if (hasScore && isPast) tooltip = 'Overall Quality of the Course from the most recent time this instructor taught this course'
  else if (hasScore) tooltip = 'Overall Quality of the Course'
  else if (isNew) tooltip = 'New course'

  var color = '#ddd' // default light grey
  if (hasScore) color = colorAt(score)
  else if (isNew) color = '#92d4e3' // blue

  var text = 'N/A' // default
  if (hasScore && isPast) text = score.toFixed(2) + '*'
  else if (hasScore) text = score.toFixed(2)
  else if (isNew) text = 'New'

  var htmlString = (
    '<span '
    + 'data-toggle="tooltip" '
    + 'data-original-title="' + tooltip + '" '
    + (isTitle ? 'data-placement="bottom" ' : '')
    + 'class="badge badge-score' + (isTitle ? ' badge-large' : '') + '" '
    + 'style="background-color: ' + color + '"'
  + '>'
      + text
  + '</span>'
  )

  return htmlString
}

// returns a HTML string for all tags of a course
// props is an object that contains the following info:
// -- title: indicates tags for display title if defined
function newHTMLtags(course, props) {
  var isTitle = (props != undefined && props.hasOwnProperty('title'))
  var tipPlacement = (isTitle ? 'bottom' : 'top')
  var tag_type = (isTitle ? 'label ' : '')

  /* DISTRIBUTION TAG */

  var hasDistribution = (course.hasOwnProperty('distribution') && (course.distribution in distributions))

  var tag_distribution = ''
  if (hasDistribution) tag_distribution = newHTMLtag(
    {
      'tooltip': distributions[course.distribution],
      'placement': tipPlacement,
      'class': tag_type + (isTitle ? 'label-info' : 'text-info-dim'),
      'text': course.distribution
    }
  )

  /* PDF TAG */

  var hasPDF = course.hasOwnProperty('pdf') && course.pdf.hasOwnProperty('required') && course.pdf.hasOwnProperty('permitted')
  var pdf_pdfo = hasPDF && course.pdf.required
  var pdf_pdf = hasPDF && course.pdf.permitted
  var pdf_npdf = hasPDF && !course.pdf.permitted

  if (pdf_pdfo) {
    var pdf_tooltip = 'PDF only'
    var pdf_style = 'danger'
    var pdf_text = 'PDFO'
  } else if (pdf_pdf) {
    var pdf_tooltip = 'PDF available'
    var pdf_style = 'warning'
    var pdf_text = 'PDF'
  } else if (pdf_npdf) {
    var pdf_tooltip = 'No PDF'
    var pdf_style = 'danger'
    var pdf_text = 'NPDF'
  }

  if (isTitle) pdf_style = 'label-' + pdf_style
  else pdf_style = 'text-' + pdf_style + '-dim'

  var tag_pdf = ''
  if (hasPDF && (isTitle || pdf_pdfo || pdf_npdf)) tag_pdf = newHTMLtag(
    {
      'tooltip': pdf_tooltip,
      'placement': tipPlacement,
      'class': tag_type + pdf_style,
      'text': pdf_text
    }
  )

  /* AUDIT TAG */

  var hasAudit = course.hasOwnProperty('audit') && course.audit

  var tag_audit = ''
  if (hasAudit) tag_audit = newHTMLtag(
    {
      'tooltip': 'Audit available',
      'placement': tipPlacement,
      'class': tag_type + (isTitle ? 'label-warning' : 'text-warning-dim'),
      'text': (isTitle ? 'AUDIT' : 'A')
    }
  )

  var htmlString = (
    tag_distribution + ' '
  + tag_pdf + ' '
  + tag_audit
  )

  return htmlString
}

// returns a HTML string for a tag
// props is an object that contains the following info:
// -- tooltip: text to display on hover
// -- placement: direction of tooltip
// -- class: list of classes
// -- text: text inside tag
function newHTMLtag(props) {
  var hasTooltip = props.hasOwnProperty('tooltip')
  var hasPlacement = props.hasOwnProperty('placement')
  var hasClass = props.hasOwnProperty('class')
  var hasText = props.hasOwnProperty('text')

  var tooltip = (hasTooltip ? ' data-toggle="tooltip" data-original-title="' + props.tooltip + '"' : '')
  var placement = (hasPlacement ? ' data-placement="' + props.placement + '"' : '')
  var classes = (hasClass ? ' class="' + props.class + '"' : '')
  var text = (hasText ? props.text : '')

  var htmlString = (
    '<span'
    + tooltip
    + placement
    + classes
  + '>'
      + text
 + '</span>'
  )

  return htmlString
}

// returns a HTML string for the listings of a course
// props is an object that contains the following info:
// -- title: indicates tags for display title if defined
function newHTMLlistings(course, props) {
  var htmlString = newHTMLlisting(course.department, course.catalogNumber, props)
  for (var i in course.crosslistings) {
    var listing = course.crosslistings[i]

    htmlString += ' / ' + newHTMLlisting(listing.department, listing.catalogNumber, props)
  }

  return htmlString
}

// returns a HTML string for the given listing
// props is an object that contains the following info:
// -- title: indicates tags for display title if defined
function newHTMLlisting(department, catalogNumber, props) {
  var hasTooltip = (department in departments)
  var isTitle = (props != undefined && props.hasOwnProperty('title'))

  var tooltip = (hasTooltip ? ' data-toggle="tooltip" data-original-title="' + departments[department] + '"' : '')
  var placement = ' data-placement="' + (isTitle ? 'bottom' : 'top') + '"'
  var text = department + catalogNumber

  var htmlString = (
    '<span'
    + tooltip
    + placement
  + '>'
      + text
  + '</span>'
  )

  return htmlString
}
