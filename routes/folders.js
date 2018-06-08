'use strict';

const express = require('express');

const router = express.Router();

const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config');

const Folder = require('../models/folder');
const Note = require('../models/note');

router.get('/', (req,res,next) => {
  Folder.find()
    .sort({ id:1} )
    .then(results => {
      if(results) {
        res.json(results);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});


router.get('/:id', (req,res,next) => {
  const folderId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(folderId)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Folder.findById(folderId)
    .then(results => {
      if (results) {
        res.status(200).json(results);
      } else {
        next();
      }
    })
    .catch(err => next(err));
});

router.post('/', (req,res,next) => {
  const folderId = req.params.id;
  const { name } = req.body;

  if(!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  const newFolder = { name };

  const originalUrl = `http://${req.headers.host}/folders/${newFolder.id}`;

  Folder.create(newFolder)
    .then(results => {
      res.location(`${req.originalUrl}/${results.id}`).status(201).json(results);
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The folder name already exists');
        err.status = 400;
      }
      next(err);
    });
});

router.put('/:id', (req,res,next) => {
  const { id } = req.params;
  const { name } = req.body;

  // validate input
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  const updatedFolder = { name };

  Folder.findByIdAndUpdate(id, updatedFolder, { new:true })
    .then(results => {
      if(results) {
        res.json(results);
      } else {
        next();
      }
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The folder name already exists');
        err.status = 400;
      }
      next(err);
    });
});

router.delete('/:id', (req,res,next) => {
  const { id } = req.params;

  // validate id exists 
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Folder.findByIdAndDelete(id)
    .then(results => {
      res.status(204).end();
    })
    .catch( err => next(err));
});


module.exports = router;