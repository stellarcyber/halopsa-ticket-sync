import {
  getApiUrl,
  getAxios,
  getScrollQuery,
  getStellarServer,
  log
} from ':utils';
import { getHeaders } from './stellar-auth.data.js';
import { getConf } from ':config';
import { MS_IN_SECOND, SECONDS_IN_DAY } from ':constants';
import { LocalCheckpoint } from '../localdb/index.js';

export async function createComment(params: {
  index: string,
  id: string,
  comment: string,
}): Promise<void> {
  const {
    index,
    id,
    comment
  } = params;
  const server = getStellarServer();
  const { verifySSL, host } = server;
  const axios = getAxios(verifySSL);
  const url = getApiUrl(host, `security_events/${index}/${id}`);
  const headers = await getHeaders(server);
  const data = {
    comments: comment
  };
  await axios.post(url, data, { headers });
}

export async function updateStatus(params: {
  index: string,
  id: string,
  status?: string,
  comment?: string,
}): Promise<void> {
  const {
    index,
    id,
    comment,
    status = 'Closed'
  } = params;
  const server = getStellarServer();
  const { verifySSL, host } = server;
  const axios = getAxios(verifySSL);
  const url = getApiUrl(host, `security_events/${index}/${id}`);
  const headers = await getHeaders(server);
  const data: any = {
    status
  };
  if (comment) {
    data.comments = comment;
  }
  await axios.post(url, data, { headers });
}

// eslint-disable-next-line max-statements, complexity
export async function getSecurityAlerts(params: {
  fromTimestamp?: number,
  secondsAgo: number,
  useCheckpoint: boolean,
  query?: string
}) {
  const { STELLAR_TENANT_ID, STELLAR_INITIAL_LOOPBACK_DAYS } = getConf();
  const {
    query,
    secondsAgo = 0,
    useCheckpoint
  } = params;
  let { fromTimestamp = 0 } = params;
  let hitsTotal = 0;
  let hitsReturned = 0;
  let timeAgoMS: number | undefined;
  let daysAgoMS: number | undefined;
  let ret: any[] = [];
  let path = '/connect/api/data/aella-ser-*/_search?scroll=10m&size=100&q=';
  const scroll_path = '/connect/api/data/_search/scroll';
  if (useCheckpoint) {
    fromTimestamp = await LocalCheckpoint.get() ?? 0;
  }
  if (fromTimestamp) {
    // do nothing
  }
  else if (secondsAgo) {
    timeAgoMS = secondsAgo * MS_IN_SECOND;
    fromTimestamp = Date.now() - timeAgoMS;
  }
  else {
    daysAgoMS = SECONDS_IN_DAY * STELLAR_INITIAL_LOOPBACK_DAYS * MS_IN_SECOND;
    fromTimestamp = Date.now() - daysAgoMS;
  }
  path += `(write_time:>${fromTimestamp}`;
  if (STELLAR_TENANT_ID) {
    path += ` AND tenantid:${STELLAR_TENANT_ID}`;
  }
  if (query) {
    path += ` AND ${query}`;
  }
  path += ')';
  try {
    const server = getStellarServer();
    const { verifySSL, host } = server;
    const axios = getAxios(verifySSL);
    const url = getApiUrl(host, path);
    const headers = await getHeaders(server);
    let r = (await axios.get(url, { headers })).data;
    hitsTotal = r?.hits?.total?.value ?? 0;
    ret = r?.hits?.hits ?? [];
    hitsReturned = ret.length;
    const scroll_id = r?._scroll_id ?? 0;
    const scroll_query = getScrollQuery(scroll_id);
    while (hitsReturned < hitsTotal) {
      const u = getApiUrl(host, scroll_path);
      r = axios.get(u, { headers, data: scroll_query });
      const rr = r?.hits?.hits ?? [];
      hitsReturned += rr.length;
      ret.push(...rr);
    }
    if (r && useCheckpoint) {
      await LocalCheckpoint.update();
    }
  }
  catch (err: any) {
    log.error('Problem running getSecurityAlerts:', err);
    throw err;
  }
  return { hits_total: hitsTotal, alerts: ret };
}
