import { db } from ':app/sqlite.js';
import { SQL } from 'sql-template-strings';
import { getConf } from ':config';
import { LocalCommentDTO } from ':dto';

export interface CommentMap {
  stellarCommentId: string,
  halopsaActionId?: string;
  systemComment: boolean
}

const { INSTANCE_KEY } = getConf();

export async function getByCaseId(stellarCaseId: string): Promise<LocalCommentDTO[]> {
  const sql = SQL`
    SELECT * FROM comments
      WHERE instance_key = ${INSTANCE_KEY} and stellar_case_id = ${stellarCaseId};
  `;
  return await db.all<LocalCommentDTO[]>(sql);
}

export async function insertOne(params: {
  stellarCaseId: string,
  halopsaTicketId?: number,
  stellarCommentId: string,
  halopsaActionId?: number;
  systemComment: boolean
}): Promise<void> {
  const {
    stellarCaseId,
    stellarCommentId,
    halopsaTicketId,
    halopsaActionId,
    systemComment
  } = params;
  const sql = SQL`
    INSERT INTO comments
      (instance_key, stellar_case_id, halopsa_ticket_id, stellar_comment_id, halopsa_action_id, system_comment)
      VALUES(${INSTANCE_KEY}, ${stellarCaseId}, ${halopsaTicketId}, ${stellarCommentId}, ${halopsaActionId}, ${systemComment});
  `;
  await db.run(sql);
}

export async function insertManyByCaseId(params: {
  stellarCaseId: string,
  halopsaTicketId?: number,
  commentMap: CommentMap[]
}): Promise<void> {
  const {
    stellarCaseId,
    halopsaTicketId,
    commentMap
  } = params;
  if (!commentMap.length) {
    return;
  }
  const values = commentMap.map(
    ({
      stellarCommentId,
      halopsaActionId,
      systemComment
    }) => 
      `(${INSTANCE_KEY}, ${stellarCaseId}, ${halopsaTicketId}, ${stellarCommentId}, ${halopsaActionId}, ${systemComment})`
  ).join(', ');
  const sql = SQL`
    INSERT INTO comments
      (instance_key, stellar_case_id, halopsa_ticket_id, stellar_comment_id, halopsa_action_id, system_comment)
      VALUES ${values};
  `;
  await db.run(sql);
}

export async function deleteByCaseId(stellarCaseId: string): Promise<void> {
  const sql = SQL`
    DELETE FROM comments
      WHERE instance_key = ${INSTANCE_KEY} and stellar_case_id = ${stellarCaseId};
  `;
  await db.run(sql);
}

// export async function getByCaseId(stellarCaseId: string): Promise<string[]> {
//   const sql = SQL`
//     SELECT stellar_comment_id FROM comments
//       WHERE instance_key = ${INSTANCE_KEY} and stellar_case_id = ${stellarCaseId};
//   `;
//   return (await db.all<LocalCommentDTO[]>(sql)).map(
//     ({ stellar_comment_id }) => stellar_comment_id
//   );
// }

// export async function getByCaseIdAsSet(stellarCaseId: string): Promise<Set<string>> {
//   const res = await getByCaseId(stellarCaseId);
//   return new Set(res);
// }
