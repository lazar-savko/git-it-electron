#!/usr/bin/env node

var fs = require('fs')
var path = require('path')
var exec = require(path.join(__dirname, '../../lib/spawn-git.js'))
var helper = require(path.join(__dirname, '../../lib/helpers.js'))
var userData = require(path.join(__dirname, '../../lib/user-data.js'))

var addToList = helper.addToList
var markChallengeCompleted = helper.markChallengeCompleted

var currentChallenge = 'remote_control'

// check that they've made a push

module.exports = function verifyRemoteControlChallenge (path) {
  if (!fs.lstatSync(path).isDirectory()) {
    addToList('Path is not a directory.', false)
    return helper.challengeIncomplete()
  }
  
  // First try to determine the default branch name
  exec('git symbolic-ref refs/remotes/origin/HEAD', {cwd: path}, function (err, stdout, stderr) {
    var defaultBranch = 'main' // fallback to modern default
    if (!err && stdout) {
      // Extract branch name from output like "refs/remotes/origin/main"
      var match = stdout.trim().match(/refs\/remotes\/origin\/(.+)/)
      if (match) {
        defaultBranch = match[1]
      }
    }
    
    // Check reflog for push to the default branch
    exec('reflog show origin/' + defaultBranch, {cwd: path}, function (err, stdout, stderr) {
      if (err) {
        // If main branch doesn't exist, try master as fallback
        exec('reflog show origin/master', {cwd: path}, function (err, stdout, stderr) {
          if (err) {
            addToList('Error: ' + err.message, false)
            return helper.challengeIncomplete()
          }
          var ref = stdout.trim()
          
          if (ref.match('update by push')) {
            addToList('You pushed changes!', true)
            markChallengeCompleted(currentChallenge)
            userData.updateData(currentChallenge)
          } else {
            addToList('No evidence of push.', false)
            helper.challengeIncomplete()
          }
        })
      } else {
        var ref = stdout.trim()
        
        if (ref.match('update by push')) {
          addToList('You pushed changes!', true)
          markChallengeCompleted(currentChallenge)
          userData.updateData(currentChallenge)
        } else {
          addToList('No evidence of push.', false)
          helper.challengeIncomplete()
        }
      }
    })
  })
}
