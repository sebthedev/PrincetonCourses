// returns a DOM element for results in the search pane for the given course
function newResultEntry(course) {
  var newResult = document.createElement('a')
  newResult.setAttribute('class', 'list-group-item search-result')

  // create dial
  var newSVG
  if (course.evaluations.hasOwnProperty('scores') &&
      course.evaluations.scores.hasOwnProperty('Overall Quality of the Course')) {
    newSVG = newEvalDispDial(course.evaluations.scores['Overall Quality of the Course'])
  } else {
    newSVG = newEvalDispDial(0)
  }
  newResult.append(newSVG)

  // div to hold text
  var newHolder = document.createElement('div')
  newHolder.setAttribute('class', 'result-text')

  // first row
  var newDiv = document.createElement('div')
  newDiv.setAttribute('class', 'truncate')

  // course listing as title
  var newStrong = document.createElement('strong')
  newStrong.appendChild(document.createTextNode(getListings(course)))
  newDiv.appendChild(newStrong)

  // handle various labels
  var newSpan

  if (course.distribution != undefined) {
    newSpan = document.createElement('span')
    newSpan.setAttribute('class', 'label label-info')
    newSpan.appendChild(document.createTextNode(course.distribution))
    newDiv.appendChild(document.createTextNode(' '))
    newDiv.appendChild(newSpan)
  }

  if (course.pdf["required"]) {
    newSpan = document.createElement('span')
    newSpan.setAttribute('class', 'label label-warning')
    newSpan.appendChild(document.createTextNode('PDF ONLY'))
    newDiv.appendChild(document.createTextNode(' '))
    newDiv.appendChild(newSpan)
  } else if (course.pdf["permitted"]) {
    newSpan = document.createElement('span')
    newSpan.setAttribute('class', 'label label-warning')
    newSpan.appendChild(document.createTextNode('PDF'))
    newDiv.appendChild(document.createTextNode(' '))
    newDiv.appendChild(newSpan)
  } else {
    newSpan = document.createElement('span')
    newSpan.setAttribute('class', 'label label-warning')
    newSpan.appendChild(document.createTextNode('NPDF'))
    newDiv.appendChild(document.createTextNode(' '))
    newDiv.appendChild(newSpan)
  }

  if (course.audit) {
    newSpan = document.createElement('span')
    newSpan.setAttribute('class', 'label label-warning')
    newSpan.appendChild(document.createTextNode('AUDIT'))
    newDiv.appendChild(document.createTextNode(' '))
    newDiv.appendChild(newSpan)
  }

  newHolder.appendChild(newDiv) // append first row

  // second row
  newDiv = document.createElement('div')
  newDiv.setAttribute('class', 'truncate')
  newDiv.appendChild(document.createTextNode(course.title))
  newHolder.appendChild(newDiv)

  newResult.appendChild(newHolder)

  return newResult
}

// returns a string of the course listings of the given course
function getListings(course) {
  listings = course.department + course.catalogNumber
  for (var listing in course.crosslistings) {
    listings += '/' + course.crosslistings[listing].department
                    + course.crosslistings[listing].catalogNumber
  }

  return listings
}

// returns as a string (a,b%,c%) at the given fraction between (a1,b1%,c1%) and (a2,b2%,c2%)
function HSLcolorAt(a1, b1, c1, a2, b2, c2, fraction) {
  var a = a1 + (a2-a1)*fraction
  var b = b1 + (b2-b1)*fraction
  var c = c1 + (c2-c1)*fraction
  return '(' + a + ',' + b + '%,' + c + '%)'
}

// returns as a string hsl(a,b%,c%) at the given score
function colorAt(score) {
  const maxscore = 5.0               // max value of score
  const midscore = 3.5               // mid value of score (for gradient)
  const minscore = 1.0               // min value of score

  // gradient between red and blue
  var c
  if (score > midscore) {
    c = 'hsl' + HSLcolorAt(60, 80, 60, 180, 80, 60, (score-midscore)/(maxscore-midscore))
  } else {
    c = 'hsl' + HSLcolorAt(0, 80, 60, 60, 80, 60, (score-minscore)/(midscore-minscore))
  }

  return c
}

// returns an SVG DOM element with the given score
function newEvalDispDial(score) {
  const r0 = 20                      // radius of display (height = width = 2*r0)
  const r1 = 15                      // inner radius
  const a0 = 0.5*Math.PI             // angle of dial cover (in rad)
  const c0 = 'rgb(50,50,50)'         // main color
  const c1 = 'rgb(130,130,130)'      // unfilled dial color
  const maxscore = 5.0               // max value of score
  const midscore = 3.5               // mid value of score (for gradient)
  const minscore = 1.0               // min value of score
  const valid = (minscore <= score && score <= maxscore) // if score is in range

  if (valid) {
    // angle to be displayed (in rad)
    var angle = (score-minscore)/(maxscore-minscore) * (2*Math.PI-a0)

    // dial color (gradient between red and blue)
    var c2
    if (score > midscore) {
      c2 = 'hsl' + HSLcolorAt(60, 80, 60, 180, 80, 60, (score-midscore)/(maxscore-midscore))
    } else {
      c2 = 'hsl' + HSLcolorAt(0, 80, 60, 60, 80, 60, (score-minscore)/(midscore-minscore))
    }
  } else {
    var angle = 0
    var c2 = 'rgb(200,200,200)'
  }

  // coordinates
  var x, y, t

  // create svg element
  var newSVG = document.createElementNS( "http://www.w3.org/2000/svg", "svg")
  newSVG.setAttributeNS(null, 'style', "width: "+(2*r0)+"px; height: "+(2*r0)+"px")
  newSVG.setAttributeNS(null, 'class', 'result-dial')

  // create background circle
  var newCircle = document.createElementNS( "http://www.w3.org/2000/svg", "circle")
  newCircle.setAttributeNS(null, 'cx', r0)
  newCircle.setAttributeNS(null, 'cy', r0)
  newCircle.setAttributeNS(null, 'r', r0)
  newCircle.setAttributeNS(null, 'fill', c1)
  newSVG.appendChild(newCircle)

  x = r0+r0*Math.sin(a0) // x-coordinate for base of dial cover
  y = r0-r0*Math.cos(a0) // y-coordinate for base of dial cover

  // create base of dial cover
  var newSector = document.createElementNS( "http://www.w3.org/2000/svg", "path")
  newSector.setAttributeNS(null, 'fill', c0)
  newSector.setAttributeNS(null, 'd', 'M' + r0 + ',' + r0 + ' L' + r0 + ',0 A' + r0 + ',' + r0 + ' 1 0,1 ' + x + ',' + y + ' z')
  newSector.setAttributeNS(null, 'transform', 'rotate(' + (180 - a0*180/Math.PI/2) + ', ' + r0 + ', ' + r0 + ')')
  newSVG.appendChild(newSector)

  x = r0+r0*Math.sin(angle)     // x-coordinate for dial arc
  y = r0-r0*Math.cos(angle)     // y-coordinate for dial arc
  t = (angle < Math.PI ? 0 : 1) // some sweep thing see https://www.w3.org/TR/SVG/images/paths/arcs02.svg

  // create dial arc
  var newSector = document.createElementNS( "http://www.w3.org/2000/svg", "path")
  newSector.setAttributeNS(null, 'fill', c2)
  newSector.setAttributeNS(null, 'd', 'M' + r0 + ',' + r0 + ' L' + r0 + ',0 A' + r0 + ',' + r0 + ' 1 ' + t + ',1 ' + x + ',' + y + ' z')
  newSector.setAttributeNS(null, 'transform', 'rotate(' + (180 + a0*180/Math.PI/2) + ', ' + r0 + ', ' + r0 + ')')
  newSVG.appendChild(newSector)

  // create top of dial cover
  var newCover = document.createElementNS( "http://www.w3.org/2000/svg", "circle")
  newCover.setAttributeNS(null, 'cx', r0)
  newCover.setAttributeNS(null, 'cy', r0)
  newCover.setAttributeNS(null, 'r', r1)
  newCover.setAttributeNS(null, 'fill', c0)
  newSVG.appendChild(newCover)

  // create text
  var newText = document.createElementNS( "http://www.w3.org/2000/svg", "text")
  newText.setAttributeNS(null, 'x', r0)
  newText.setAttributeNS(null, 'y', r0)
  newText.setAttributeNS(null, 'fill', c2)
  newText.setAttributeNS(null, 'text-anchor', 'middle')
  newText.setAttributeNS(null, 'alignment-baseline', 'central')
  newText.setAttributeNS(null, 'style', 'font-size: 85%; font-weight: bold')
  var text = (valid ? score : '?')
  newText.appendChild(document.createTextNode(text))
  newSVG.appendChild(newText)

  return newSVG
}
