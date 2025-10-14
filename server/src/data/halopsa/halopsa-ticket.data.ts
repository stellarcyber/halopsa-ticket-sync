import { getConf } from ':config';
import { axiosHaloPsa } from ':app/axios-smart-retry.js';
import { HaloPsaAuth } from './index.js';
import { getHaloPsaApiUrl } from ':utils';
import { HaloPsaTicketCreateDto, HaloTicketDto } from ':dto';

function getDefaultQueryParams() {
  return {
    nocache: true,
    includeagent: true
  };
}

export async function getAll(): Promise<HaloTicketDto[]> {
  const url = getHaloPsaApiUrl('/Tickets');
  const headers = await HaloPsaAuth.getHeaders();
  const params = getDefaultQueryParams();
  return (await axiosHaloPsa.get(url, { headers, params })).data;
}

export async function getById(ticketId: number): Promise<HaloTicketDto> {
  const url = getHaloPsaApiUrl(`/Tickets/${ticketId}`);
  const headers = await HaloPsaAuth.getHeaders();
  const params = getDefaultQueryParams();
  return (await axiosHaloPsa.get(url, { headers, params })).data;
}

export async function createOne(ticketData: HaloPsaTicketCreateDto): Promise<HaloTicketDto> {
  const url = getHaloPsaApiUrl('/Tickets');
  const headers = await HaloPsaAuth.getHeaders();
  return (await axiosHaloPsa.post<HaloTicketDto>(url, [ticketData], { headers })).data;
}

export function createTicketData(params: {
  summary: string,
  details: string,
  // caseScore: string
}) {
  /*
    {
      "summary": "Issue title/subject",
      "details": "Description of the issue", 
      "users_name": "user@company.com",
      "tickettype_id": 1,
      "client_id": 1,
      "priority_id": 3,
      "category_1": "Hardware",
      "category_2": "Laptop",
      "site_id": 1,
      "team": "IT Support"
    }
  */
  const { details, summary } = params;
  const {
    HALOPSA_ASSIGN_USERNAME,
    HALOPSA_TICKET_TYPE_ID,
    HALOPSA_CLIENT_ID,
    HALOPSA_PRIORITY_ID,
    HALOPSA_TEAM_NAME,
    HALOPSA_CATEGORY_NAME,
    HALOPSA_IMPACT_ID,
    HALOPSA_URGENCY_ID
  } = getConf();
  return {
    details,
    summary,
    users_name: HALOPSA_ASSIGN_USERNAME,
    tickettype_id: HALOPSA_TICKET_TYPE_ID,
    client_id: HALOPSA_CLIENT_ID,
    priority_id: HALOPSA_PRIORITY_ID,
    team: HALOPSA_TEAM_NAME,
    category_1: HALOPSA_CATEGORY_NAME,
    impact: HALOPSA_IMPACT_ID,
    urgency: HALOPSA_URGENCY_ID
  };
}
