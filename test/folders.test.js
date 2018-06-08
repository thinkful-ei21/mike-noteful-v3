'use strict';

// require chai, chai-http and mongoose packages
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

// require app 
const app = require('../server');

//destructure the TEST_MONGODB_URI into a constant
// and require config
const {
  TEST_MONGODB_URI
} = require('../config');

// require folder Mongoose model for Folders
const Folder = require('../models/folder');

// require seed folders from seed data 
const seedFolders = require('../db/seed/folders');

//configure expect as your assertion library and load chai-http with chai.use()
const expect = chai.expect;
chai.use(chaiHttp);

describe('Folders.test', function () {
  // connect to the database before all tests
  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  //seed data runs before each test
  beforeEach(function () {
    return Promise.all([
      Folder.insertMany(seedFolders),
      Folder.createIndexes()
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

  describe('Get /api/folders', function () {
    it('should return all existing folders', function () {
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

    it('should return a list with the correct fields and values', function () {
      return Promise.all([
        Folder.find().sort('name'),
        chai.request(app).get('/api/folders')
      ])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
          res.body.forEach(function (item, i) {
            expect(item).to.be.a('object');
            expect(item).to.have.all.keys('id', 'name', 'createdAt', 'updatedAt');
            expect(item.id).to.equal(data[i].id);
            expect(item.name).to.equal(data[i].name);
            expect(new Date(item.createdAt)).to.eql(data[i].createdAt);
            expect(new Date(item.updatedAt)).to.eql(data[i].updatedAt);
          });
        });
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
          expect(new Date(res.body.createdAt)).to.eql(testFolder.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(testFolder.updatedAt);
        });
    });

    it('should respond with a 400 for an invalid id', function () {
      return chai.request(app)
        .get('/api/folders/NOT-A-VALID-ID')
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.eq('The `id` is not valid');
        });
    });

    it('should respond with a 404 for an ID that does not exist', function () {
      // The string "DOESNOTEXIST" is 12 bytes which is a valid Mongo ObjectId
      return chai.request(app)
        .get('/api/folders/DOESNOTEXIST')
        .then(res => {
          expect(res).to.have.status(404);
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
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });

    it('should return an error when missing "name" field', function () {
      const newItem = {
        'foo': 'bar'
      };
      return chai.request(app)
        .post('/api/folders')
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `name` in request body');
        });
    });

    it('should return an error when given a duplicate name', function () {
      return Folder.findOne()
        .then(data => {
          const newItem = { 'name': data.name };
          return chai.request(app).post('/api/folders').send(newItem);
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('The folder name already exists');
        });
    });

  });
  describe('PUT /api/folders:id', function () {
    it('should update the folder', function () {
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
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.all.keys('id', 'name', 'createdAt', 'updatedAt');
          expect(res.body.id).to.equal(folder.id);
          expect(res.body.name).to.equal(updatedFolder.name);
          expect(new Date(res.body.createdAt)).to.eql(folder.createdAt);
          // expect item to have been updated
          expect(new Date(res.body.updatedAt)).to.greaterThan(folder.updatedAt);

        });
    });

    it('should respond with a 400 for an invalid id', function () {
      const updateItem = {
        'name': 'Blah'
      };
      return chai.request(app)
        .put('/api/folders/NOT-A-VALID-ID')
        .send(updateItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.eq('The `id` is not valid');
        });
    });

    it('should respond with a 404 for an id that does not exist', function () {
      const updateItem = {
        'name': 'Blah'
      };
      // The string "DOESNOTEXIST" is 12 bytes which is a valid Mongo ObjectId
      return chai.request(app)
        .put('/api/folders/DOESNOTEXIST')
        .send(updateItem)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });

    it('should return an error when missing "name" field', function () {
      const updateItem = {};
      let data;
      return Folder.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app).put(`/api/folders/${data.id}`).send(updateItem);
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `name` in request body');
        });
    });

    it('should return an error when given a duplicate name', function () {
      return Folder.find().limit(2)
        .then(results => {
          const [item1, item2] = results;
          item1.name = item2.name;
          return chai.request(app)
            .put(`/api/folders/${item1.id}`)
            .send(item1);
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('The folder name already exists');
        });
    });

  });


  describe('DELETE /api/folders', function () {

    it('should delete a folder by id and respond with 204', function () {

      let folderToDelete;

      return Folder
        .findOne()
        .then(function (_folderToDelete) {
          folderToDelete = _folderToDelete;
          return chai.request(app).delete(`/api/folders/${folderToDelete.id}`);
        })
        .then(function (res) {
          expect(res).to.have.status(204);
          return Folder.findById(folderToDelete.id);
        })
        .then(function (_folderToDelete) {
          expect(_folderToDelete).to.be.null;
        });
    });
  });

});