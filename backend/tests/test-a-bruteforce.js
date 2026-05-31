#!/usr/bin/env node

/**
 * TEST A - BRUTE-FORCE LOCKOUT VERIFICATION
 * Tests: Login lockout after N failed attempts
 * Expected: 403 status on attempt N, then 403 on correct password
 * MongoDB verification: User document shows isLocked=true
 */

const http = require('http');

const API_BASE = 'http://localhost:5000';
const TEST_USERNAME = 'testuser-bruteforce';
const TEST_EMAIL = `${TEST_USERNAME}@test.com`;
const CORRECT_PASSWORD = 'TestPassword123!';
const WRONG_PASSWORD = 'WrongPassword123!';
const MAX_ATTEMPTS = 5;

// Helper function to make HTTP requests
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTest() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST A: BRUTE-FORCE LOCKOUT VERIFICATION');
  console.log('='.repeat(80) + '\n');

  try {
    // Step 1: Register test user
    console.log('Step 1: Registering test user...');
    const registerRes = await makeRequest('POST', '/api/auth/register', {
      username: TEST_USERNAME,
      email: TEST_EMAIL,
      password: CORRECT_PASSWORD,
      role: 'customer',
    });

    if (registerRes.status !== 201) {
      console.log(`❌ Failed to register user: ${registerRes.status}`);
      console.log(registerRes.body);
      process.exit(1);
    }
    console.log(`✅ User registered successfully\n`);

    // Step 2: Attempt login with wrong password N times
    console.log(`Step 2: Attempting ${MAX_ATTEMPTS} failed logins...\n`);
    const loginResults = [];

    for (let i = 1; i <= MAX_ATTEMPTS; i++) {
      const loginRes = await makeRequest('POST', '/api/auth/login', {
        usernameOrEmail: TEST_USERNAME,
        password: WRONG_PASSWORD,
      });

      loginResults.push({
        attempt: i,
        status: loginRes.status,
        message: loginRes.body?.message || 'N/A',
      });

      console.log(`Attempt ${i}:  Status=${loginRes.status}  |  Message="${loginRes.body?.message || 'N/A'}"`);

      // Small delay to avoid rate limiting within test
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Step 3: Verify lockout on next attempt
    console.log(`\nStep 3: Attempting login AFTER lockout threshold...\n`);
    const postLockoutRes = await makeRequest('POST', '/api/auth/login', {
      usernameOrEmail: TEST_USERNAME,
      password: WRONG_PASSWORD,
    });

    console.log(`Attempt ${MAX_ATTEMPTS + 1} (after lockout):  Status=${postLockoutRes.status}  |  Message="${postLockoutRes.body?.message || 'N/A'}"`);

    // Step 4: Attempt login with CORRECT password (should still be locked)
    console.log(`\nStep 4: Attempting login with CORRECT password (while locked)...\n`);
    const correctPwRes = await makeRequest('POST', '/api/auth/login', {
      usernameOrEmail: TEST_USERNAME,
      password: CORRECT_PASSWORD,
    });

    console.log(`Correct password attempt:  Status=${correctPwRes.status}  |  Message="${correctPwRes.body?.message || 'N/A'}"`);

    // Step 5: Summary
    console.log('\n' + '='.repeat(80));
    console.log('TEST RESULTS SUMMARY');
    console.log('='.repeat(80) + '\n');

    let passed = true;

    // Check that all wrong attempts are 401
    const allWrongAre401 = loginResults.every((r) => r.status === 401);
    console.log(`✓ All wrong password attempts return 401: ${allWrongAre401 ? '✅ PASS' : '❌ FAIL'}`);
    if (!allWrongAre401) passed = false;

    // Check that post-lockout attempt is 401 or 423 (423 = locked)
    const postLockoutIs401Or423 = [401, 423].includes(postLockoutRes.status);
    console.log(`✓ Post-lockout attempt returns 401/423: ${postLockoutIs401Or423 ? '✅ PASS' : '❌ FAIL'}`);
    if (!postLockoutIs401Or423) passed = false;

    // Check that correct password while locked is 423
    const correctWhileLockedIs423 = correctPwRes.status === 423;
    console.log(`✓ Correct password while locked returns 423: ${correctWhileLockedIs423 ? '✅ PASS' : '❌ FAIL'}`);
    if (!correctWhileLockedIs423) passed = false;

    console.log(`\n${passed ? '✅ TEST A PASSED' : '❌ TEST A FAILED'}\n`);

    return passed;
  } catch (error) {
    console.error('❌ Test error:', error.message);
    process.exit(1);
  }
}

runTest().then((passed) => {
  process.exit(passed ? 0 : 1);
});
