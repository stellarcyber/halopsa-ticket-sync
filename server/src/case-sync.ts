/* eslint-disable max-statements */
import { getConf } from ':config';
import {
  HALOPSA_UNASSIGGNED_AGENT_NAME,
  MS_IN_SECOND,
  SECS_IN_MINUTE
} from ':constants';
import {
  HaloPsaActions,
  HaloPsaTickets,
  LocalComments,
  LocalTickets,
  StellarCase
} from ':data';
import {
  StellarCaseDTO,
  StellarCaseSeverity,
  StellarCaseStatus,
  TicketDTO
} from ':dto';
import {
  getStellarCaseUrl,
  isNonNullable,
  log,
  noop,
  sleep,
  sortHaloPsaActionsByTimeAsc,
  sortStellarCaseCommentsByTimeAsc
} from ':utils';
import { getQueueCount, processCaseCB } from './case-queue.js';

const PLACEHOLDER_DESCRIPTION = 'Placeholder';

export async function sync() {
  const {
    POLL_INTERVAL_MINS,
    HALOPSA_ADD_HALO_ASSIGNEE_TO_STELLAR_COMMENT,
    HALOPSA_SYNC_PRIORITY,
    HALOPSA_CATEGORY_NAME,
    HALOPSA_CLIENT_ID,
    HALOPSA_IMPACT_ID,
    HALOPSA_PRIORITY_ID,
    HALOPSA_TICKET_TYPE_ID,
    HALOPSA_URGENCY_ID,
    HALOPSA_ASSIGN_USERNAME,
    STELLAR_TENANT_ID,
    HALOPSA_USE_UPDATE_FOR_ACTION,
    HALOPSA_TO_STELLAR_PRIORITY_MAP,
    HALOPSA_USE_BETA_AUTO_INCREMENTING_TICKET_IDS
  } = getConf();
  const POLL_INTERVAL_SECONDS = POLL_INTERVAL_MINS * SECS_IN_MINUTE;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    const enqueuedSyncsCount = getQueueCount();
    if (enqueuedSyncsCount) {
      log.info(`${enqueuedSyncsCount} cases are still being synchronised.  Deferring to next loop cycle`);
      continue;
    }
    const tsStartOfLoopSeconds = Date.now() / MS_IN_SECOND;

    /* check existing / open cases on the HaloPSA side */
    const openTickets = await LocalTickets.getOpenTickets();

    await Promise.all(
      openTickets.map(
        async (openTicket) => await processOpenTicketLinkage({
          openTicket,
          HALOPSA_ADD_HALO_ASSIGNEE_TO_STELLAR_COMMENT,
          HALOPSA_SYNC_PRIORITY,
          HALOPSA_ASSIGN_USERNAME,
          HALOPSA_TO_STELLAR_PRIORITY_MAP
        })
      )
    );

    /* get all cases since last checkpoint */
    const stellarCases = await StellarCase.getAll({
      useCheckpoint: true,
      useModifiedAt: true,
      tenantId: STELLAR_TENANT_ID
    });

    log.info(`Retrieved case count: [${stellarCases.length}]`);

    if (HALOPSA_USE_BETA_AUTO_INCREMENTING_TICKET_IDS) {
      await Promise.all(
        stellarCases.map(
          async (stellarCase) => processStellarCase({
            stellarCase,
            HALOPSA_CATEGORY_NAME,
            HALOPSA_CLIENT_ID,
            HALOPSA_IMPACT_ID,
            HALOPSA_PRIORITY_ID,
            HALOPSA_TICKET_TYPE_ID,
            HALOPSA_URGENCY_ID,
            HALOPSA_ASSIGN_USERNAME,
            HALOPSA_USE_UPDATE_FOR_ACTION,
            HALOPSA_ADD_HALO_ASSIGNEE_TO_STELLAR_COMMENT,
            HALOPSA_SYNC_PRIORITY,
            HALOPSA_TO_STELLAR_PRIORITY_MAP
          })
        )
      );
    }
    else {
      for (const stellarCase of stellarCases) {
        // cannot use Promise.all() with HaloPSA.  It will cause errors on their back-end due to an inherent race condition in their BE when assigning case numbers.
        await processStellarCase({
          stellarCase,
          HALOPSA_CATEGORY_NAME,
          HALOPSA_CLIENT_ID,
          HALOPSA_IMPACT_ID,
          HALOPSA_PRIORITY_ID,
          HALOPSA_TICKET_TYPE_ID,
          HALOPSA_URGENCY_ID,
          HALOPSA_ASSIGN_USERNAME,
          HALOPSA_USE_UPDATE_FOR_ACTION,
          HALOPSA_ADD_HALO_ASSIGNEE_TO_STELLAR_COMMENT,
          HALOPSA_SYNC_PRIORITY,
          HALOPSA_TO_STELLAR_PRIORITY_MAP
        });
      }
    }

    // if (stellarCases.length) {
    //   const blacklistedCases = new Set([
    //     '68da706feda828dd9718fe43',
    //     '68da418d7e91cf344b6ad1dd',
    //     '68dab345d16ec958d5461431',
    //     '68da3e457e91cf344b6ad1d9'
    //   ]);
    //   for (const scase of stellarCases) {
    //     if (blacklistedCases.has(scase._id)) {
    //       continue;
    //     }
    //     await processStellarCase({
    //       stellarCase: scase,
    //       HALOPSA_CATEGORY_NAME,
    //       HALOPSA_CLIENT_ID,
    //       HALOPSA_IMPACT_ID,
    //       HALOPSA_PRIORITY_ID,
    //       HALOPSA_TICKET_TYPE_ID,
    //       HALOPSA_URGENCY_ID,
    //       HALOPSA_ASSIGN_USERNAME,
    //       HALOPSA_USE_UPDATE_FOR_ACTION,
    //       HALOPSA_ADD_HALO_ASSIGNEE_TO_STELLAR_COMMENT,
    //       HALOPSA_SYNC_PRIORITY,
    //       HALOPSA_TO_STELLAR_PRIORITY_MAP
    //     });
    //     break;
    //   }
    // }

    const tsLoopDurationSecs = (Date.now() / MS_IN_SECOND) - tsStartOfLoopSeconds;
    if (POLL_INTERVAL_SECONDS > tsLoopDurationSecs) {
      const tsSleepTimeSecs = POLL_INTERVAL_SECONDS - tsLoopDurationSecs;
      log.info(`Process loop duration took ${tsLoopDurationSecs}s - sleeping: ${tsSleepTimeSecs}s`);
      await sleep(tsSleepTimeSecs * MS_IN_SECOND);
    }
    else {
      log.warn('Process loop duration took longer than sleep time - staying awake to catch up');
    }
  }
}

// eslint-disable-next-line max-lines-per-function, complexity
async function processOpenTicketLinkage(params: {
  openTicket: TicketDTO,
  HALOPSA_ADD_HALO_ASSIGNEE_TO_STELLAR_COMMENT: boolean,
  HALOPSA_SYNC_PRIORITY: boolean,
  HALOPSA_ASSIGN_USERNAME: string,
  HALOPSA_TO_STELLAR_PRIORITY_MAP: Record<string, string>
}): Promise<void> {
  const {
    openTicket,
    HALOPSA_ADD_HALO_ASSIGNEE_TO_STELLAR_COMMENT,
    HALOPSA_SYNC_PRIORITY,
    HALOPSA_ASSIGN_USERNAME,
    HALOPSA_TO_STELLAR_PRIORITY_MAP
  } = params;
  const {
    remote_ticket_id: remoteTicketNumber,
    stellar_case_id: stellarCaseId,
    stellar_case_number: stellarCaseNumber
  } = openTicket;
  log.info(`Processing linkage for Stellar Case ${stellarCaseId} and HaloPSA ticket ${remoteTicketNumber}`);
  const haloTicketUrl = getHaloPsaTicketUrl(remoteTicketNumber);
  log.info(`Checking HaloPSA ticket ${remoteTicketNumber} @ ${haloTicketUrl} `);
  let [
    // eslint-disable-next-line prefer-const
    haloTicket,
    // eslint-disable-next-line prefer-const
    haloTicketActions,
    // stellarCase,
    // eslint-disable-next-line prefer-const
    stellarCaseComments,
    // eslint-disable-next-line prefer-const
    localComments
  ] = await Promise.all([
    HaloPsaTickets.getById(remoteTicketNumber),
    HaloPsaActions.getTicketActions(remoteTicketNumber),
    // StellarCase.getById(stellarCaseId),
    (await StellarCase.getComments(stellarCaseId)).sort(sortStellarCaseCommentsByTimeAsc),
    LocalComments.getByCaseId(stellarCaseId)
  ]);

  const currentStellarCommentIdsSet = new Set(
    localComments.map(
      ({ stellar_comment_id }) => stellar_comment_id
    )
  );
  const currentStellarSystemCommentIdsSet = new Set(
    localComments.filter(
      ({ system_comment }) => system_comment
    ).map(
      ({ stellar_comment_id }) => stellar_comment_id
    )
  );
  const currentHaloPsaActionIdsSet = new Set(
    localComments.filter(
      ({ halopsa_action_id }) => isNonNullable(halopsa_action_id)
    ).map(
      ({ halopsa_action_id }) => halopsa_action_id
    )
  );

  const newStellarComments = stellarCaseComments.filter(
    ({ _id }) => !currentStellarCommentIdsSet.has(_id)
  ).sort(sortStellarCaseCommentsByTimeAsc);
  const newHaloPsaActions = haloTicketActions.filter(
    ({
      id,
      note,
      note_html
    }) => !currentHaloPsaActionIdsSet.has(id) && !!(note ?? note_html)
  ).sort(sortHaloPsaActionsByTimeAsc);

  const hasNewStellarComments = !!newStellarComments.length;
  const hasNewHaloPsaActions = !!newHaloPsaActions.length;
  const localCommentInsertPromises: Promise<void>[] = [];

  if (hasNewStellarComments) {
    // sync stellar comments to HaloPSA, sort oldest to newest (date asc)
    for (const comment of newStellarComments) {
      log.info(`HaloPSA ticket: [${remoteTicketNumber}] | Stellar case: [${stellarCaseNumber}] - adding comment: '''${comment.comment}''' to HaloPSA ticket`);
    }
    
    const createRequests = newStellarComments.map(
      ({ comment }) => ({
        ticketId: remoteTicketNumber,
        who: HALOPSA_ASSIGN_USERNAME,
        note: comment
      })
    );
    const actions = await HaloPsaActions.createMany(createRequests);
    const commentsToActions = newStellarComments.map(
      ({ _id }, index) => {
        const action = actions[index];
        return [_id, action.id];
      }
    );
    localCommentInsertPromises.push(
      ...commentsToActions.map(
        async ([commentId, actionId]) => LocalComments.insertOne({
          stellarCaseId,
          stellarCommentId: commentId as string,
          halopsaTicketId: remoteTicketNumber,
          halopsaActionId: actionId as number,
          systemComment: false
        })
      )
    );
    log.info(`HaloPSA ticket: [${remoteTicketNumber}] | Stellar case: [${stellarCaseNumber}] - synced ${newStellarComments.length} comments to HaloPSA ticket`);
  }
    
  if (hasNewHaloPsaActions) {
    // sync HaloPSA comments to Stellar case
    for (const action of newHaloPsaActions) {
      const {
        note: note,
        note_html: noteHtml,
        who: commentAuthor
      } = action;
      const commentBody = noteHtml ?? note;
      const comment = `HaloPSA ticket: ${remoteTicketNumber} updated by: ${commentAuthor} comment: ${commentBody}`;
      log.info(`HaloPSA ticket: [${remoteTicketNumber}] | Stellar case: [${stellarCaseNumber}] - adding comment: '''${comment}''' to Stellar case`);
      const caseComment = await StellarCase.createComment({
        caseId: stellarCaseId,
        comment
      });
      localCommentInsertPromises.push(
        LocalComments.insertOne({
          stellarCaseId,
          stellarCommentId: caseComment._id,
          halopsaTicketId: remoteTicketNumber,
          halopsaActionId: action.id,
          systemComment: false
        })
      );
    }

    /* update assignee */
    if (HALOPSA_ADD_HALO_ASSIGNEE_TO_STELLAR_COMMENT) {
      const { agent_name } = haloTicket;
      const comment = agent_name === HALOPSA_UNASSIGGNED_AGENT_NAME
        ? 'HaloPSA ticket remains unassigned'
        : `HaloPSA ticket assigned to: ${agent_name}`;
      log.info(`HaloPSA Ticket: [${remoteTicketNumber}] | Stellar case: [${stellarCaseNumber}] - updating comment with HaloPSA assignee: [${comment}]`);
      await StellarCase.createSystemComment({ caseId: stellarCaseId, comment });
    }

    /* sync halopsa priority back to stellar case */
    if (HALOPSA_SYNC_PRIORITY) {
      const haloPriority = haloTicket.priority.name;
      if (haloPriority && haloPriority in HALOPSA_TO_STELLAR_PRIORITY_MAP) {
        const stellarSeverity = HALOPSA_TO_STELLAR_PRIORITY_MAP[haloPriority];
        log.info(`HaloPSA ticket: [${remoteTicketNumber}] | Stellar case: [${stellarCaseNumber}] - updating case severity: [${stellarSeverity}]`);
        await StellarCase.updateSeverity({ caseId: stellarCaseId, severity: stellarSeverity as StellarCaseSeverity });
      }
    }
  }
  
  /* update local tracking db with timestamp of HaloPSA ticket*/
  await Promise.all([
    LocalTickets.updateTicketTimestamps({ stellarCaseId }),
    localCommentInsertPromises
  ]);

  /* resolved tickets will have something populated in the 'resolved' section of the dataset */
  const haloClosed = !!haloTicket.hasbeenclosed;
  if (haloClosed) {
    const haloClosureNote = haloTicket.closure_note || '';
    log.info(`HaloPSA ticket is in resolved state: [${remoteTicketNumber}] - marking stellar case closed: [${stellarCaseNumber}: ${stellarCaseId}]`);
    await Promise.all([
      StellarCase.createComment({
        caseId: stellarCaseId,
        comment: haloClosureNote
      }),
      StellarCase.updateStatus({
        caseId: stellarCaseId,
        status: StellarCaseStatus.Resolved  
      })
    ]);
    await LocalTickets.closeTicketLinkage(stellarCaseId);
  }
}

// eslint-disable-next-line max-lines-per-function
async function processStellarCase(params: {
  stellarCase: StellarCaseDTO,
  HALOPSA_CATEGORY_NAME: string,
  HALOPSA_CLIENT_ID: number,
  HALOPSA_IMPACT_ID: number,
  HALOPSA_PRIORITY_ID: number,
  HALOPSA_TICKET_TYPE_ID: number,
  HALOPSA_URGENCY_ID: number,
  HALOPSA_ASSIGN_USERNAME: string,
  HALOPSA_USE_UPDATE_FOR_ACTION: boolean,
  HALOPSA_ADD_HALO_ASSIGNEE_TO_STELLAR_COMMENT: boolean,
  HALOPSA_SYNC_PRIORITY: boolean,
  HALOPSA_TO_STELLAR_PRIORITY_MAP: Record<string, string>
}): Promise<void> {
  const {
    stellarCase,
    HALOPSA_CATEGORY_NAME,
    HALOPSA_CLIENT_ID,
    HALOPSA_IMPACT_ID,
    HALOPSA_PRIORITY_ID,
    HALOPSA_TICKET_TYPE_ID,
    HALOPSA_URGENCY_ID,
    HALOPSA_ASSIGN_USERNAME,
    HALOPSA_USE_UPDATE_FOR_ACTION,
    HALOPSA_ADD_HALO_ASSIGNEE_TO_STELLAR_COMMENT,
    HALOPSA_SYNC_PRIORITY,
    HALOPSA_TO_STELLAR_PRIORITY_MAP
  } = params;
  const { _id: stellarCaseId, ticket_id: stellarCaseNumber } = stellarCase;
      
  /* is this an update or new case */
  const ticketLinkage = await LocalTickets.getTicketLinkageByStellarCaseId(stellarCaseId).catch(noop);
      
  if (ticketLinkage) {
    /* update haloPSA ticket */
    // pass - no implementation in original code
    return undefined;
  }
  /* this is a new instance - create new haloPSA ticket and insert linkage into local database */
  const caseName = stellarCase.name || '';
  const caseSummary = await StellarCase.getSummary(stellarCaseId);
  const formattedCaseSummary = arrayToHtmlFormatting(
    caseSummary.split('\n')
  );
  const caseObservables = await StellarCase.getObservables(stellarCaseId);
  const formattedCaseObservables = jsonToHtmlFormatting(caseObservables);
  const caseScore = stellarCase.score || 1;
  const stellarTenantName = stellarCase.tenant_name || '';
        
  /* added 20240826.000 support tenant filter */
  // if (_TENANT_FILTER_ && !_TENANT_FILTER_.includes(stellarTenantName)) {
  //   log.info(`Case [${stellarCaseNumber}: ${caseName}] for tenant: [${stellarTenantName}] does not match tenant filter and will be skipped`);
  //   continue;
  // }
        
  // const stellarTenantId = caseItem.cust_id;

  const stellarAlerts = await StellarCase.getAlerts({
    caseId: stellarCaseId,
    onlyAlertNames: true
  });
  const eventNames = arrayToHtmlFormatting(stellarAlerts);
  const stellarCaseUrl = getStellarCaseUrl(stellarCaseId);
  
  const caseDescription = formatCaseDescription({
    tenantName: stellarTenantName,
    caseSummary: formattedCaseSummary,
    caseScore,
    caseObservables: formattedCaseObservables,
    alerts: eventNames,
    stellarUrl: stellarCaseUrl
  });

  const details = HALOPSA_USE_UPDATE_FOR_ACTION
    ? PLACEHOLDER_DESCRIPTION
    : caseDescription;
  const haloTicket = await HaloPsaTickets.createOne({ 
    summary: caseName, 
    details,
    // caseScore, 
    // label: stellarTenantName,
    category_1: HALOPSA_CATEGORY_NAME,
    client_id: HALOPSA_CLIENT_ID,
    impact: HALOPSA_IMPACT_ID,
    priority_id: HALOPSA_PRIORITY_ID,
    tickettype_id: HALOPSA_TICKET_TYPE_ID,
    urgency: HALOPSA_URGENCY_ID,
    users_name: HALOPSA_ASSIGN_USERNAME
  });
  
  const { id: haloTicketId } = haloTicket;
  const haloTicketUrl = getHaloPsaTicketUrl(haloTicketId);
  
  log.info(`Created HaloPSA Ticket ${haloTicketId} at ${haloTicketUrl} `);
  const stellarCaseComment = `HaloPSA ticket created: id: [${haloTicketId}] | url: [ ${haloTicketUrl} ]`;
  const [, openTicket] = await Promise.all([
    StellarCase.createSystemComment({
      caseId: stellarCaseId,
      comment: stellarCaseComment
    }),      
    LocalTickets.insertTicketLinkage({
      stellarCaseId, 
      stellarCaseNumber, 
      remoteTicketId: haloTicketId
    })
  ]);
  const cb = async () => processOpenTicketLinkage({
    openTicket,
    HALOPSA_ADD_HALO_ASSIGNEE_TO_STELLAR_COMMENT,
    HALOPSA_SYNC_PRIORITY,
    HALOPSA_ASSIGN_USERNAME,
    HALOPSA_TO_STELLAR_PRIORITY_MAP
  });
  // eslint-disable-next-line no-void
  void processCaseCB(cb);
  return undefined;
}

export function arrayToHtmlFormatting(listOfItems: string[]): string {
  /**
   * Converts a list of strings to an HTML bulleted list
   * Each item becomes a <li> element within a <ul> container
   */
  if (listOfItems.length === 0) {
    return '<ul></ul>';
  }
  let htmlStr = '<ul>\n';
  for (const listItem of listOfItems) {
    htmlStr += `  <li>${listItem}</li>\n`;
  }
  htmlStr += '</ul>';
  return htmlStr;
}

export function jsonToHtmlFormatting(jsonValue: Record<string, any[]>): string {
  /**
    * Converts a JSON object to an HTML nested bulleted list
    * Keys become top-level <li> elements (bold)
    * Values (arrays of objects) become nested <ul> with <li> elements
    * Object properties are formatted as "key: value | key: value"
    */
  if (Object.keys(jsonValue).length === 0) {
    return '<ul></ul>';
  }
  let htmlStr = '<ul>\n';
  for (const key of Object.keys(jsonValue)) {
    htmlStr += `  <li><strong>${key}</strong>\n`;
    const obList = jsonValue[key];     
    if (obList.length > 0) {
      htmlStr += '    <ul>\n';
      for (const obItem of obList) {
        let tmpStr = '';
        for (const k of Object.keys(obItem)) {
          tmpStr += `${k}: ${obItem[k] || ''} | `;
        }
        tmpStr = tmpStr.replace(/ \| $/, ''); // Remove trailing " | "
        htmlStr += `      <li>${tmpStr}</li>\n`;
      }
      htmlStr += '    </ul>\n';
    }
    htmlStr += '  </li>\n';
  }
  htmlStr += '</ul>';
  return htmlStr;
}

export function formatCaseDescription(params: {
  tenantName: string,
  caseSummary: string,
  caseScore: number,
  caseObservables: string,
  alerts: string,
  stellarUrl: string
}): string {
  const {
    tenantName,
    caseSummary,
    caseScore,
    caseObservables,
    alerts,
    stellarUrl
  } = params;
  const singleRowStyle = 'display: flex; align-items: center; gap: 0.5rem;';
  const caseDescription = `
<div style="${singleRowStyle}">
  <h3>Tenant:</h3> ${tenantName}
</div>
<div style="${singleRowStyle}">
  <h3>Score:</h3> ${caseScore}
</div>
<h3>Summary</h3>
${caseSummary}
<h3>Observables</h3>
${caseObservables}
<h3>Security Alerts</h3>
${alerts}
<h3>Link to Stellar Case:</h3> <a href="${stellarUrl}">${stellarUrl}</a>`;
  return caseDescription;
}

export function getHaloPsaTicketUrl(ticketId: number): string {
  // https://stellardev.halopsa.com/tickets?showalltickettypes=1&mainview=all&viewid=1&selid=-1&sellevel=1&selparentid=0&id=2820
  const { HALOPSA_BASE_URL } = getConf();
  return `${HALOPSA_BASE_URL}/tickets?id=${ticketId}`;
}
