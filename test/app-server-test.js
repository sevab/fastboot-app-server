"use strict";

const path              = require('path');
const fork              = require('child_process').fork;
const expect            = require('chai').expect;
const FastBootAppServer = require('../lib/fastboot-app-server');
const request           = require('request-promise').defaults({ simple: false, resolveWithFullResponse: true });

let server;

describe("FastBootAppServer", function() {
  this.timeout(3000);

  afterEach(function() {
    if (server) {
      server.kill();
    }
  });

  it("throws if no distPath or downloader is provided", function() {
    expect(() => {
      new FastBootAppServer();
    }).to.throw(/must be provided with either a distPath or a downloader/);
  });

  it("throws if both a distPath and downloader are provided", function() {
    expect(() => {
      new FastBootAppServer({
        downloader: {},
        distPath: 'some/dist/path'
      });
    }).to.throw(/FastBootAppServer must be provided with either a distPath or a downloader option, but not both/);
  });

  it("serves an HTTP 500 response if the app can't be found", function() {
    return runServer('not-found-server')
      .then(() => request('http://localhost:3000'))
      .then(response => {
        expect(response.statusCode).to.equal(500);
        expect(response.body).to.match(/No Application Found/);
      });
  });

});

function runServer(name) {
  return new Promise((res, rej) => {
    let serverPath = path.join(__dirname, 'fixtures', `${name}.js`);
    server = fork(serverPath, {
      silent: true
    });

    server.on('error', rej);

    server.stdout.on('data', data => {
      if (data.toString().match(/HTTP server started/)) {
        res();
      }
    });

    server.stderr.on('data', data => {
      console.log(data.toString());
    });
  });
}
