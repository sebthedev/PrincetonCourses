// dependencies: search.js

/* MEL: ideally these const arrays will be stored in the database */

const allcourses = {
  '*': 'All Courses'
}

// distributions
const distributions = {
  'EC': 'Epistemology and Cognition',
  'EM': 'Ethical Thought and Moral Values',
  'HA': 'Historical Analysis',
  'LA': 'Literature and the Arts',
  'SA': 'Social Analysis',
  'QR': 'Quantitative Reasoning',
  'STL': 'Science and Technology with Lab',
  'STN': 'Science and Technology without Lab'
}

// pdf options
const pdfoptions = {
  'PDF': 'P/D/F available',
  'PDFO': 'P/D/F only',
  'NPDF': 'No P/D/F',
  'AUDIT': 'Audit available',
  'NEW': 'New Course'
}

// departments
const departments = {
 'AAS': 'African American Studies',
 'AFS': 'African Studies',
 'AMS': 'American Studies',
 'ANT': 'Anthropology',
 'AOS': 'Atmospheric & Oceanic Sciences',
 'APC': 'Appl and Computational Math',
 'ARA': 'Arabic',
 'ARC': 'Architecture',
 'ART': 'Art and Archaeology',
 'AST': 'Astrophysical Sciences',
 'ATL': 'Atelier',
 'BCS': 'Bosnian-Croatian-Serbian',
 'CBE': 'Chemical and Biological Engr',
 'CEE': 'Civil and Environmental Engr',
 'CGS': 'Cognitive Science',
 'CHI': 'Chinese',
 'CHM': 'Chemistry',
 'CHV': 'Center for Human Values',
 'CLA': 'Classics',
 'CLG': 'Classical Greek',
 'COM': 'Comparative Literature',
 'COS': 'Computer Science',
 'CTL': 'Center for Teaching & Learning',
 'CWR': 'Creative Writing',
 'CZE': 'Czech',
 'DAN': 'Dance',
 'EAS': 'East Asian Studies',
 'ECO': 'Economics',
 'ECS': 'European Cultural Studies',
 'EEB': 'Ecology and Evol Biology',
 'EGR': 'Engineering',
 'ELE': 'Electrical Engineering',
 'ENE': 'Energy Studies',
 'ENG': 'English',
 'ENT': 'Entrepreneurship',
 'ENV': 'Environmental Studies',
 'EPS': 'Contemporary European Politics',
 'FIN': 'Finance',
 'FRE': 'French',
 'FRS': 'Freshman Seminars',
 'GEO': 'Geosciences',
 'GER': 'German',
 'GHP': 'Global Health & Health Policy',
 'GLS': 'Global Seminar',
 'GSS': 'Gender and Sexuality Studies',
 'HEB': 'Hebrew',
 'HIN': 'Hindi',
 'HIS': 'History',
 'HLS': 'Hellenic Studies',
 'HOS': 'History of Science',
 'HPD': 'History/Practice of Diplomacy',
 'HUM': 'Humanistic Studies',
 'ISC': 'Integated Science Curriculum',
 'ITA': 'Italian',
 'JDS': 'Judaic Studies',
 'JPN': 'Japanese',
 'JRN': 'Journalism',
 'KOR': 'Korean',
 'LAO': 'Latino Studies',
 'LAS': 'Latin American Studies',
 'LAT': 'Latin',
 'LCA': 'Lewis Center for the Arts',
 'LIN': 'Linguistics',
 'MAE': 'Mech and Aerospace Engr',
 'MAT': 'Mathematics',
 'MED': 'Medieval Studies',
 'MOD': 'Media and Modernity',
 'MOG': 'Modern Greek',
 'MOL': 'Molecular Biology',
 'MSE': 'Materials Science and Engr',
 'MTD': 'Music Theater',
 'MUS': 'Music',
 'NES': 'Near Eastern Studies',
 'NEU': 'Neuroscience',
 'ORF': 'Oper Res and Financial Engr',
 'PAW': 'Ancient World',
 'PER': 'Persian',
 'PHI': 'Philosophy',
 'PHY': 'Physics',
 'PLS': 'Polish',
 'POL': 'Politics',
 'POP': 'Population Studies',
 'POR': 'Portuguese',
 'PSY': 'Psychology',
 'QCB': 'Quantitative Computational Bio',
 'REL': 'Religion',
 'RES': 'Russian, East Europ, Eurasian',
 'RUS': 'Russian',
 'SAN': 'Sanskrit',
 'SAS': 'South Asian Studies',
 'SLA': 'Slavic Languages and Lit',
 'SML': 'Statistics & Machine Learning',
 'SOC': 'Sociology',
 'SPA': 'Spanish',
 'STC': 'Science and Technology Council',
 'SWA': 'Swahili',
 'THR': 'Theater',
 'TPP': 'Teacher Preparation',
 'TRA': 'Translation, Intercultural Com',
 'TUR': 'Turkish',
 'TWI': 'Twi',
 'URB': 'Urban Studies',
 'URD': 'Urdu',
 'VIS': 'Visual Arts',
 'WRI': 'Princeton Writing Program',
 'WWS': 'Woodrow Wilson School'
}

// updates buttons in the suggest pane based on search query
function updateSuggest() {
  $('.suggest-button').each(function() {
    $(this).removeClass('active')
    $(this).find('i.suggest-icon').removeClass('fa-minus')
    $(this).find('i.suggest-icon').addClass('fa-plus')
    $(this).attr('data-original-title', 'Add to search')
  })

  var queries = $('#searchbox').val().split(' ')

  for (var index in queries) {
    var query = queries[index]
    $('.suggest-button').each(function() {
      var term = this.term
      if (query.toLowerCase() !== term.toLowerCase()) return

      $(this).addClass('active')
      $(this).find('i.suggest-icon').removeClass('fa-plus')
      $(this).find('i.suggest-icon').addClass('fa-minus')
      $(this).attr('data-original-title', 'Remove from search')
    })
  }
}

// handles click in navbar to toggle suggest pane
function toggleSuggest() {
  // swipe if in mobile
  if (document.isMobile) {
    $('#main-pane').slick('slickGoTo', 0)
    $('.navbar-collapse').collapse('hide')
    $('#suggest-toggle').tooltip('hide')
    $('#suggest-toggle').blur()
    return false
  }

  var isVisible = $('#suggest-pane').is(':visible')

  if (isVisible) $('#suggest-pane').animate({width: 'hide'})
  else $('#suggest-pane').animate({width: 'show'})
  $('#suggest-resizer').removeClass(isVisible ? 'resizer' : 'resizer-inactive')
  $('#suggest-resizer').addClass(isVisible ? 'resizer-inactive' : 'resizer')
  if (isVisible) $('#suggest-toggle').removeClass('active')
  else $('#suggest-toggle').addClass('active')
  $('#suggest-toggle').attr('data-original-title', isVisible ? 'Show search suggestions' : 'Hide search suggestions')
  $('#suggest-toggle').tooltip('hide')
  $('#suggest-toggle').blur()

  return false
}

// loads contents of suggest pane
function suggest_load() {
  for (var term in allcourses) {
    var description = allcourses[term]
    $('#suggest-allcourses-body').append(newDOMsuggestResult(term, description))
  }

  for (var term in distributions) {
    var description = distributions[term]
    $('#suggest-distributions-body').append(newDOMsuggestResult(term, description, {button: 1}))
  }

  for (var term in pdfoptions) {
    var description = pdfoptions[term]
    $('#suggest-pdfoptions-body').append(newDOMsuggestResult(term, description, {button: 1}))
  }

  for (var term in departments) {
    var description = departments[term]
    $('#suggest-departments-body').append(newDOMsuggestResult(term, description, {button: 1}))
  }
}

// returns a DOM object for a search suggestion
// props: properties for conditional rendering:
//  - 'button' is defined => displays button to add/remove from search
function newDOMsuggestResult(term, description, props) {
  var hasButton = (props != undefined) && props.hasOwnProperty('button')
  if (hasButton) var button = (
    '<div '
    + 'class="flex-item-rigid suggest-button" '
    + 'data-toggle="tooltip" '
    + 'data-original-title="Add to search"'
  + '>'
      + '<i class="fa fa-plus suggest-icon"></div>'
  + '</div>'
  )

  var tooltip = ' title="' + description + '"'

  var htmlString = (
    '<li class="list-group-item suggest-result flex-container-row">'
    + '<div '
      + 'data-toggle="tooltip"'
      + 'data-original-title="' + description + '" '
      + 'class="flex-item-stretch truncate suggest-text"'
    + '>'
        + '<strong>' + term + '</strong>&nbsp; '
        + description
    + '</div>'
    + (hasButton ? button : '')
  + '</li>'
  )

  var entry = $.parseHTML(htmlString)[0]         // create DOM object
  if (hasButton) {
    var button = $(entry).find('.suggest-button')[0] // button
    button.term = term                               // bind term

    $(button).click(toggleTerm)
  }

  // enable click to search
  $(entry).click(function() {
    $('#searchbox').val(term.toLowerCase())
    searchFromBox()
    return false
  })

  return entry
}

// handles click of suggest button
function toggleTerm() {
  var $button = $(this)
  var isSearched = $button.hasClass('active')
  var term = this.term

  if (isSearched) { /* remove from searchbox */
    var queries = $('#searchbox').val().split(' ')
    var newqueries = []
    for (index in queries) {
      var query = queries[index]
      if (query.toLowerCase() !== term.toLowerCase()) {
        newqueries.push(query)
      }
    }
    $('#searchbox').val(newqueries.join(' '))
  } else { /* insert into searchbox */
    $('#searchbox').val($('#searchbox').val() + ' ' + term.toLowerCase())
  }
  searchFromBox(true)
  return false
}
