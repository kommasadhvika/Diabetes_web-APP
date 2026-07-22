import fs from 'fs';
import readline from 'readline';

async function parseLogs() {
  const logPath = 'C:\\Users\\konda\\.gemini\\antigravity-ide\\brain\\a73dd8cd-bd15-4e18-ab7e-d84a879f34ce\\.system_generated\\logs\\transcript.jsonl';
  
  if (!fs.existsSync(logPath)) {
    console.error('Log file does not exist at:', logPath);
    return;
  }

  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineCount = 0;
  for await (const line of rl) {
    lineCount++;
    if (line.includes('capture_browser_console_logs')) {
      try {
        const obj = JSON.parse(line);
        // Look for tool calls or results
        if (obj.tool_calls) {
          for (const tc of obj.tool_calls) {
            if (tc.name === 'capture_browser_console_logs') {
              console.log(`[Line ${lineCount}] Tool call capture_browser_console_logs args:`, tc.args);
            }
          }
        }
        // If this is a step showing a tool result
        if (obj.type === 'TOOL_RESPONSE' || (obj.content && obj.content.includes('[BROWSER CONSOLE'))) {
          console.log(`[Line ${lineCount}] Log payload contains browser logs.`);
          // Let's print messages containing error
          const logs = obj.content;
          const lines = logs.split('\n');
          for (const l of lines) {
            if (l.toLowerCase().includes('error') || l.toLowerCase().includes('fail') || l.toLowerCase().includes('warning') || l.includes('%s')) {
              console.log('  ->', l.slice(0, 300));
            }
          }
        }
      } catch (err) {
        // Skip
      }
    }
  }
}

parseLogs();
