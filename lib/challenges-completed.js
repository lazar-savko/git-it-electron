//
// Renderer Process—This file is required by the index page.
// It touches the DOM by showing progress in challenge completion.
// It also handles the clear buttons and writing to user-data.
//

var fs = require('fs')
var path = require('path')
var ipc = require('electron').ipcRenderer

var userData = require(path.normalize(path.join(__dirname, '../../../lib/user-data.js')))

document.addEventListener('DOMContentLoaded', function (event) {
  var data = userData.getData()

  // Buttons
  var clearAllButtons = document.querySelectorAll('.js-clear-all-challenges')
  var leftOffButton = document.getElementById('left-off-from')
  // Sections
  var showFirstRun = document.getElementById('show-first-run')
  var showWipRun = document.getElementById('show-wip-run')
  var showFinishedRun = document.getElementById('show-finished-run')

  updateIndex(data.contents)

  // Listen for Clear All Button Events, trigger confirmation dialog
  for (var i = 0; i < clearAllButtons.length; i++) {
    clearAllButtons[i].addEventListener('click', function () {
      ipc.send('confirm-clear')
    }, false)
  }

  ipc.on('confirm-clear-response', function (event, response) {
    if (response === 1) return
    else clearAllChallenges(data)
  })

  // Go through each challenge in user data to see which are completed
  function updateIndex (data) {
    var circles = document.querySelectorAll('.progress-circle')
    var completed = 0
    var nextChallenge = null

    // Define challenge order to match the HTML structure
    var challengeOrder = [
      'get_git', 'repository', 'commit_to_it', 'githubbin', 'remote_control', 'forks_and_clones',  // Basics (6)
      'branches_arent_just_for_birds', 'its_a_small_world', 'pull_never_out_of_date', 'requesting_you_pull_please', 'merge_tada'  // Advanced (5)
    ]

    // Update circles based on completion status and find next challenge
    challengeOrder.forEach(function(challenge, index) {
      if (circles[index]) {
        if (data[challenge] && data[challenge].completed) {
          circles[index].classList.add('completed')
          completed++
        } else {
          circles[index].classList.remove('completed')
        }
      }
    })

    // Find the first uncompleted challenge in sequence
    for (var i = 0; i < challengeOrder.length; i++) {
      var challenge = challengeOrder[i]
      if (data[challenge] && !data[challenge].completed) {
        nextChallenge = challenge
        break
      }
    }

    // Set the "pick up where you left off" button href
    if (leftOffButton && nextChallenge) {
      leftOffButton.href = path.join(__dirname, '..', 'challenges', nextChallenge + '.html')
    }

    // Update progress counters
    updateProgressCounters(data)

    if (completed === 0) {
      // No challenges are complete, show the first run HTML
      showFirstRun.style.display = 'block'
      showWipRun.style.display = 'none'
      showFinishedRun.style.display = 'none'
    }

    if (completed === Object.keys(data).length) {
      // All of the challenges are complete! Show the finished run HTML
      showFirstRun.style.display = 'none'
      showWipRun.style.display = 'none'
      showFinishedRun.style.display = 'block'
    }
  }

  function updateProgressCounters(data) {
    // Update Basics section counter
    var basicsChallenges = ['get_git', 'repository', 'commit_to_it', 'githubbin', 'remote_control', 'forks_and_clones']
    var basicsCompleted = 0
    basicsChallenges.forEach(function(challenge) {
      if (data[challenge] && data[challenge].completed) {
        basicsCompleted++
      }
    })
    
    var basicsLabel = document.querySelector('.basics-card .section-label')
    if (basicsLabel) {
      basicsLabel.textContent = basicsCompleted + '/' + basicsChallenges.length
    }

    // Update Advanced section counter
    var advancedChallenges = ['branches_arent_just_for_birds', 'its_a_small_world', 'pull_never_out_of_date', 'requesting_you_pull_please', 'merge_tada']
    var advancedCompleted = 0
    advancedChallenges.forEach(function(challenge) {
      if (data[challenge] && data[challenge].completed) {
        advancedCompleted++
      }
    })
    
    var advancedLabel = document.querySelector('.advanced-card .section-label')
    if (advancedLabel) {
      advancedLabel.textContent = advancedCompleted + '/' + advancedChallenges.length
    }
  }

  function clearAllChallenges (data) {
    for (var chal in data.contents) {
      if (data.contents[chal].completed) {
        data.contents[chal].completed = false
      }
    }
    fs.writeFileSync(data.path, JSON.stringify(data.contents, null, 2))
    // If they clear all challenges, go back to first run HTML
    var circles = document.querySelectorAll('.progress-circle')
    Array.prototype.forEach.call(circles, function (el) {
      el.classList.remove('completed')
    })

    // Update progress counters after clearing
    updateProgressCounters(data.contents)

    showFirstRun.style.display = 'block'
    showWipRun.style.display = 'none'
    showFinishedRun.style.display = 'none'
  }
})
