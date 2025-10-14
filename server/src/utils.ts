import {
  ClassConstructor,
  instanceToPlain,
  plainToInstance
} from 'class-transformer';
import { ValidatorOptions, validateOrReject } from 'class-validator';
import { Agent } from 'node:https';
import axios, { AxiosInstance, AxiosStatic } from 'axios';
import { inspect } from 'node:util';
import {
  HaloPsaActionDTO,
  StellarCaseCommentDTO,
  StellarServerDTO
} from ':dto';
import {
  ServerConfigKey,
  getConf,
  setConf
} from ':config';
import { log } from './logger.js';

export { log } from './logger.js';
export * from './express-utils.js';

const httpsAgent = new Agent({
  rejectUnauthorized: false
});

const axiosNoVerify = axios.create({ httpsAgent });

export function getApiUrl(host: string, apiPath: string): string {
  const path = apiPath.startsWith('/')
    ? apiPath.substring(1)
    : apiPath;
  return `https://${host}/connect/api/v1/${path}`;
}

export function getDataUrl(host: string, apiPath: string): string {
  const path = apiPath.startsWith('/')
    ? apiPath.substring(1)
    : apiPath;
  return `https://${host}/connect/api/data/${path}`;
}

export function getHaloPsaApiUrl(apiPath: string): string {
  const { HALOPSA_RESOURCE_SERVER_URL: RESOURCE_SERVER_URL } = getConf();
  const path = apiPath.startsWith('/')
    ? apiPath.substring(1)
    : apiPath;
  return `${RESOURCE_SERVER_URL}/${path}`;
}

export const validateDto = async <T>(dto: ClassConstructor<T>, pojo: unknown, options?: ValidatorOptions): Promise<T> => {
  const instance = plainToInstance(dto, pojo);
  await validateOrReject(instance as object, options);
  return instanceToPlain<T>(instance) as T;
};

export const getAxios = (verifySSL: boolean): AxiosStatic | AxiosInstance => (verifySSL
  ? axios
  : axiosNoVerify);

export function inspectPrint(value: unknown, depth = 10): void {
  console.log(
    inspect(value, true, depth, false)
  );
}

export const pformat = (json: Record<string, unknown> | unknown[], indent = 2): string => JSON.stringify(json, null, indent);

export const pprint = (json: Record<string, unknown> | unknown[]): void => console.log(pformat(json));

export const sumArray = (array: number[]): number => {
  let sum = 0;
  array.forEach(
    (number: number) => {
      sum += number;
    }
  );
  return sum;
};

// from https://stackoverflow.com/questions/54801835/type-safe-predicate-functions-in-typescript
type Diff<T, U> = T extends U ? never : T;

type Predicate<I, O extends I> = (i: I) => i is O;

const not = <I, O extends I>(p: Predicate<I, O>) =>
  (i: I): i is (Diff<I, O>) => !p(i);

export const isUndefined = <I>(i: I | undefined): i is undefined => i === undefined;

const nullableSet = new Set<unknown>([null, undefined]);

export const isNullable = <I>(i: I | null | undefined): i is null | undefined => nullableSet.has(i);

export const isDefined = not(isUndefined);

export const isNonNullable = not(isNullable);

export const isTruthy = (value: unknown): boolean => !!value;

export const isFalsy = (value: unknown): boolean => !value;

export function assertIsNonNullable<T>(value?: T, error?: Error): asserts value is NonNullable<T> {
  if (nullableSet.has(value as unknown as any)) {
    throw error ?? new Error('Value is undefined');
  }
}

export function assertIsNullable(value: unknown, error?: Error): asserts value is null | undefined {
  if (!nullableSet.has(value)) {
    throw error ?? new Error('Value is defined');
  }
}

export const unique = <T>(arr: T[]): T[] => [...new Set(arr)];

export type PollFunction = () => Promise<boolean>;

export async function poll(maxTries: number, intervalMs: number, pollFunction: PollFunction): Promise<void> {
  let interval: NodeJS.Timeout;
  return new Promise<void>(
    (resolve, reject) => {
      let i = 0;
      interval = setInterval(
        async () => {
          try {
            const res = await pollFunction();
            if (res) {
              clearInterval(interval);
              resolve();
              return;
            }
            if (++i > maxTries) {
              clearInterval(interval);
              reject(new Error('Max attempts exceeded'));
            }
          }
          catch (err: any) {
            clearInterval(interval);
            reject(err);
          }
        },
        intervalMs
      );
    }
  );
}

export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

export function getStellarServer(): StellarServerDTO {
  const {
    STELLAR_API_KEY: apiKey,
    STELLAR_DB_HOST: host,
    STELLAR_USER: user,
    STELLAR_VERIFY_SSL: verifySSL
  } = getConf();
  return {
    host,
    apiKey,
    user,
    verifySSL
  };
}

export async function testOrDie(cb: () => any, errMsg: string, exitCode = 1) {
  try {
    await cb();
  }
  catch (err: any) {
    log.error(errMsg);
    log.error(err);
    process.exit(exitCode);
  }
}

export function makeStellarUrl(eventIndex: string, eventId: string) {
  const { STELLAR_SAAS, STELLAR_DB_HOST } = getConf();
  return STELLAR_SAAS
    ? `https://${STELLAR_DB_HOST}/alerts/alert/${eventIndex}/_doc/${eventId}`
    : `https://${STELLAR_DB_HOST}/detect/event/${eventIndex}/amsg/${eventId}`;
}

export async function testNameOrId(
  nameConfigKey: ServerConfigKey,
  idConfigKey: ServerConfigKey,
  lookupFunc: () => Promise<any>,
  errorValueType: string
): Promise<void> {
  const nameValue = getConf()[nameConfigKey];
  const idValue = getConf()[idConfigKey];
  const values = await lookupFunc();
  if (nameValue) {
    const lookup = values.find(
      ({ name }: any) => name === nameValue
    );
    await testOrDie(
      () => {
        assertIsNonNullable(lookup);
      },
      `HaloPSA ${errorValueType} value ${nameValue} could not be found`
    );
    setConf(idConfigKey, lookup.id);
  }
  else if (idValue) {
    const lookup = values.find(
      ({ id }: any) => id === idValue
    );
    await testOrDie(
      () => {
        assertIsNonNullable(lookup);
      },
      `HaloPSA ${errorValueType} id ${idValue} could not be found`
    );
  }
  else {
    await testOrDie(
      () => {
        throw new Error();
      },
      `One of env vars "${nameConfigKey}" or "${idConfigKey}" must be provided`
    );
  }
}

export function getScrollQuery(scrollId: number): string {
  return JSON.stringify({
    scroll: '1m',
    scroll_id: scrollId
  });
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = () => {};

export async function sleep(ms: number) {
  await new Promise<void>(
    (resolve) => setTimeout(
      () => {
        resolve();
      },
      ms
    )
  );
}

export function getStellarCaseUrl(caseId: string) {
  const { STELLAR_DB_HOST } = getConf();
  return `https://${STELLAR_DB_HOST}/cases/case-detail/${caseId}`;
}

export function stringToInt(numberString: string) {
  return parseInt(numberString, 10);
}

export function stringToArray(str: string, separator = '\n'): string[] {
  return str.split(separator);
}

export function dateStringToEpochMS(dateStr: string) {
  return new Date(dateStr).getTime();
}

export function sortStellarCaseCommentsByTimeAsc(a: StellarCaseCommentDTO, b: StellarCaseCommentDTO) {
  if (a.created_at < b.created_at) {
    return -1;
  }
  if (a.created_at > b.created_at) {
    return 1;
  }
  return 0;
}

export function sortHaloPsaActionsByTimeAsc(a: HaloPsaActionDTO, b: HaloPsaActionDTO) {
  if (a.datetime < b.datetime) {
    return -1;
  }
  if (a.datetime > b.datetime) {
    return 1;
  }
  return 0;
}

export function epochToISOString(epoch: number): string {
  return new Date(epoch).toISOString();
}

/**
 * 
 * @param arrA array
 * @param arrB array
 * @returns New array containing elements which are present in both arrays
 */
export const arrayIntersection = <T>(arrA: T[], arrB: T[]): T[] => {
  const arrBSet = new Set(arrB);
  return arrA.filter(
    (property) => arrBSet.has(property)
  );
};

/**
 * 
 * @param arrA array
 * @param arrB array
 * @returns New array containing elements of arrA which are not present in arrB
 */
export const singleArrayNonIntersection = <T>(arrA: T[], arrB: T[]): T[] => {
  const arrBSet = new Set(arrB);
  return arrA.filter(
    (property) => !arrBSet.has(property)
  );
};

/**
 * 
 * @param arrA array
 * @param arrB array
 * @returns New array containing elements of each array which are not present in the other array
 */
export const arrayNonIntersection = <T>(arrA: T[], arrB: T[]): T[] => {
  const arrASet = new Set(arrA);
  const arrBSet = new Set(arrB);
  const retSet = new Set([
    ...arrA.filter(
      (property) => !arrBSet.has(property)
    ),
    ...arrB.filter(
      (property) => !arrASet.has(property)
    )
  ]);
  return [...retSet];
};

export const doArraysIntersect = (arrA: any[], arrB: any[]): boolean => {
  const arrBSet = new Set(arrB);
  return arrA.some(
    (property) => arrBSet.has(property)
  );
};

export function arrayShiftN<T>(array: T[], n: number): T[] | undefined {
  return array.splice(0, n);
}
