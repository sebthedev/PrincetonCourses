// Handle requests to the /evaluations API endpoint

// Load Express
let express = require('express')
let router = express.Router()

// Load internal modules
let evaluationModel = require.main.require('./models/evaluation.js')

// Handle requests to vote on an evaluation
router.route('/:id/vote').all(function (req, res, next) {
  if (typeof (req.params.id) === 'undefined') {
    res.sendStatus(400)
    return
  }

  evaluationModel.findById(req.params.id).exec(function (err, evaluation) {
    if (err) {
      console.log(err)
      res.sendStatus(500)
      return
    }
    if (evaluation === null) {
      res.sendStatus(404)
      return
    }
    next()
  })
}).put(function (req, res) {
  let user = res.locals.user

  evaluationModel.findById(req.params.id).exec(function (err, evaluation) {
    if (err) {
      console.log(err)
      res.sendStatus(500)
      return
    }

    // Ensure the user has not already voted on this comment
    if (typeof (evaluation.voters) !== 'undefined' && evaluation.voters.indexOf(user._id) > -1) {
      res.sendStatus(403)
      return
    }

    // Update the evaluation (increment the number of votes and add the user's netID to the list of voters)
    evaluationModel.findByIdAndUpdate(req.params.id, {
      $inc: {
        votes: 1
      },
      $addToSet: {
        voters: user._id
      }
    }, function (err) {
      if (err) {
        console.log(err)
        res.sendStatus(500)
        return
      }

      // Return success to the client
      res.sendStatus(200)
    })
  })
}).delete(function (req, res) {
  let user = res.locals.user

  evaluationModel.findById(req.params.id).exec(function (err, evaluation) {
    if (err || typeof (evaluation.voters) === 'undefined') {
      console.log(err)
      res.sendStatus(500)
      return
    }

    // Ensure the user has already voted on this comment
    if (typeof (evaluation.voters) !== 'object' && evaluation.voters.indexOf(user._id) === -1) {
      res.sendStatus(403)
      return
    }

    // Update the evaluation (increment the number of votes and add the user's netID to the list of voters)
    evaluationModel.findByIdAndUpdate(req.params.id, {
      $inc: {
        votes: -1
      },
      $pull: {
        voters: user._id
      }
    }, function (err) {
      if (err) {
        console.log(err)
        res.sendStatus(500)
        return
      }

      // Return success to the client
      res.sendStatus(200)
    })
  })
})

module.exports = router
