// returns an SVG DOM element with the given score
function newEvalDispDial (score) {
  const r0 = 30                      // radius of display (height = width = 2*r0)
  const r1 = 20                      // inner radius
  const a0 = 0.5*Math.PI             // angle of dial cover (in rad)
  const c0 = 'rgb(50,50,50)'         // main color
  const c1 = 'rgb(130,130,130)'      // unfilled dial color
  const maxscore = 5.0               // max value of score
  const minscore = 1.0               // min value of score

  // angle to be displayed (in rad)
  var angle = (score-minscore)/(maxscore-minscore) * (2*Math.PI-a0)

  // dial color (gradient between red and green)
  var c2
  if (score > (maxscore - minscore)/2.0) {
    c2 = 'rgb(' + Math.floor(255*2*(maxscore - score)/(maxscore-minscore)) + ',' + 255 + ',' + 0 + ')'
  } else {
    c2 = 'rgb(' + 255 + ',' + Math.floor(255*2*(score - minscore)/(maxscore-minscore)) + ',' + 0 + ')'
  }

  // coordinates
  var x, y, t

  // create svg element
  var newSVG = document.createElementNS( "http://www.w3.org/2000/svg", "svg")
  newSVG.setAttributeNS(null, 'style', "width: "+(2*r0)+"px; height: "+(2*r0)+"px")

  // create background circle
  var newCircle = document.createElementNS( "http://www.w3.org/2000/svg", "circle")
  newCircle.setAttributeNS(null, 'cx', r0)
  newCircle.setAttributeNS(null, 'cy', r0)
  newCircle.setAttributeNS(null, 'r', r0)
  newCircle.setAttributeNS(null, 'fill', c1)
  newSVG.appendChild(newCircle)

  x = r0+30*Math.sin(a0) // x-coordinate for base of dial cover
  y = r0-30*Math.cos(a0) // y-coordinate for base of dial cover

  // create base of dial cover
  var newSector = document.createElementNS( "http://www.w3.org/2000/svg", "path")
  newSector.setAttributeNS(null, 'fill', c0)
  newSector.setAttributeNS(null, 'd', 'M' + r0 + ',' + r0 + ' L' + r0 + ',0 A' + r0 + ',' + r0 + ' 1 0,1 ' + x + ',' + y + ' z')
  newSector.setAttributeNS(null, 'transform', 'rotate(' + (180 - a0*180/Math.PI/2) + ', ' + r0 + ', ' + r0 + ')')
  newSVG.appendChild(newSector)

  x = r0+30*Math.sin(angle)     // x-coordinate for dial arc
  y = r0-30*Math.cos(angle)     // y-coordinate for dial arc
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
  newText.appendChild(document.createTextNode(score))
  newSVG.appendChild(newText)

  return newSVG
}
