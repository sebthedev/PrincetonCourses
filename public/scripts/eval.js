
// display course evals in the eval pane
function display_evals(course) {
  evals_comments(course)
}

// display student comment evals in evals pane
function evals_comments(course) {
  // refresh
  $('#evals-comments-body').children().remove()

  // find correct semester
  for (var index in course.evaluations) {
    var eval = course.evaluations[index]
    if (eval.semester._id === course.semester._id) {

      // go through student comments
      for (var cindex in eval.comments) {
        var comment = eval.comments[cindex]
        $('#evals-comments-body').append(newDOMEval(comment))
      }
    }
  }
}

// returns a DOM object for an eval of the displayed course
function newDOMEval(eval) {
  var htmlString = (
    '<li class="list-group-item eval-result flex-container-row">'
    + '<div class="flex-item-stretch">'
      + eval.comment
    + '</div>'
    + '<div class="flex-item-rigid">'
      + eval.votes + ' '
      + '<i class="fa fa-thumbs-up"></i>'
    + '</div>'
  + '</li>'
  )

  var entry = $.parseHTML(htmlString)[0]       // create DOM object
  entry.eval = eval                            // link to eval object

  return entry
}
