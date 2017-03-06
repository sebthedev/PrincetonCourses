// A script that uses Cheerio to scrape course evaluation information from the Registrar
// At the moment this script does not save the data anywhere

var http = require('https')
var cheerio = require('cheerio')

var loadPage = function (term, courseID, externalCallback) {
    // Define the HTTP request options
  var options = {
    host: 'reg-captiva.princeton.edu',
    path: '/chart/index.php?' + 'terminfo=' + term + '&courseinfo=' + courseID
  }

    // Make the request
  var req = http.request(options, function (res) {
    console.log('Request sent to the Registrar.')

    var str = ''

        // Append received data to already received data
    res.on('data', function (chunk) {
      str += chunk
    })

        // Handle data once it has all been received
    res.on('end', function () {
      console.log('Data recieved from the Registrar.')
    //   var data = JSON.parse(str)
      externalCallback(str)
    })
  })
  req.end()
}

// loadPage('1164', '002065', function (data) {
loadPage('1162', '008333', function (data) {
  var $ = cheerio.load(data)

  // Get Chart Data
  var b64EncodedChartData = $('#chart_settings').attr('value')
  var chartData = Buffer.from(b64EncodedChartData, 'base64').toString('ascii')
  var chart = JSON.parse(chartData)

  // Extract Numerical Evaluation Data from Chart
  var numericEvaluations = {}
  var xItems = chart.PlotArea.XAxis.Items
  var yItems = chart.PlotArea.ListOfSeries[0].Items
  for (var itemIndex in chart.PlotArea.XAxis.Items) {
    numericEvaluations[xItems[itemIndex].Text] = yItems[itemIndex].YValue
  }
  console.log(numericEvaluations)

  // Extract student comments
  var studentComments = []
  $('table:last-child tr:not(:first-child) td').each(function (index, element) {
    studentComments.push($(element).text())
  })
  console.log(studentComments)
})
