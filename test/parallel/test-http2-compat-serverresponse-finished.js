'use strict';

const common = require('../common');
if (!common.hasCrypto)
  common.skip('missing crypto');
const assert = require('assert');
const h2 = require('http2');
const net = require('net');

// Http2ServerResponse.finished
const server = h2.createServer();
server.listen(0, common.mustCall(function() {
  const port = server.address().port;
  server.once('request', common.mustCall(function(request, response) {
    assert.ok(response.socket instanceof net.Socket);
    assert.ok(response.connection instanceof net.Socket);
    assert.strictEqual(response.socket, response.connection);

    response.on('finish', common.mustCall(function() {
      assert.strictEqual(response.socket, undefined);
      assert.strictEqual(response.connection, undefined);
      process.nextTick(common.mustCall(() => {
        assert.ok(response.stream);
        server.close();
      }));
    }));
    assert.strictEqual(response.finished, false);
    response.end();
    assert.strictEqual(response.finished, true);
  }));

  const url = `http://localhost:${port}`;
  const client = h2.connect(url, common.mustCall(function() {
    const headers = {
      ':path': '/',
      ':method': 'GET',
      ':scheme': 'http',
      ':authority': `localhost:${port}`
    };
    const request = client.request(headers);
    request.on('end', common.mustCall(function() {
      client.close();
    }));
    request.end();
    request.resume();
  }));
}));
