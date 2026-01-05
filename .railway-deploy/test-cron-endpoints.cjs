#!/usr/bin/env node
/**
 * Local test script for Vercel Cron Jobs
 * 
 * This script simulates Vercel cron job requests locally
 * Usage: node test-cron-endpoints.js
 */

// Mock Vercel Request and Response objects
const mockRequest = (path) => ({
  headers: {
    // Simulate local development (no auth header)
  },
  method: 'GET',
  url: path,
  query: {}
});

const mockResponse = () => {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    
    status(code) {
      this.statusCode = code;
      return this;
    },
    
    setHeader(key, value) {
      this.headers[key] = value;
      return this;
    },
    
    json(data) {
      this.body = data;
      console.log(`\n✓ Response ${this.statusCode}:`, JSON.stringify(data, null, 2));
      return this;
    },
    
    send(data) {
      this.body = data;
      console.log(`\n✓ Response ${this.statusCode}:`, data);
      return this;
    },
    
    end() {
      return this;
    }
  };
  
  return res;
};

// Test endpoints
async function testEndpoints() {
  console.log('🧪 Testing Vercel Cron Job Endpoints\n');
  console.log('=' .repeat(60));
  
  // Test 1: Health Check
  console.log('\n📋 Test 1: Health Check (/api/cron)');
  console.log('-'.repeat(60));
  try {
    const cronHandler = require('./api/cron.ts').default;
    const req1 = mockRequest('/api/cron');
    const res1 = mockResponse();
    await cronHandler(req1, res1);
    
    if (res1.statusCode === 200) {
      console.log('✅ Health check passed');
    } else {
      console.log('❌ Health check failed');
    }
  } catch (error) {
    console.log('⚠️  TypeScript files need to be compiled first');
    console.log('   Run: npm run build');
  }
  
  // Test 2: DJEN Monitor
  console.log('\n📋 Test 2: DJEN Monitor (/api/cron/djen-monitor)');
  console.log('-'.repeat(60));
  try {
    const djenHandler = require('./api/cron/djen-monitor.ts').default;
    const req2 = mockRequest('/api/cron/djen-monitor');
    const res2 = mockResponse();
    await djenHandler(req2, res2);
    
    if (res2.statusCode === 200) {
      console.log('✅ DJEN monitor passed');
    } else {
      console.log('❌ DJEN monitor failed');
    }
  } catch (error) {
    console.log('⚠️  TypeScript files need to be compiled first');
    console.log('   Run: npm run build');
  }
  
  // Test 3: Daily Reset
  console.log('\n📋 Test 3: Daily Reset (/api/cron/daily-reset)');
  console.log('-'.repeat(60));
  try {
    const resetHandler = require('./api/cron/daily-reset.ts').default;
    const req3 = mockRequest('/api/cron/daily-reset');
    const res3 = mockResponse();
    await resetHandler(req3, res3);
    
    if (res3.statusCode === 200) {
      console.log('✅ Daily reset passed');
    } else {
      console.log('❌ Daily reset failed');
    }
  } catch (error) {
    console.log('⚠️  TypeScript files need to be compiled first');
    console.log('   Run: npm run build');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✨ All tests completed!');
  console.log('\n💡 To test with Vercel CLI:');
  console.log('   1. Install: npm i -g vercel');
  console.log('   2. Run: vercel dev');
  console.log('   3. Test: curl http://localhost:3000/api/cron');
}

// Run tests
testEndpoints().catch(error => {
  console.error('\n❌ Test failed:', error.message);
  process.exit(1);
});
