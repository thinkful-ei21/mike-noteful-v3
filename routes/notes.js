'use strict';

const express = require('express');

const router = express.Router();

const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config');

const Note = require('../models/note');


/* ========== GET/READ ALL ITEM ========== */
router.get('/', (req, res, next) => {
  
  const { searchTerm }= req.query;
  let filter = {};

  if (searchTerm) {
    filter.title = { $regex: searchTerm };
  }

  Note
    .find(filter)
    .sort({  id: 1 })
    .then(results => {
      res.json(results);
    })
    .catch(
      err => {
        console.error(err);
        res.status(500).json({message: 'Internal server error'});
      });
});


/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {
  const noteId = req.params.id;

  Note.findById(noteId)
    .then(results => {
      res.json(results);
    })
    .then(() => {
      return mongoose.disconnect();
    })
    .catch(err => {
      res.error(`ERROR: ${err.message}`);
      res.status(404).json({message: 'Note not found'});
    });
});


/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {
  const noteId = req.params.id;
  const { title, content } = req.body;
  const newNote = {title, content};

  Note.create(newNote)
    .then(results => {
      res.json(results);
      res.location('path/to/new/document').status(201).json(results);
    })
    .catch(err => {
      res.error(`ERROR: ${err.message}`);
      res.status(500).json({message: 'Internal server error'});
    });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const updatedNote = {title, content};

  Note.findByIdAndUpdate(id, updatedNote, { upsert: true, new: true})
    .then(results => {
      if(results) {
        res.json(results);
      } else {
        next();
      }
    })
    .catch(err => {
      res.error(`ERROR: ${err.message}`);
      res.status(500).json({message: 'Internal server error'});
    });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
  const { id } = req.params;
  Note.findByIdAndDelete(id)
    .then(results => {
      res.json({message: `Note ${results.title} Deleted Sucessfully`});
      res.status(200).end();
    })
    .catch(err => {
      res.status(500).json({message: 'Internal server error'});
    });
});


module.exports = router;