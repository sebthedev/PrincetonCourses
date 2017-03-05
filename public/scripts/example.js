// An example script that shows how the page can make a request to our server
$(document).ready(function () {
  $.get('/api/whoami', function (data) {
    window.alert('Hi! Your netid is:' + data.netid)
  })
})
