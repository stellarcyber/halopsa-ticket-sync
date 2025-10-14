import { db } from ':app/sqlite.js';
import { SQL } from 'sql-template-strings';
import { TicketDTO, TicketLinkageDTO } from ':dto';
import { assertIsNonNullable } from ':utils';
import { getConf } from ':config';
import { LocalComments } from './index.js';

const { INSTANCE_KEY } = getConf();

export async function insertTicketLinkage(params: {
  stellarCaseId: string,
  stellarCaseNumber: number,
  remoteTicketId: number,
  stellarLastModified?: number,
  remoteTicketLastModified?: number,
  state?: string
}): Promise<TicketDTO> {
  const { STELLAR_TENANT_ID } = getConf();
  const now = Date.now();
  const {
    stellarCaseId,
    stellarCaseNumber,
    remoteTicketId,
    stellarLastModified = now,
    remoteTicketLastModified = now,
    state = 'new'
  } = params;
  const sql = SQL`
    INSERT INTO tickets
      (stellar_case_id, stellar_case_number, remote_ticket_id, stellar_tenant_id, stellar_last_modified, remote_ticket_last_modified, state, ts, instance_key)
      VALUES(${stellarCaseId}, ${stellarCaseNumber}, ${remoteTicketId}, ${STELLAR_TENANT_ID}, ${stellarLastModified}, ${remoteTicketLastModified}, ${state}, ${now}, ${INSTANCE_KEY})
      RETURNING *;
  `;
  return await db.get(sql) as TicketDTO;
}

export async function getTicketLinkageByStellarCaseId(stellarCaseId: string): Promise<TicketLinkageDTO> {
  const sql = `
    SELECT stellar_case_id, stellar_case_number, remote_ticket_id
      FROM tickets WHERE stellar_case_id = ? AND instance_key = ?;
  `;
  const res = await db.get<TicketDTO>(sql, stellarCaseId, INSTANCE_KEY);
  assertIsNonNullable(res);
  return res;
}

export async function getTicketLinkageByStellarCaseNumber(stellarCaseNumber: string): Promise<TicketLinkageDTO> {
  const sql = `
    SELECT stellar_case_id, stellar_case_number, remote_ticket_id
      FROM tickets WHERE stellar_case_number = ? AND instance_key = ?;
  `;
  const res = await db.get<TicketDTO>(sql, stellarCaseNumber, INSTANCE_KEY);
  assertIsNonNullable(res);
  return res;
}

export async function getTicketLinkageByRemoteTicketId(remoteTicketId: number): Promise<TicketLinkageDTO> {
  const sql = `
    SELECT stellar_case_id, stellar_case_number, remote_ticket_id
      FROM tickets WHERE remote_ticket_id = ? AND instance_key = ?;
  `;
  const res = await db.get<TicketDTO>(sql, remoteTicketId, INSTANCE_KEY);
  assertIsNonNullable(res);
  return res;
}

export async function getOpenTickets(): Promise<TicketDTO[]> {
  const sql = SQL`SELECT stellar_case_id, stellar_case_number, stellar_tenant_id, stellar_last_modified, remote_ticket_id, remote_ticket_last_modified, state, ts FROM tickets WHERE state != "closed" AND instance_key = ${INSTANCE_KEY} ORDER BY ts asc;`;
  return await db.all<TicketDTO[]>(sql);
}

export async function getTickets(): Promise<TicketDTO[]> {
  const sql = SQL`SELECT stellar_case_id, stellar_case_number, stellar_tenant_id, stellar_last_modified, remote_ticket_id, remote_ticket_last_modified, state, ts FROM tickets WHERE instance_key = ${INSTANCE_KEY} ORDER BY ts asc;`;
  return await db.all<TicketDTO[]>(sql);
}

export async function closeTicketLinkage(stellarCaseId: string): Promise<void> {
  const now = Date.now();
  const sql = SQL`UPDATE tickets SET state = "closed", ts = ${now} WHERE stellar_case_id = ${stellarCaseId} AND instance_key = ${INSTANCE_KEY};`;
  await db.run(sql);
  await LocalComments.deleteByCaseId(stellarCaseId);
}

export async function updateTicketTimestamps(params: {
  stellarCaseId: string,
  stellarCaseLastModified?: number
  remoteTicketTimestamp?: number
}): Promise<void> {
  const now = Date.now();
  const {
    stellarCaseId,
    remoteTicketTimestamp = now,
    stellarCaseLastModified = now
  } = params;
  const sql = SQL`UPDATE tickets SET stellar_last_modified = ${stellarCaseLastModified}, remote_ticket_last_modified = ${remoteTicketTimestamp}, ts = ${now} WHERE stellar_case_id = ${stellarCaseId} AND instance_key = ${INSTANCE_KEY};`;
  await db.run(sql);
}

export async function updateRemoteTicketTimestamp(params: {
  stellarCaseId: string,
  remoteTicketTimestamp?: number
}): Promise<void> {
  const now = Date.now();
  const { stellarCaseId, remoteTicketTimestamp = now } = params;
  const sql = SQL`UPDATE tickets SET remote_ticket_last_modified = ${remoteTicketTimestamp}, ts = ${now} WHERE stellar_case_id = ${stellarCaseId} AND instance_key = ${INSTANCE_KEY};`;
  await db.run(sql);
}

export async function updateStellarCaseLastModified(params: {
  stellarCaseId: string,
  stellarCaseLastModified?: number
}): Promise<void> {
  const now = Date.now();
  const { stellarCaseId, stellarCaseLastModified = now } = params;
  const sql = SQL`UPDATE tickets SET stellar_last_modified = ${stellarCaseLastModified}, ts = ${now} WHERE stellar_case_id = ${stellarCaseId} AND instance_key = ${INSTANCE_KEY};`;
  await db.run(sql);
}

export async function deleteAll(): Promise<void> {
  const sql = SQL`DELETE from tickets WHERE instance_key = ${INSTANCE_KEY};`;
  await db.run(sql);
}
