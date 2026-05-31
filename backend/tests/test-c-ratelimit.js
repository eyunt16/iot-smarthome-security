#!/usr/bin/env node

/**
 * TEST C - RATE LIMITER VERIFICATION
 * Tests: API rate limiting (auth limiter = 100 requests/15 min, which is 10 in test env)
 * Expected: Requests succeed until limit hit, then 429 Too Many Requests
 * 
 * Configuration from .env:
 * AUTH_RATE_LIMIT_MAX=10 (for testing purposes)
 */

const http = require('http');

const API_BASE = 'http://localhost:5000';
const NUM_REQUESTS = 15; // Try 15 requests to hit the 10-request limit

function makeRequest(username, password) {
  return new Promise((resolve, reject) => {
    const url = new URL('/api/auth/login', API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
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
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data ? JSON.parse(data) : null,
        });
      });
    });

    req.on('error', reject);

    req.write(
      JSON.stringify({
        usernameOrEmail: username,
        password: password,
      }),
    );
    req.end();
  });
}

async function runTest() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST C: RATE LIMITER VERIFICATION');
  console.log('='.repeat(80) + '\n');

  try {
    console.log(`Sending ${NUM_REQUESTS} rapid login requests to trigger rate limiter...\n`);

    const results = [];
    let rateLimitHitAt = null;

    for (let i = 1; i <= NUM_REQUESTS; i++) {
      try {
        const res = await makeRequest('admin', 'admin@123456');

        const retryAfter = res.headers['retry-after'] || 'N/A';
        const rateLimit = res.headers['ratelimit-limit'] || 'N/A';
        const rateLimitRemaining = res.headers['ratelimit-remaining'] || 'N/A';

        results.push({
          attempt: i,
          status: res.statusCode,
          retryAfter: retryAfter,
          rateLimit: rateLimit,
          rateLimitRemaining: rateLimitRemaining,
        });

        let icon = '✅';
        if (res.status === 429) {
          icon = '⚠️ ';
          if (!rateLimitHitAt) {
            rateLimitHitAt = i;
          }
        }

        console.log(
          `${icon} Request ${String(i).padStart(2, ' ')}: Status=${res.status} | RateLimit-Remaining=${rateLimitRemaining} | Retry-After=${retryAfter}`,
        );

        // Don't pause for rate-limited requests, but small pause for others to avoid overwhelming
        if (res.status !== 429) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      } catch (error) {
        console.log(`❌ Request ${i}: Error - ${error.message}`);
        results.push({
          attempt: i,
          status: 'ERROR',
          error: error.message,
        });
      }
    }

    // Step 2: Analysis
    console.log('\n' + '='.repeat(80));
    console.log('RATE LIMITER ANALYSIS');
    console.log('='.repeat(80) + '\n');

    const first429 = results.find((r) => r.status === 429);
    const rateLimitConfig = 10; // From .env AUTH_RATE_LIMIT_MAX

    console.log(`Configuration: AUTH_RATE_LIMIT_MAX=${rateLimitConfig} requests per 15 minutes\n`);

    console.log(`Rate limit triggered at request #${rateLimitHitAt || 'NOT HIT (unexpected)'}`);
    console.log(
      `Expected trigger: After request #${rateLimitConfig + 1} (threshold = ${rateLimitConfig} requests)\n`,
    );

    if (first429) {
      console.log(`✓ First 429 response at request #${first429.attempt}`);
      console.log(`✓ Retry-After header: ${first429.retryAfter} seconds`);
      console.log(`✓ RateLimit-Limit: ${first429.rateLimit}`);
      console.log(`✓ RateLimit-Remaining: ${first429.rateLimitRemaining}\n`);
    }

    // Validation
    console.log('='.repeat(80));
    console.log('VALIDATION RESULTS');
    console.log('='.repeat(80) + '\n');

    let passed = true;

    // Check that rate limit was hit
    if (!rateLimitHitAt) {
      console.log('❌ Rate limiter was NOT triggered (did not receive 429 response)');
      passed = false;
    } else {
      console.log(`✅ Rate limiter triggered at request #${rateLimitHitAt}`);
    }

    // Check that it was hit around the expected threshold
    if (rateLimitHitAt && Math.abs(rateLimitHitAt - (rateLimitConfig + 1)) <= 1) {
      console.log(`✅ Trigger point is at expected threshold (${rateLimitConfig + 1} ± 1)`);
    } else if (rateLimitHitAt) {
      console.log(
        `⚠️  Trigger point is at request #${rateLimitHitAt}, expected ~${rateLimitConfig + 1}`,
      );
    }

    // Check that Retry-After header is present
    if (first429 && first429.retryAfter !== 'N/A') {
      console.log(`✅ Retry-After header present: ${first429.retryAfter} seconds`);
    } else if (first429) {
      console.log(`❌ Retry-After header missing`);
      passed = false;
    }

    // All requests before limit should be 401 (auth failed, but not rate limited)
    const beforeLimit = results.slice(0, rateLimitHitAt ? rateLimitHitAt - 1 : NUM_REQUESTS);
    const allBefore401 = beforeLimit.every((r) => r.status === 401);
    if (allBefore401) {
      console.log(`✅ All requests before limit returned 401 (auth failed, not rate limited)`);
    } else {
      console.log(
        `⚠️  Not all pre-limit requests were 401 (some other status codes present)`,
      );
    }

    console.log(`\n${passed ? '✅ TEST C PASSED' : '❌ TEST C FAILED'}\n`);

    return passed;
  } catch (error) {
    console.error('❌ Test error:', error.message);
    process.exit(1);
  }
}

runTest().then((passed) => {
  process.exit(passed ? 0 : 1);
});
