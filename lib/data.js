/*
 * Library for storing and editing data
 */

// Dependencies
const fs = require('fs')
const path = require('path')
const helpers = require('./helpers')

// Container for module (to be exported)
const lib = {}

// Base Data Json directory and file name utilities
const _getBaseDir = dir => `${path.join(__dirname, '/../.data/')}${dir}/`
const _getJsonFile = (dir, file) => `${_getBaseDir(dir)}${file}.json`

// Write data to a file
lib.create = (dir, file, data, callback) => {
  // Open the file for writing
  fs.open(_getJsonFile(dir, file), 'wx', (err, fileDescriptor) => {
    if(!err && fileDescriptor) {
      // Convert data to string
      const stringData = JSON.stringify(data)

      // Write to file and close it
      fs.writeFile(fileDescriptor, stringData, err => {
        if(!err) {
          fs.close(fileDescriptor, err => callback(err ? 'Error closing new file' : false))
        } else {
          callback('Error writing to new file')
        }
      })
    } else {
      callback('Could not create new file, it may already exist')
    }
  })
}

// Read data from a file
lib.read = (dir, file, callback) => {
  fs.readFile(_getJsonFile(dir, file), 'utf8', (err, data) => {
    if(!err && data) {
      const parsedData = helpers.parseJsonToObject(data)
      callback(false, parsedData)
    } else {
      callback(err, data)
    }
  })
}

// Update data in a file
lib.update = (dir, file, data, callback) => {
  // Open the file for writing
  const filePath = _getJsonFile(dir, file)

  fs.open(filePath, 'r+', (err, fileDescriptor) => {
    if(!err && fileDescriptor) {
      // Convert data to string
      const stringData = JSON.stringify(data)

      // Truncate the file
      fs.truncate(filePath, err => {
        if(!err) {
          // Write to file and close it
          fs.writeFile(fileDescriptor, stringData, err => {
            if(!err) {
              fs.close(fileDescriptor, err => callback(err ? 'Error closing existing file' : false))
            } else {
              callback('Error writing to existing file')
            }
          })
        } else {
          callback('Error truncating file')
        }
      })
    } else {
      callback('Could not open file for updating, it may not exist yet')
    }
  })
}

// Delete a file
// Unlink the file from the filesystem
lib.delete = (dir, file, callback) => fs.unlink(_getJsonFile(dir, file), err => callback(err))

// List all the items in a directory
lib.list = (dir, callback) => {
  fs.readdir(_getBaseDir(dir), (err, data) => {
    if(!err && data && data.length > 0) {
      const trimmedFileNames = []
      data.forEach(fileName => trimmedFileNames.push(fileName.replace('.json','')))
      callback(false, trimmedFileNames)
    } else {
      callback(err, data)
    }
  })
}

// Export the module
module.exports = lib
