// dependencies: module.js

// display course evals in the eval pane
function display_evals(course) {
  evals_semesters(course)

  // refresh
  $('#evals-numeric-body').children().remove()
  $('#evals-comments-body').children().remove()

  // find correct semester
  for (var index in course.evaluations) {
    var eval = course.evaluations[index]
    if (eval.semester._id === course.semester._id) {
      evals_comments(eval)
      evals_numeric(eval)
    }
  }

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
  for (var index in course.evaluations) {
    var eval = course.evaluations[index]
    $('#evals-semesters-body').append(newDOMsemesterEval(eval))
  }

  evals_autotoggle('semesters')
}

// display numeric evaluations in evals pane
function evals_numeric(evaluation) {
  // go through numeric evaluations
  for (var field in evaluation.scores) {
    $('#evals-numeric-body').append(newDOMnumericEval(field, evaluation.scores[field]))
  }
}

// display student comment evals in evals pane
function evals_comments(evaluation) {
  // go through student comments
  for (var index in evaluation.comments) {
    var comment = evaluation.comments[index]
    $('#evals-comments-body').append(newDOMcommentEval(comment))
  }
}

// returns a DOM object for a semester entry of the displayed course
function newDOMsemesterEval(evaluation) {
  var professors = ''
  for (var index in evaluation.instructors) {
    var professor = evaluation.instructors[index]
    professors += ', ' + professor.name.first + ' ' + professor.name.last
  }
  if (professors !== '') professors = '\xa0' + professors.substring(1)

  var hasScore = (evaluation.hasOwnProperty('scores') && evaluation.scores.hasOwnProperty('Overall Quality of the Course'))

  if (hasScore)
    var score = evaluation.scores['Overall Quality of the Course']

  var htmlString= (
    '<li class="list-group-item flex-container-row">'
    + '<div class="flex-item-stretch truncate">'
      + '<strong>' + evaluation.semester.name + '</strong>'
      + professors
    + '</div>'
    + '<span class="badge"' + (hasScore ? ' style="background-color: ' + colorAt(score) + '"' : '') + '>'
      + (hasScore ? score.toFixed(2) : 'N/A')
    + '</span>'
  + '</li>'
  )

  var entry = $.parseHTML(htmlString)[0]       // create DOM object
  entry.evaluation = evaluation

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

  var entry = $.parseHTML(htmlString)[0]       // create DOM object

  return entry
}

// returns a DOM object for an eval of the displayed course
function newDOMcommentEval(eval) {
  var htmlString = (
    '<li class="list-group-item eval-result flex-container-row">'
    + '<div class="flex-item-stretch">'
      + eval.comment
    + '</div>'
    + '<div class="flex-item-rigid flex-eval">'
      + '<span>'
        + '<span class="evals-count">' + eval.votes + '</span> '
        + '<i class="fa fa-thumbs-up up-icon"></i>'
      + '</span>'
    + '</div>'
  + '</li>'
  )

  var entry = $.parseHTML(htmlString)[0]                   // create DOM object
  var count = $(entry).find('.evals-count')                // counter
  var evalId = eval._id                                     // eval id
  var icon = $(entry).find('i')                            // icon
  icon.click(function() {toggleVote(icon, evalId, count)}) // handle clicks
  entry.eval = eval                                        // link to eval object

  return entry
}

// handles click of voting for evaluation:
// - icon is jQuery object of the corresponding i element
// - evalId is id of the corresponding evaluation
// - count is jQuery object of the corresponding .evals-count element
function toggleVote(icon, evalId, count) {
  // update icon
  var hasVoted = icon.hasClass('down-icon');
  icon.removeClass(hasVoted ? 'down-icon' : 'up-icon')
  icon.addClass(hasVoted ? 'up-icon' : 'down-icon')

  // update count
  var votes = parseInt(count.text())
  votes += (hasVoted ? -1 : 1)
  count.text(votes)

  // update database
  $.ajax({
    url: '/api/evaluations/' + evalId + '/votes',
    type: (hasVoted ? 'DELETE' : 'PUT')
  })
}
