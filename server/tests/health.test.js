const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');

describe('Health Check', () => {
  let baseUrl;

  before(() => {
    baseUrl = process.env.TEST_URL || 'http://localhost:5000';
  });

  it('should return health status', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    const data = await response.json();

    assert.strictEqual(response.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.message, 'Server is running');
    assert.ok(data.data.timestamp);
    assert.ok(data.data.environment);
  });
});
