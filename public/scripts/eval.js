// dependencies: module.js

// display course evals in the eval pane
function display_evals(course) {
  evals_semesters(course)

  // refresh
  $('#evals-numeric-body').children().remove()
  $('#evals-comments-body').children().remove()

  // find correct semester
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
  var professors = []
  for (var instructorIndex in semester.instructors) {
    var professor = semester.instructors[instructorIndex]
    professors.push([professor.name.first, professor.name.last].join(' '))
  }
  professors = professors.join(', ')
  if (professors.length > 0) {
    professors = '&nbsp;' + professors
  }

  var hasScore = (semester.hasOwnProperty('scores') && semester.scores.hasOwnProperty('Overall Quality of the Course'))

  if (hasScore) {
    var score = semester.scores['Overall Quality of the Course']
  }

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
  entry.evaluation = semester

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
function newDOMcommentEval(evaluation) {

  // The basic HTML used for displaying a comment
  let htmlString = '<li class="list-group-item eval-result flex-container-row evaluation-comment"><div class="flex-item-stretch evaluation-comment-text"></div><div class="flex-item-rigid flex-eval"><span><span class="evaluation-comment-votes"></span><i class="fa fa-thumbs-up"></i></span></div></li>'

  // Set the data on this comment
  var entry = $(htmlString)
  entry.data('evaluation-id', evaluation._id)
  entry.find('.evaluation-comment-text').text(evaluation.comment)
  entry.find('.evaluation-comment-votes').html(evaluation.votes + '&nbsp;')

  // Mark the toggle as voted if the user has previously voted on this comment
  if (evaluation.voted) {
    entry.find('i').addClass('voted')
  }

  // Bind the upvote icon to the toggleVote function
  entry.find('i').click(toggleVote)

  return entry
}

// handles click of voting for evaluation:
function toggleVote () {
  let thisEvaluationComment = $(this.closest('.evaluation-comment'))

  // update icon
  let icon = thisEvaluationComment.find('i')
  var hasVoted = icon.hasClass('voted')
  icon.toggleClass('voted')

  // update count
  let count = thisEvaluationComment.find('.evaluation-comment-votes')
  var votes = parseInt(count.text())
  votes += (hasVoted ? -1 : 1)
  count.html(votes + '&nbsp;')

  // update database
  $.ajax({
    url: '/api/evaluations/' + $(thisEvaluationComment).data('evaluation-id') + '/vote',
    type: (hasVoted ? 'DELETE' : 'PUT')
  })
}
