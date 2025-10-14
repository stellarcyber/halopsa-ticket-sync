import {
  getApiUrl,
  getAxios,
  getStellarServer,
  isNonNullable,
  log
} from ':utils';
import { getHeaders } from './stellar-auth.data.js';
import { getConf } from ':config';
import { MS_IN_SECOND, SECONDS_IN_DAY } from ':constants';
import {
  StellarCaseCommentCreateResponseDTO,
  StellarCaseCommentDTO,
  StellarCaseCommentResponseDTO,
  StellarCaseDTO,
  StellarCaseResponseDTO,
  StellarCaseSeverity,
  StellarCaseStatus,
  StellarCasesResponseDTO
} from ':dto';
import { LocalCheckpoint, LocalComments } from '../localdb/index.js';

// eslint-disable-next-line max-statements, complexity
export async function getAll(params: {
  fromTimestamp?: number,
  useCheckpoint?: boolean,
  tenantId?: string,
  useModifiedAt?: boolean,
  ignoreCaseTag?: boolean,
  ignoreApiUserMods?: boolean
} = {}): Promise<StellarCaseDTO[]> {
  const {
    useCheckpoint = true,
    tenantId = '',
    useModifiedAt = false,
    ignoreCaseTag = true,
    ignoreApiUserMods = false
  } = params;
  let { fromTimestamp = 0 } = params;
  const {
    STELLAR_INITIAL_LOOPBACK_DAYS,
    STELLAR_CASE_TAG,
    STELLAR_MIN_ALERT_COUNT,
    STELLAR_MIN_SCORE,
    STELLAR_USER_ID
  } = getConf();
  const server = getStellarServer();
  const { verifySSL, host } = server;
  const axios = getAxios(verifySSL);
  const baseUrl = getApiUrl(host, '/cases');
  const headers = await getHeaders(server);
  const url = new URL(baseUrl);
  if (useCheckpoint) {
    fromTimestamp = await LocalCheckpoint.get() ?? 0;
  }
  if (!fromTimestamp) {
    const daysAgoInMS = SECONDS_IN_DAY * STELLAR_INITIAL_LOOPBACK_DAYS * MS_IN_SECOND;
    fromTimestamp = Date.now() - daysAgoInMS;
  }
  if (useModifiedAt) {
    url.searchParams.set('FROM~modified_at', `${fromTimestamp}`);
  }
  else {
    url.searchParams.set('FROM~created_at', `${fromTimestamp}`);
  }
  if (!ignoreCaseTag) {
    url.searchParams.set('NOT~tags', STELLAR_CASE_TAG);
  }
  if (isNonNullable(STELLAR_MIN_ALERT_COUNT)) {
    url.searchParams.set('min_size_auto', `${STELLAR_MIN_ALERT_COUNT}`);
  }
  if (STELLAR_MIN_SCORE) {
    url.searchParams.set('FROM~score', `${STELLAR_MIN_SCORE}`);
  }
  if (tenantId) {
    url.searchParams.set('tenantid', tenantId);
  }
  if (ignoreApiUserMods) {
    url.searchParams.set('NOT~modified_by', STELLAR_USER_ID);
  }
  log.info(`Getting Stellar cases from timestamp ${new Date(fromTimestamp).toISOString()}`);
  const res = (await axios.get<StellarCasesResponseDTO>(url.href, { headers })).data.data;
  const { cases } = res;
  if (useCheckpoint) {
    await LocalCheckpoint.update();
  }
  return cases;
}

export async function getById(caseId: string): Promise<StellarCaseDTO> {
  const server = getStellarServer();
  const { verifySSL, host } = server;
  const axios = getAxios(verifySSL);
  const url = getApiUrl(host, `/cases/${caseId}`);
  const headers = await getHeaders(server);
  return (await axios.get<StellarCaseResponseDTO>(url, { headers })).data.data;
}

export async function getSummary(caseId: string): Promise<any> {
  const server = getStellarServer();
  const { verifySSL, host } = server;
  const axios = getAxios(verifySSL);
  const url = getApiUrl(host, `cases/${caseId}/summary?formatted=true`);
  const headers = await getHeaders(server);
  return (await axios.get(url, { headers })).data.data;
}

export async function getObservables(caseId: string): Promise<any> {
  const server = getStellarServer();
  const { verifySSL, host } = server;
  const axios = getAxios(verifySSL);
  const url = getApiUrl(host, `cases/${caseId}/observables`);
  const headers = await getHeaders(server);
  return (await axios.get(url, { headers })).data.observables;
}

export async function getAlerts(params: {
  caseId: string,
  onlyAlertNames?: boolean,
  limit?: number
}): Promise<any> {
  const {
    caseId,
    onlyAlertNames = false,
    limit = 50
  } = params;
  const server = getStellarServer();
  const { verifySSL, host } = server;
  const axios = getAxios(verifySSL);
  const url = getApiUrl(host, `cases/${caseId}/alerts`);
  const headers = await getHeaders(server);
  const alerts: any[] = [];
  let skip = 0;
  let count = 0;
  do {
    const u = `${url}?limit=${limit}&skip=${skip}`;
    const { docs } = (await axios.get(u, { headers })).data.data;
    count = docs.length;
    skip += count;
    const alrts = docs.map(
      (doc: any) => docsToAlert(doc, onlyAlertNames)
    ).filter((isNonNullable));
    alerts.push(...alrts);
  }
  while (count >= limit);
  return alerts;
}

function docsToAlert(doc: any, onlyAlertNames: boolean) {
  const {
    _source: interflow,
    _id = '',
    _index = ''
  } = doc;
  if (onlyAlertNames) {
    const alertName = interflow.xdr_event?.display_name;
    const alertScore = interflow.event_score ?? '';
    if (alertName) {
      return `${alertName} [${alertScore}]`;
    }
  }
  else {
    interflow._id = _id;
    interflow.index = _index;
    return interflow;
  }
  return undefined;
}

export async function getComments(caseId: string): Promise<StellarCaseCommentDTO[]> {
  const server = getStellarServer();
  const { verifySSL, host } = server;
  const axios = getAxios(verifySSL);
  const url = getApiUrl(host, `cases/${caseId}/comments`);
  const headers = await getHeaders(server);
  return (await axios.get<StellarCaseCommentResponseDTO>(url, { headers })).data.data;
}

export async function createComment(params: { caseId: string, comment: string }): Promise<StellarCaseCommentDTO> {
  const { caseId, comment } = params;
  const server = getStellarServer();
  const { verifySSL, host } = server;
  const axios = getAxios(verifySSL);
  const url = getApiUrl(host, `cases/${caseId}/comments`);
  const headers = await getHeaders(server);
  const data = { comment };
  return (await axios.post<StellarCaseCommentCreateResponseDTO>(url, data, { headers })).data.data;
}

export async function createSystemComment(params: { caseId: string, comment: string }): Promise<StellarCaseCommentDTO> {
  const res = await createComment(params);
  await LocalComments.insertOne({
    stellarCaseId: params.caseId,
    stellarCommentId: res._id,
    systemComment: true
  });
  return res;
}

export async function updateSeverity(params: { caseId: string, severity: StellarCaseSeverity }): Promise<StellarCaseDTO> {
  const { caseId, severity } = params;
  const server = getStellarServer();
  const { verifySSL, host } = server;
  const axios = getAxios(verifySSL);
  const url = getApiUrl(host, `cases/${caseId}`);
  const headers = await getHeaders(server);
  const data = { severity };
  return (await axios.put<StellarCaseResponseDTO>(url, data, { headers })).data.data;
}

export async function updateStatus(params: {
  caseId: string,
  status: StellarCaseStatus
}): Promise<StellarCaseDTO> {
  const { caseId, status } = params;
  const server = getStellarServer();
  const { verifySSL, host } = server;
  const axios = getAxios(verifySSL);
  const url = getApiUrl(host, `cases/${caseId}`);
  const headers = await getHeaders(server);
  const data = { status };
  return (await axios.put<StellarCaseResponseDTO>(url, data, { headers })).data.data;
}

export async function updateCaseTag(caseId: string, tag: string): Promise<StellarCaseDTO> {
  const server = getStellarServer();
  const { verifySSL, host } = server;
  const axios = getAxios(verifySSL);
  const url = getApiUrl(host, `cases/${caseId}`);
  const headers = await getHeaders(server);
  const data = {
    tags: {
      add: [tag]
    }
  };
  return (await axios.put<StellarCaseResponseDTO>(url, data, { headers })).data.data;
}

// export async function update(params: {
//   caseId: string,
//   comment?: string,
//   status?: string,
//   updateTag?: boolean
// }) {
//   const {
//     caseId,
//     comment,
//     status = StellarCaseStatus.InProgress,
//     updateTag = true
//   } = params;
//   const { STELLAR_CASE_TAG } = getConf();
//   if (comment) {
//     await createComment({ caseId, comment });
//   }
//   if (status) {
//     const isValidCaseStatus = isStellarCaseStatus(status);
//     const sts = isValidCaseStatus
//       ? status
//       : StellarCaseStatus.InProgress;
//     await updateStatus(caseId, sts);
//   }
//   if (updateTag) {
//     await updateCaseTag(caseId, STELLAR_CASE_TAG);
//   }
// }
