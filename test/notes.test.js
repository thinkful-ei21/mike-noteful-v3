'use strict';

// require chai, chai-http and mongoose packages
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

// require app 
const app = require('../server');

//destructure the TEST_MONGODB_URI into a constant and require config
const { TEST_MONGODB_URI } = require('../config');

// require note Mongoose model for Note
const Note = require('../models/note');

// require note Mongoose model for Folder
const Folder = require('../models/folder');

// require note Mongoose model for Folder
const Tag = require('../models/tags');

// require seed notes from seed data 
const seedNotes = require('../db/seed/notes');

// require seed folders from seed data 
const seedFolders = require('../db/seed/folders');

// require seed folders from seed data 
const seedTags = require('../db/seed/tags');

//configure expect as your assertion library and load chai-http with chai.use()
const expect = chai.expect;
chai.use(chaiHttp);

describe('Notes.tests', function () {
  // connect to the database before all tests
  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  //seed data runs before each test
  beforeEach(function () {
   // return Note.insertMany(seedNotes);

    return Promise.all([
      Note.insertMany(seedNotes),
      Folder.insertMany(seedFolders),
      Tag.insertMany(seedTags),
      Folder.createIndexes(),
      Tag.createIndexes()
    ]);
  });

  // drop database runs after each test
  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  // disconnect after all test
  after(function () {
    return mongoose.disconnect();
  });

  describe('Get all notes', function () {
    it('should return all existing notes', function () {
      let res;
      return chai.request(app)
        .get('/api/notes')
        .then((_res) => {
          res = _res;
          expect(res).to.have.status(200);
          expect(res.body).to.have.lengthOf.at.least(1);
          return Note.count();
        })
        .then(count => expect(res.body).to.have.lengthOf(count));
    });
  });

  describe('GET /api/notes/:id', function () {
    it('should return correct note by id', function () {
      let testNote;
      // call the database to get random note
      return Note.findOne()
        .then(aNote => {
          testNote = aNote;
          // call the API with the ID
          return chai.request(app)
            .get(`/api/notes/${testNote.id}`);
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'title', 'content', 'folderId', 'tags', 'createdAt', 'updatedAt');

          //compare database results to API response
          expect(res.body.id).to.equal(testNote.id);
          expect(res.body.title).to.equal(testNote.title);
          expect(res.body.content).to.equal(testNote.content);
        });
    });
  });

  describe('POST /api/notes', function () {
    it('should create and return a new item when provided valid data', function () {
      const newItem = {
        'title': 'The best article about cats ever!',
        'content': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...',
        'folderId': '111111111111111111111101'
      };

      let res;
      // 1) First, call the API
      return chai.request(app)
        .post('/api/notes')
        .send(newItem)
        .then(function (_res) {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys('id', 'title', 'content', 'folderId', 'tags', 'createdAt', 'updatedAt');
          // 2) then call the database
          return Note.findById(res.body.id);
        })
        // 3) then compare the API response to the database results
        .then(data => {
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
        });
    });
  });

  describe('PUT /api/notes:id', function () {
    it('should update the note', function () {
      const updatedNote = {
        'title': 'An updated Note',
        'content': 'This is an updated note',
        'folderId': '111111111111111111111101'
      };
      let note;
      return Note.findOne()
        .then(_note => {
          note = _note;
          updatedNote.id = _note.id;
          return chai.request(app)
            .put(`/api/notes/${updatedNote.id}`)
            .send(updatedNote);
        })
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.all.keys('id', 'title', 'content', 'folderId', 'tags', 'createdAt', 'updatedAt');
          return Note.findById(res.body.id);
        })
        .then(function (note) {
          expect(note.id).to.equal(updatedNote.id);
          expect(note.title).to.equal(updatedNote.title);
          expect(note.content).to.equal(updatedNote.content);
        });
    });
  });


  describe('DELETE /api/notes', function () {

    it('delete a note by id', function () {

      let noteToDelete;

      return Note
        .findOne()
        .then(function (_noteToDelete) {
          noteToDelete = _noteToDelete;
          return chai.request(app).delete(`/api/notes/${noteToDelete.id}`);
        })
        .then(function (res) {
          expect(res).to.have.status(204);
          return Note.findById(noteToDelete.id);
        })
        .then(function (_noteToDelete) {
          expect(_noteToDelete).to.be.null;
        });
    });
  });

});