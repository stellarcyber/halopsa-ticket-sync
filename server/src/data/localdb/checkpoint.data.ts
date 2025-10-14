import { db } from ':app/sqlite.js';
import { SQL } from 'sql-template-strings';
import { CheckpointDTO } from ':dto';
import { getConf } from ':config';

const { INSTANCE_KEY } = getConf();

export async function get(): Promise<number | undefined> {
  const sql = SQL`SELECT checkpoint from checkpoint WHERE instance_key = ${INSTANCE_KEY};`;
  const res = await db.get<CheckpointDTO>(sql);
  return res?.checkpoint;
}

export async function update(timestamp: number = Date.now()): Promise<void> {
  const sql = SQL`
    INSERT INTO checkpoint(instance_key, checkpoint) VALUES(${INSTANCE_KEY}, ${timestamp})
    ON CONFLICT(instance_key) DO UPDATE SET checkpoint = ${timestamp};
  `;
  await db.run(sql);
}

export async function remove(): Promise<void> {
  const sql = SQL`
    DELETE FROM checkpoint WHERE instance_key = ${INSTANCE_KEY};
  `;
  await db.run(sql);
}
