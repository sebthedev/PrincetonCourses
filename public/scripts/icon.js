// dependencies: suggest.js (const lists)

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
               && course.evaluations.scores.hasOwnProperty('Quality of Course'))
  } else {
    var hasScore = (course.hasOwnProperty('scores') && course.scores.hasOwnProperty('Quality of Course'))
  }
  var isPast = course.hasOwnProperty('scoresFromPreviousSemester') && course.scoresFromPreviousSemester
  var isNew = course.hasOwnProperty('new') && course.new

  if (hasScore) {
    if (isTitle) var score = course.evaluations.scores['Quality of Course']
    else var score = course.scores['Quality of Course']
  }

  var tooltip = 'No score available' // default
  if (hasScore && isPast) tooltip = 'Quality of Course from the most recent time this instructor taught this course'
  else if (hasScore) tooltip = 'Quality of Course'
  else if (isNew) tooltip = 'New course'

  var color = '#ddd' // default light grey
  if (hasScore) color = colorAt(score)
  else if (isNew) color = '#92d4e3' // blue

  var text = 'N/A' // default
  if (hasScore && isPast) text = score.toFixed(2) + '*'
  else if (hasScore) text = score.toFixed(2)
  else if (isNew) text = 'New'

  // console.log(course.title)
  // console.log(course)
  // console.log(isTitle)
  // console.log(hasScore)
  // console.log(isPast)
  // console.log(tooltip)
  // console.log(text)
  // console.log("")

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

// returns as a string a color at the given score
function colorAt(score) {
  if (score > 4.5)
    // to deeper green #2e7d32 hsl(123, 46%, 34%)
    return hsllg(122,39,49, 123,46,34, 4.5,5,score)
  if (score > 4.0)
    // to brighter green #4caf50 hsl(122, 39%, 49%)
    return hsllg(88,50,53, 122,39,49, 4,4.5,score)
  if (score > 3.5)
    // to lighter green #8bc34a hsl(88, 50%, 53%)
    return hsllg(64,61,51, 88,50,53, 3.5,4,score)
  else if (score > 3.0)
    // to olive #c6cf37 hsl(64, 61%, 51%)
    return hsllg(45,100,58, 64,61,51, 3,3.5,score)
  else if (score > 2.5)
    // to yellow #ffca28 hsl(45, 100%, 58%)
    return hsllg(36,100,47, 45,100,58, 2.5,3,score)
  else if (score > 2.0)
    // to orange #ef9100 hsl(36, 100%, 47%)
    return hsllg(2,64,58, 36,100,47, 2,2.5,score)
  else if (score > 1.5)
    // to brighter red #d9534f hsl(2, 64%, 58%)
    return hsllg(14,88,40, 2,64,58, 1.5,2,score)
  else
    // deeper red #bf360c hsl(14, 88%, 40%)
    return '#bf360c'
}

// linear interpolation of hsl at x given (h1, s1%, l1%) at x1 and (h2, s2%, l2%) at x2
function hsllg(h1,s1,l1, h2,s2,l2, x1,x2,x) {
  var h = h1 + (h2-h1)/(x2-x1)*(x-x1)
  var s = s1 + (s2-s1)/(x2-x1)*(x-x1)
  var l = l1 + (l2-l1)/(x2-x1)*(x-x1)

  return 'hsl(' + h + ', ' + s + '%, ' + l + '%)'
}

// returns a HTML string for all tags of a course
// props is an object that contains the following info:
// -- title: indicates tags for display title if defined
function newHTMLtags(course, props) {
  var isTitle = (props != undefined && props.hasOwnProperty('title'))
  var tipPlacement = (isTitle ? 'bottom' : 'top')
  var tag_type = (isTitle ? 'label ' : '')

  /* DISTRIBUTION TAG */

  var tag_distribution = ''
  if(course.hasOwnProperty('distribution')) {
    for(distribution in distributionsAll) {
      if((new RegExp(distribution)).test(course.distribution)) tag_distribution += ' ' + newHTMLtag(
        {
          'tooltip': distributionsAll[distribution],
          'placement': tipPlacement,
          'class': tag_type + (isTitle ? 'label-info' : 'text-info'),
          'text': distribution
        }
      )
    }
  }

  /* PDF TAG */

  var hasPDF = course.hasOwnProperty('pdf') && course.pdf.hasOwnProperty('required') && course.pdf.hasOwnProperty('permitted')
  var pdf_pdfo = hasPDF && course.pdf.required
  var pdf_pdf = hasPDF && !pdf_pdfo && course.pdf.permitted
  var pdf_npdf = hasPDF && !pdf_pdfo && !course.pdf.permitted

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
  else pdf_style = 'text-' + pdf_style

  var tag_pdf = ''
  if (hasPDF) tag_pdf = newHTMLtag(
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
      'class': tag_type + (isTitle ? 'label-warning' : 'text-warning'),
      'text': (isTitle ? 'AUDIT' : 'A')
    }
  )
  else tag_audit = newHTMLtag(
    {
      'tooltip': 'Audit unavailable',
      'placement': tipPlacement,
      'class': tag_type + (isTitle ? 'label-danger' : 'text-danger'),
      'text': 'NA'
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

// returns a HTML string for a lock indicating the openness of the course
function newHTMLlock(course) {
  var isOpen = course.open

  var tip = (isOpen ? 'Open' : 'Limited places')
  var icon = (isOpen ? 'fa-unlock-alt' : 'fa-lock')
  var style = (isOpen ? 'text-success' : 'text-danger')

  var htmlString = (
    '<i '
    + 'data-toggle="tooltip" '
    + 'data-original-title="' + tip + '" '
    + 'class="fa ' + icon + ' ' + style + '"'
  + '></i>'
  )

  // displaying only non-open courses
  if (isOpen) htmlString = ''

  return htmlString
}
