// dependencies: module.js

// display course evals in the eval pane
function display_evals(course) {
  // display semesters offered
  evals_semesters(course)

  // refresh
  $('#evals-numeric-body').children().remove()
  $('#evals-comments-body').children().remove()

  // display this semester
  var evaluations = course.evaluations
  evals_comments(evaluations)
  evals_numeric(evaluations)

  evals_autotoggle('comments')
  evals_autotoggle('numeric')
}

// shows/hides sections of no content
var evals_autotoggle = function(section) {
  var div = $('#evals-' + section)
  var body = $('#evals-' + section + '-body')
  var isEmpty = body.is(':empty')

  if (isEmpty) body.append(
    '<div class="list-group-item">'
    + 'No data to display.'
  + '</div>'
  )
}

// display the semesters in the evals pane
function evals_semesters(course) {
  // refresh
  $('#evals-semesters-body').children().remove()

  // go through semesters
  for (var index in course.semesters) {
    $('#evals-semesters-body').append(newDOMsemesterEval(course.semesters[index]))
  }

  evals_autotoggle('semesters')
}

// display numeric evaluations in evals pane
function evals_numeric(evaluations) {
  // go through numeric evaluations
  for (var field in evaluations.scores) {
    $('#evals-numeric-body').append(newDOMnumericEval(field, evaluations.scores[field]))
  }
}

// display student comment evals in evals pane
function evals_comments(evaluations) {
  // go through student comments
  for (var index in evaluations.comments) {
    var comment = evaluations.comments[index]
    $('#evals-comments-body').append(newDOMcommentEval(comment))
  }
}

// returns a DOM object for a semester entry of the displayed course
function newDOMsemesterEval (semester) {
  // create string of professors
  var professors = []
  for (var instructorIndex in semester.instructors) {
    var professor = semester.instructors[instructorIndex]
    professors.push([professor.name.first, professor.name.last].join(' '))
  }
  professors = professors.join(', ')
  if (professors.length > 0) professors = '&nbsp;' + professors

  // extract score (if it exists)
  var hasScore = (semester.hasOwnProperty('scores') && semester.scores.hasOwnProperty('Overall Quality of the Course'))
  if (hasScore) var score = semester.scores['Overall Quality of the Course']

  var htmlString= (
    '<li class="list-group-item flex-container-row">'
    + '<div class="flex-item-stretch truncate">'
      + '<strong>' + semester.semester.name + '</strong>'
      + professors
    + '</div>'
    + '<span class="badge"' + (hasScore ? ' style="background-color: ' + colorAt(score) + '"' : '') + '>'
      + (hasScore ? score.toFixed(2) : 'N/A')
    + '</span>'
  + '</li>'
  )

  var entry = $.parseHTML(htmlString)[0]       // create DOM object
  entry.semester = semester                    // attach object

  return entry
}

// returns a DOM object for a numeric eval of the displayed course
function newDOMnumericEval(field, value) {
  var width = value*20.0 // as a percentage

  var htmlString= (
    '<li class="list-group-item eval-result">'
    + '<div class="flex-container-row">'
      + '<div class="flex-item-stretch">'
        + '<div class="truncate">' + field + '</div>'
        + '<div class="progress">'
          + '<div class="progress-bar" role="progressbar" style="width: ' + width + '%; background-color: ' + colorAt(value) + '"></div>'
        + '</div>'
      + '</div>'
      + '<div class="flex-eval">'
      + '<span class="badge" style="background-color: ' + colorAt(value) + '">'
        + value.toFixed(2)
      + '</span>'
    + '</div>'
  + '</li>'
  )

  // create and return DOM object
  var entry = $.parseHTML(htmlString)[0]
  return entry
}

// returns a DOM object for an eval of the displayed course
function newDOMcommentEval(evaluation) {
  // detect if user has voted already
  var icon = (evaluation.voted ? 'down-icon' : 'up-icon')

  var htmlString = (
    '<li class="list-group-item eval-result flex-container-row">'
    + '<div class="flex-item-stretch">'
      + evaluation.comment
    + '</div>'
    + '<div class="flex-item-rigid flex-eval">'
      + '<span>'
        + '<span class="evals-count">' + evaluation.votes + '</span> '
        + '<i class="fa fa-thumbs-up ' + icon + '"></i>'
      + '</span>'
    + '</div>'
  + '</li>'
  )

  var entry = $.parseHTML(htmlString)[0]
  var count = $(entry).find('.evals-count')
  var icon = $(entry).find('i')

  // Bind the upvote icon to the toggleVote function
  icon.click(function() {return toggleVote(icon, evaluation._id, count)})

  return entry
}

// handles click of voting for evaluation:
// - icon is jQuery object of the corresponding i element
// - evalId is id of the corresponding evaluation
// - count is jQuery object of the corresponding .evals-count element
function toggleVote(icon, evalId, count) {
  // update icon
  var hasVoted = icon.hasClass('down-icon')
  icon.removeClass(hasVoted ? 'down-icon' : 'up-icon')
  icon.addClass(hasVoted ? 'up-icon' : 'down-icon')

  // update count
  var votes = parseInt(count.text())
  votes += (hasVoted ? -1 : 1)
  count.html(votes)

  // update database
  $.ajax({
    url: '/api/evaluations/' + evalId + '/vote',
    type: (hasVoted ? 'DELETE' : 'PUT')
  })

  return false
}
