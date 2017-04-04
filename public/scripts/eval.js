
// display course evals in the eval pane
function display_evals(course) {

  // find correct semester
  for (var index in course.evaluations) {
    var eval = course.evaluations[index]
    if (eval.semester._id === course.semester._id) {
      evals_comments(eval)
      evals_numeric(eval)
    }
  }
}

// display numeric evaluations in evals pane
function evals_numeric(evaluation) {
  // refresh
  $('#evals-numeric-body').children().remove()

  // go through numeric evaluations
  for (var field in evaluation.scores) {
    $('#evals-numeric-body').append(newDOMnumericEval(field, evaluation.scores[field]))
  }
}

// display student comment evals in evals pane
function evals_comments(evaluation) {
  // refresh
  $('#evals-comments-body').children().remove()

  // go through student comments
  for (var index in evaluation.comments) {
    var comment = evaluation.comments[index]
    $('#evals-comments-body').append(newDOMcommentEval(comment))
  }
}

// returns a DOM object for a numeric eval of the displayed course
function newDOMnumericEval(field, value) {
  var width = value*20.0 // as a percentage

  var htmlString= (
    '<li class="list-group-item eval-result">'
    + '<div class="flex-container-row">'
      + '<div class="flex-item-stretch truncate">'
        + '<div>' + field + '</div>'
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
        + eval.votes + ' '
        + '<i class="fa fa-thumbs-up"></i>'
      + '</span>'
    + '</div>'
  + '</li>'
  )

  var entry = $.parseHTML(htmlString)[0]       // create DOM object
  entry.eval = eval                            // link to eval object

  return entry
}
