const autocannon = require('autocannon');
require('dotenv').config();

const targetUrl = process.env.TARGET_URL || 'http://localhost:5000/api/auth/login';
const connections = parseInt(process.env.CONCURRENT_USERS || '100', 10);
const durationSeconds = parseInt(process.env.TEST_DURATION || '60', 10);

console.log('========================================================');
console.log('         DIAPREDICT API BASELINE & LOAD TEST            ');
console.log('========================================================');
console.log(`Target Endpoint  : ${targetUrl}`);
console.log(`Virtual Users    : ${connections}`);
console.log(`Duration         : ${durationSeconds} seconds`);
console.log('Starting execution... Please wait.');
console.log('--------------------------------------------------------');

const testInstance = autocannon({
  url: targetUrl,
  connections: connections,
  duration: durationSeconds,
  method: 'POST',
  headers: {
    'content-type': 'application/json'
  },
  body: JSON.stringify({
    email: 'demo@diabetes.com',
    password: 'MockPassword123'
  })
}, (err, result) => {
  if (err) {
    console.error('Load testing execution encountered an error:', err);
    process.exit(1);
  }
  
  printFormattedReport(result);
});

// Display real-time progress bar in terminal
autocannon.track(testInstance, { renderProgressBar: true });

function printFormattedReport(res) {
  console.log('\n========================================================');
  console.log('                  LOAD TEST RESULTS                     ');
  console.log('========================================================');
  console.log(`Total Requests Sent : ${res.requests.sent}`);
  console.log(`Total Duration      : ${res.duration} seconds`);
  console.log(`Success Requests    : ${res.requests.average || 0} average/sec`);
  console.log(`Errors/Non-2xx      : ${res.errors + res.non2xx}`);
  console.log('--------------------------------------------------------');
  
  console.log('THROUGHPUT METRICS:');
  console.log(`• Requests per Second (RPS):`);
  console.log(`    Average : ${res.requests.average.toFixed(2)} req/sec`);
  console.log(`    Min     : ${res.requests.min} req/sec`);
  console.log(`    Max     : ${res.requests.max} req/sec`);
  console.log('--------------------------------------------------------');

  console.log('RESPONSE TIMES (LATENCY):');
  console.log(`    Average : ${res.latency.average.toFixed(2)} ms`);
  console.log(`    Min     : ${res.latency.min} ms`);
  console.log(`    Max     : ${res.latency.max} ms`);
  console.log(`    50th %  : ${res.latency.p50} ms`);
  console.log(`    90th %  : ${res.latency.p90} ms`);
  console.log(`    99th %  : ${res.latency.p99} ms`);
  console.log('========================================================\n');
}
