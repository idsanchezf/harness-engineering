'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function makeTmpDir(prefix = 'harness-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function cleanup(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

module.exports = { makeTmpDir, cleanup };
