'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');

const { TEST_MONGODB_URI } = require('../config');

const Tag = require('../models/tags');

const seedTags = require('../db/seed/tags.json');

//configure expect as your assertion library and load chai-http with chai.use()
const expect = chai.expect;
chai.use(chaiHttp);

describe('Tags.test', function() {
  before(function() {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });


  //seed data runs before each test
  beforeEach(function () {
    return Promise.all([
      Tag.insertMany(seedTags),
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

  describe('Get /api/tags', function () {
    it('should return all existing tags', function () {
      let res;
      return chai.request(app)
        .get('/api/tags')
        .then((_res) => {
          res = _res;
          expect(res).to.have.status(200);
          expect(res.body).to.have.lengthOf.at.least(1);
          return Tag.count();
        })
        .then(count => expect(res.body).to.have.lengthOf(count));
    });

    it('should return a list with the correct fields and values', function () {
      return Promise.all([
        Tag.find().sort('name'),
        chai.request(app).get('/api/tags')
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

  describe('GET /api/tags/:id', function () {
    it('should return correct tag by id', function () {
      let testTag;
      // call the database to get random tag
      return Tag.findOne()
        .then(aTag => {
          testTag = aTag;
          // call the API with the ID
          return chai.request(app)
            .get(`/api/tags/${testTag.id}`);
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'name', 'createdAt', 'updatedAt');

          //compare database results to API response
          expect(res.body.id).to.equal(testTag.id);
          expect(res.body.name).to.equal(testTag.name);
          expect(new Date(res.body.createdAt)).to.eql(testTag.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(testTag.updatedAt);
        });
    });

    it('should respond with a 400 for an invalid id', function () {
      return chai.request(app)
        .get('/api/tags/NOT-A-VALID-ID')
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.eq('The `id` is not valid');
        });
    });

    it('should respond with a 404 for an ID that does not exist', function () {
      // The string "DOESNOTEXIST" is 12 bytes which is a valid Mongo ObjectId
      return chai.request(app)
        .get('/api/tags/DOESNOTEXIST')
        .then(res => {
          expect(res).to.have.status(404);
        });
    });

  });

  describe('POST /api/tags', function () {
    it('should create and return a new item when provided valid data', function () {
      const newTag = {
        'name': 'test tag name'
      };

      let res;
      // 1) First, call the API
      return chai.request(app)
        .post('/api/tags')
        .send(newTag)
        .then(function (_res) {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys('id', 'name', 'createdAt', 'updatedAt');
          // 2) then call the database
          return Tag.findById(res.body.id);
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
        .post('/api/tags')
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `name` in request body');
        });
    });

    it('should return an error when given a duplicate name', function () {
      return Tag.findOne()
        .then(data => {
          const newItem = { 'name': data.name };
          return chai.request(app).post('/api/tags').send(newItem);
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('The tag name already exists');
        });
    });

  });
  describe('PUT /api/tags:id', function () {
    it('should update the tag', function () {
      const updatedTag = {
        'name': 'An updated Tag'
      };
      let tag;
      return Tag.findOne()
        .then(_tag => {
          tag = _tag;
          updatedTag.id = _tag.id;
          return chai.request(app)
            .put(`/api/tags/${updatedTag.id}`)
            .send(updatedTag);
        })
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.all.keys('id', 'name', 'createdAt', 'updatedAt');
          expect(res.body.id).to.equal(tag.id);
          expect(res.body.name).to.equal(updatedTag.name);
          expect(new Date(res.body.createdAt)).to.eql(tag.createdAt);
          // expect item to have been updated
          expect(new Date(res.body.updatedAt)).to.greaterThan(tag.updatedAt);

        });
    });

    it('should respond with a 400 for an invalid id', function () {
      const updateItem = {
        'name': 'Blah'
      };
      return chai.request(app)
        .put('/api/tags/NOT-A-VALID-ID')
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
        .put('/api/tags/DOESNOTEXIST')
        .send(updateItem)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });

    it('should return an error when missing "name" field', function () {
      const updateItem = {};
      let data;
      return Tag.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app).put(`/api/tags/${data.id}`).send(updateItem);
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `name` in request body');
        });
    });

    it('should return an error when given a duplicate name', function () {
      return Tag.find().limit(2)
        .then(results => {
          const [item1, item2] = results;
          item1.name = item2.name;
          return chai.request(app)
            .put(`/api/tags/${item1.id}`)
            .send(item1);
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('The tag name already exists');
        });
    });

  });


  describe('DELETE /api/tags', function () {

    it('should delete a tag by id and respond with 204', function () {

      let tagToDelete;

      return Tag
        .findOne()
        .then(function (_tagToDelete) {
          tagToDelete = _tagToDelete;
          return chai.request(app).delete(`/api/tags/${tagToDelete.id}`);
        })
        .then(function (res) {
          expect(res).to.have.status(204);
          return Tag.findById(tagToDelete.id);
        })
        .then(function (_tagToDelete) {
          expect(_tagToDelete).to.be.null;
        });
    });
  });

});