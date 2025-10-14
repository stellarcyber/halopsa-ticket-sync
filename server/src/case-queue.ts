import { log } from ':utils';
import { getConf } from ':config';
import { MS_IN_SECOND } from ':constants';

export interface AsyncProcessCaseRecord {
  ticketCB: () => Promise<void>,
  resolve: () => void
};

const { PROCESS_CASES_PAGE_SIZE } = getConf();
const callbackRecords: AsyncProcessCaseRecord[] = [];
let activePromises = 0;
let processing = false;


export async function processCaseCB(ticketCB: () => Promise<void>): Promise<void> {
  log.debug('processCaseCB()');
  const { resolve, promise } = Promise.withResolvers();
  const newRecord: AsyncProcessCaseRecord = {
    ticketCB,
    resolve: resolve as () => void
  };
  callbackRecords.push(newRecord);
  invokeProcessCycle();
  return promise as Promise<void>;
}

export function getQueueCount(): number {
  return callbackRecords.length;
}


function invokeProcessCycle() {
  setImmediate(
    async () => processCycle()
  );
}


async function executeRecord(record: AsyncProcessCaseRecord) {
  const now = Date.now();
  activePromises++;
  
  try {
    await record.ticketCB();
    log.debug(`processCycle(): callback completed in ${(Date.now() - now) / MS_IN_SECOND} seconds`);
  }
  finally {
    record.resolve();
    activePromises--;
    // Trigger another cycle to fill the watermark
    if (callbackRecords.length > 0) {
      invokeProcessCycle();
    }
  }
}


async function processCycle() {
  log.debug('processCycle()');
  if (processing) {
    log.debug('processCycle(): already processing. Returning');
    return;
  }
  
  processing = true;
  
  try {
    // Keep filling up to the high watermark
    while (callbackRecords.length > 0 || activePromises > 0) {
      // Launch new callbacks up to the watermark
      while (callbackRecords.length > 0 && activePromises < PROCESS_CASES_PAGE_SIZE) {
        const record = callbackRecords.shift()!;
        
        log.debug(`processCycle(): launching callback (active: ${activePromises + 1}/${PROCESS_CASES_PAGE_SIZE}, queued: ${callbackRecords.length})`);
        
        // Launch the callback without awaiting it
        // eslint-disable-next-line no-void
        void executeRecord(record);
      }
      
      // If we're at capacity or no more work, wait a bit before checking again
      if (activePromises >= PROCESS_CASES_PAGE_SIZE || callbackRecords.length === 0) {
        if (activePromises > 0) {
          // Wait a short time before checking if we can launch more
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        else {
          // No active promises and no queued work, we're done
          break;
        }
      }
    }
  }
  finally {
    processing = false;
  }
  
  log.debug('processCycle(): processCycle complete');
}
