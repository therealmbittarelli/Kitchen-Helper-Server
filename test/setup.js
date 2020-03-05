
process.env.TZ = 'UCT';
// process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRY = '3m';

require('dotenv').config();

process.env.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL
    || 'postgresql://dunder_mifflin:mypassword@localhost/kitchen_helper_test_2020';

const { expect } = require('chai');
const supertest = require('supertest');
const should = require('should');


global.expect = expect;
global.supertest = supertest;
global.should = should;