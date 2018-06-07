'use strict';

// require chai, chai-http and mongoose packages
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

// require app 
const app = require('../server');

//destructure the TEST_MONGODB_URI into a constant
// and require config
const { TEST_MONGODB_URI } = require('../config');

// require folder Mongoose model for Folders
const Folder = require('../models/folder');

// require seed folders from seed data 
const seedFolders = require('../db/seed/folders');

//configure expect as your assertion library and load chai-http with chai.use()
const expect = chai.expect;
chai.use(chaiHttp);

// connect to the database before all tests
before(function () {
  return mongoose.connect(TEST_MONGODB_URI)
    .then(() => mongoose.connection.db.dropDatabase());
});

//seed data runs before each test
beforeEach(function() {
  return Folder.insertMany(seedFolders);
});

// drop database runs after each test
afterEach(function () {
  return mongoose.connection.db.dropDatabase();
});

// disconnect after all test
after(function() {
  return mongoose.disconnect();
});

describe('Get all folders', function() {
  it('should return all existing folders', function() {
    let res;
    return chai.request(app)
      .get('/api/folders')
      .then((_res) => {
        res = _res;
        expect(res).to.have.status(200);
        expect(res.body).to.have.lengthOf.at.least(1);
        return Folder.count();
      })
      .then(count => expect(res.body).to.have.lengthOf(count));
  });
});

describe('GET /api/folders/:id', function () {
  it('should return correct folder by id', function () {
    let testFolder;
    // call the database to get random folder
    return Folder.findOne()
      .then(aFolder => {
        testFolder = aFolder;
        // call the API with the ID
        return chai.request(app)
          .get(`/api/folders/${testFolder.id}`);
      })
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.keys('id', 'name', 'createdAt', 'updatedAt');

        //compare database results to API response
        expect(res.body.id).to.equal(testFolder.id);
        expect(res.body.name).to.equal(testFolder.name);
      });
  });
});

describe('POST /api/folders', function () {
  it('should create and return a new item when provided valid data', function () {
    const newFolder = {
      'name': 'test folder name'
    };

    let res;
    // 1) First, call the API
    return chai.request(app)
      .post('/api/folders')
      .send(newFolder)
      .then(function (_res) {
        res = _res;
        expect(res).to.have.status(201);
        expect(res).to.have.header('location');
        expect(res).to.be.json;
        expect(res.body).to.be.a('object');
        expect(res.body).to.have.keys('id', 'name', 'createdAt', 'updatedAt');
        // 2) then call the database
        return Folder.findById(res.body.id);
      })
      // 3) then compare the API response to the database results
      .then(data => {
        expect(res.body.name).to.equal(data.name);
      });
  });
});

describe('PUT /api/folders:id', function() {
  it('should update the folder', function() {
    const updatedFolder = {
      'name': 'An updated Folder'
    };
    let folder;
    return Folder.findOne()
      .then(_folder => {
        folder = _folder;
        updatedFolder.id = _folder.id;
        return chai.request(app)
          .put(`/api/folders/${updatedFolder.id}`)
          .send(updatedFolder);
      })
      .then(function(res) {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.a('object');
        expect(res.body).to.have.all.keys('id', 'name', 'createdAt', 'updatedAt');
        return Folder.findById(res.body.id);
      })
      .then(function(folder) {
        expect(folder.id).to.equal(updatedFolder.id);
        expect(folder.name).to.equal(updatedFolder.name);
        expect(folder.content).to.equal(updatedFolder.content);
      });
  });
});


describe('DELETE /api/folders', function() {

  it('delete a folder by id', function() {

    let folderToDelete;

    return Folder
      .findOne()
      .then(function(_folderToDelete) {
        folderToDelete = _folderToDelete;
        return chai.request(app).delete(`/api/folders/${folderToDelete.id}`);
      })
      .then(function(res) {
        expect(res).to.have.status(204);
        return Folder.findById(folderToDelete.id);
      })
      .then(function(_folderToDelete) {
        expect(_folderToDelete).to.be.null;
      });
  });
});
