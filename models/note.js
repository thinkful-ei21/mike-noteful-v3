/**
 * Define the Note Schema and create a Note Model
 */
'use strict';

const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: String
});

noteSchema.set('timestamps', true);

module.exports = mongoose.model('Note', noteSchema);