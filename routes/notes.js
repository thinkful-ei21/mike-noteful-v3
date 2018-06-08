'use strict';

const express = require('express');

const router = express.Router();

const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config');

const Note = require('../models/note');


/* ========== GET/READ ALL ITEM ========== */
router.get('/', (req, res, next) => {
  
  const { searchTerm, folderId }= req.query;
  let filter = {};

  if (searchTerm) {
    filter.title = { $regex: searchTerm };
  }
  if(folderId) {
    filter.id = { folderId };
  }

  Note
    .find(filter)
    .sort({  id: 1 })
    .then(results => {
      res.json(results);
    })
    .catch(
      err => {
        next(err);
      });
});


/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {
  const noteId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(noteId)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Note.findById(noteId)
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
});


/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {
  const noteId = req.params.id;
  const { title, content, folderId } = req.body;

  // validate input 
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  if (!mongoose.Types.ObjectId.isValid(folderId)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  const newNote = {title, content, folderId};

  const originalUrl = `http://${req.headers.host}/notes/${newNote.id}`;

  Note.create(newNote)
    .then(results => {
      res.location(`${req.originalUrl}/${results.id}`).status(201).json(results);
    })
    .catch(err => {
      next(err);
    });
});


/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
  const { id } = req.params;
  const { title, content, folderId } = req.body;

  // validate input
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `note id` is not valid');
    err.status = 400;
    return next(err);
  }

  if (!mongoose.Types.ObjectId.isValid(folderId)) {
    const err = new Error('The `folder id` is not valid');
    err.status = 400;
    return next(err);
  }

  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  const updatedNote = { title, content, folderId };

  Note.findByIdAndUpdate(id, updatedNote, { upsert: true, new: true})
    .then(results => {
      if(results) {
        res.status(200).json(results);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
  const { id } = req.params;

  // validate input 
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Note.findByIdAndDelete(id)
    .then(results => {
      res.status(204).end();
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;