/* 
{
  "ticket_id": "2818",
  "outcome_id": "7",
  "new_matched_rule_id": 1,
  "new_rule_ids": "1",
  "files": null,
  "smsto": "",
  "appointment_complete_status": 0,
  "sendemail": false,
  "sendsms": false,
  "_sendtweet": false,
  "send_to_facebook": false,
  "send_to_instagram": false,
  "send_to_whatsapp": false,
  "send_to_googlebusiness": false,
  "hiddenfromuser": true,
  "important": false,
  "follow": false,
  "send_survey": false,
  "actioncalendarstatus": 0,
  "new_status": "2",
  "new_slastatus": -1,
  "chargerate": 0,
  "run_ai_insights": false,
  "sync_to_halo_api": 0,
  "action_showpreview": true,
  "action_showkbpreview": false,
  "timetaken": 0.008530277777777779,
  "timerinuse": true,
  "_ignore_ai": false,
  "travel_chargerate": 0,
  "note_html": "<p>Another note</p>",
  "emailto": null,
  "emailcc": null,
  "emailbcc": null,
  "emailsubject": null,
  "utcoffset": 240,
  "itsm_summary": "Sample case dated Fri, 29 Aug 2025 21:12:38 GMT",
  "dont_do_rules": true,
  "attachments": [],
  "_validate_travel": true
}
*/

import { assertIsNonNullable, getHaloPsaApiUrl } from ':utils';
import { HaloPsaAuth } from './index.js';
import { axiosHaloPsa } from ':app/axios-smart-retry.js';
import {
  HaloPsaActionCreateDTO,
  HaloPsaActionDTO,
  HaloPsaActionUpdateDTO
} from ':dto';

export async function createOne(params: {
  ticketId: number,
  note?: string,
  noteHtml?: string,
  who: string
}): Promise<HaloPsaActionDTO> {
  const {
    ticketId,
    note,
    noteHtml,
    who
  } = params;
  assertIsNonNullable(note ?? noteHtml, new Error('Either note or noteHtml is required'));
  const url = getHaloPsaApiUrl('/Actions');
  const headers = await HaloPsaAuth.getHeaders();
  const data: HaloPsaActionCreateDTO[] = [{
    note,
    ticket_id: ticketId,
    who,
    note_html: noteHtml,
    outcome: 'Internal Note'
  }];
  return (await axiosHaloPsa.post<HaloPsaActionDTO>(url, data, { headers })).data;
}

// returns only the last action
export async function createMany(params: {
  ticketId: number,
  note?: string,
  noteHtml?: string,
  who: string
}[]): Promise<HaloPsaActionDTO[]> {
  for (const { note, noteHtml } of params) {
    assertIsNonNullable(note ?? noteHtml, new Error('Either note or noteHtml is required'));
  }
  const url = getHaloPsaApiUrl('/Actions?returnall=true');
  const headers = await HaloPsaAuth.getHeaders();
  const data: HaloPsaActionCreateDTO[] = params.map(
    ({
      note,
      ticketId,
      who,
      noteHtml
    }) => ({
      ticket_id: ticketId,
      note,
      note_html: noteHtml,
      outcome: 'Internal Note',
      who
    })
  );
  return (await axiosHaloPsa.post(url, data, { headers })).data;
}

export async function getTicketActions(ticketId: number): Promise<HaloPsaActionDTO[]> {
  const url = getHaloPsaApiUrl(`/Actions?ticket_id=${ticketId}&note_html=true`);
  const headers = await HaloPsaAuth.getHeaders();
  return (await axiosHaloPsa.get(url, { headers })).data.actions;
}

export async function update(params: {
  ticketId: number,
  actionId: number,
  noteHtml?: string,
  note?: string,
  who: string
}): Promise<HaloPsaActionDTO> {
  const {
    ticketId,
    actionId,
    note,
    noteHtml,
    who
  } = params;
  assertIsNonNullable(note ?? noteHtml, new Error('Either note or noteHtml is required'));
  const url = getHaloPsaApiUrl('/Actions');
  const headers = await HaloPsaAuth.getHeaders();
  const data: HaloPsaActionUpdateDTO = {
    ticket_id: ticketId,
    id: actionId,
    note_html: noteHtml,
    note,
    outcome: 'Internal Note',
    who
  };
  return (await axiosHaloPsa.post<HaloPsaActionDTO>(url, data, { headers })).data;
}
