'use strict';

const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config');

const Note = require('../models/note');

mongoose.connect(MONGODB_URI)
  .then(() => {
    const searchTerm = 'lady gaga';
    let filter = {};

    if (searchTerm) {
      filter.title = { $regex: searchTerm };
    }

    return Note.find(filter).sort({ updatedAt: 'desc' });
  })    
  .then(results => {
    console.log(results);
  })
  .then(() => {
    return mongoose.disconnect();
  })
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
  });

mongoose.connect(MONGODB_URI)
  .then(() => {
    const noteId = '000000000000000000000002';
    return Note.findById(noteId);
  })
  .then(results => {
    console.log(results);
  })
  .then(() => {
    return mongoose.disconnect();
  })
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
  });

mongoose.connect(MONGODB_URI)
  .then(() => {
    const newNote = new Note(
      { title: 'A note abut dogs', 
        content:'This is a note about dogs.'
      });
    return Note.create(newNote);
  })
  .then(results => {
    console.log(results);
  })
  .then(() => {
    return mongoose.disconnect();
  })
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
  });

mongoose.connect(MONGODB_URI)
  .then(() => {
    const noteIdToBeUpdated = '5b16f0fd6ab54f2ba83d0829';
    const updatedNote = {
      title: 'A long title for a useless note'
    };
    return Note.findByIdAndUpdate(noteIdToBeUpdated, updatedNote, 
      { upsert: true, new: true});
  })
  .then(results => {
    console.log(results);
  })
  .then(() => {
    return mongoose.disconnect();
  })
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
  });

mongoose.connect(MONGODB_URI)
  .then(() => {
    const noteIdToBeDeleted = '000000000000000000000001';
    
    return Note.findByIdAndDelete(noteIdToBeDeleted);
  })
  .then(results => {
    console.log(`Note ${results.title} Deleted Sucessfully`);
  })
  .then(() => {
    return mongoose.disconnect();
  })
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
  });


