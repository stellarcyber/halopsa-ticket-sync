import { HALOPSA_TO_STELLAR_DEFAULT_PRIORITY_MAP } from ':constants';
import convict from 'convict';
import formatWithValidator from 'convict-format-with-validator';

convict.addFormats(formatWithValidator);
convict.addFormat({
  name: 'optional-number',
  validate(val) {
    if (val !== undefined && val !== null && val !== '') {
      if (isNaN(Number(val))) {
        throw new Error('must be a number or undefined');
      }
    }
  },
  coerce(val) {
    if (val === undefined || val === null || val === '') {
      return undefined;
    }
    return Number(val);
  }
});
const conf = convict({
  HALOPSA_BASE_URL: {
    format: String,
    env: 'HALOPSA_BASE_URL',
    default: null as unknown as string,
    doc: 'The base URL used to access your HaloPSA instance via a browser.  I.e. "https://stellardev.halopsa.com"'
  },
  HALOPSA_RESOURCE_SERVER_URL: {
    format: String,
    env: 'HALOPSA_RESOURCE_SERVER_URL',
    default: undefined as unknown as string,
    doc: 'The API endpoint of your HaloPSA instance.  I.e. "https://stellardev.halopsa.com/api".  If not specified, it will be derived from value set in HALOPSA_BASE_URL'
  },
  HALOPSA_AUTHORIZATION_SERVER_URL: {
    format: String,
    env: 'HALOPSA_AUTHORIZATION_SERVER_URL',
    default: undefined as unknown as string,
    doc: 'The authorization API endpoint of your HaloPSA instance.  I.e. "https://stellardev.halopsa.com/auth".  If not specified, it will be derived from value set in HALOPSA_BASE_URL'
  },
  HALOPSA_ASSIGN_USERNAME: {
    format: String,
    env: 'HALOPSA_ASSIGN_USERNAME',
    default: null as unknown as string,
    doc: 'The HaloPSA username to create tickets and actions (comments) under'
  },
  HALOPSA_TICKET_TYPE_NAME: {
    format: String,
    env: 'HALOPSA_TICKET_TYPE_NAME',
    default: undefined as unknown as string | undefined,
    doc: 'The HaloPSA ticket type to open tickets under.  E.e. "Incident"'
  },
  HALOPSA_TICKET_TYPE_ID: {
    format: 'optional-number',
    env: 'HALOPSA_TICKET_TYPE_ID',
    default: undefined as unknown as number,
    doc: 'Specify the unique ID of ticket type instead of HALOPSA_TICKET_TYPE_NAME.  Overrides HALOPSA_TICKET_TYPE_NAME'
  },
// TODO: is this supposed to be looked up?
  HALOPSA_CLIENT_NAME: {
    format: String,
    env: 'HALOPSA_CLIENT_NAME',
    default: undefined as unknown as string | undefined,
    doc: 'The HaloPSA client name'
  },
  HALOPSA_CLIENT_ID: {
    format: 'optional-number',
    env: 'HALOPSA_CLIENT_ID',
    default: undefined as unknown as number
  },
  HALOPSA_PRIORITY_ID: {
    format: Number,
    env: 'HALOPSA_PRIORITY_ID',
    default: null as unknown as number,
    doc: 'Sets the priority id for HaloPSA tickets.  I.e. "1"'
  },
  HALOPSA_SYNC_PRIORITY: {
    format: Boolean,
    env: 'HALOPSA_SYNC_PRIORITY',
    default: false,
    doc: 'If true, causes severity of HaloPSA tickets to be set in Stellar cases. Mapped by value of HALOPSA_TO_STELLAR_PRIORITY_MAP'
  },
  HALOPSA_TEAM_NAME: {
    format: String,
    env: 'HALOPSA_TEAM_NAME',
    default: undefined as unknown as string | undefined,
    doc: 'If defined, will assign this value as the ticket team value'
  },
  HALOPSA_CATEGORY_NAME: {
    format: String,
    env: 'HALOPSA_CATEGORY_NAME',
    default: null as unknown as string,
    doc: 'The category value to use for HaloPSA tickets.  I.e. "IT Security Threats>Investigations"'
  },
  HALOPSA_IMPACT_NAME: {
    format: String,
    env: 'HALOPSA_IMPACT_NAME',
    default: null as unknown as string,
    doc: 'The value to use for the HaloPSA impact.  I.e. "Company Wide"'
  },
  HALOPSA_IMPACT_ID: {
    format: 'optional-number',
    env: 'HALOPSA_IMPACT_ID',
    default: undefined as unknown as number,
    doc: 'Specify the unique ID of impact instead of HALOPSA_IMPACT_NAME.  Overrides HALOPSA_IMPACT_NAME'
  },
  HALOPSA_URGENCY_NAME: {
    format: String,
    env: 'HALOPSA_URGENCY_NAME',
    default: undefined as unknown as string | undefined,
    doc: 'The value to use for the HaloPSA urgency.  I.e. "High"'
  },
  HALOPSA_URGENCY_ID: {
    format: 'optional-number',
    env: 'HALOPSA_URGENCY_ID',
    default: undefined as unknown as number,
    doc: 'Specify the unique ID of urgency instead of HALOPSA_URGENCY_NAME.  Overrides HALOPSA_URGENCY_NAME'
  },
  HALOPSA_ADD_HALO_ASSIGNEE_TO_STELLAR_COMMENT: {
    format: Boolean,
    env: 'HALOPSA_ADD_HALO_ASSIGNEE_TO_STELLAR_COMMENT',
    default: false,
    doc: 'If true, the Stellar Case will have a comment added when assignee changes in HaloPSA'
  },
  HALOPSA_OIDC_CLIENT_ID: {
    format: String,
    env: 'HALOPSA_OIDC_CLIENT_ID',
    default: null as unknown as string,
    doc: 'HaloPSA Oauth client ID'
  },
  HALOPSA_OIDC_CLIENT_SECRET: {
    format: String,
    env: 'HALOPSA_OIDC_CLIENT_SECRET',
    default: null as unknown as string,
    sensitive: true,
    doc: 'HaloPSA Oauth client secret'
  },
  HALOPSA_OIDC_CLIENT_SCOPE: {
    format: String,
    env: 'HALOPSA_OIDC_CLIENT_SCOPE',
    default: 'all'
  },
  HALOPSA_USE_UPDATE_FOR_ACTION: {
    format: Boolean,
    env: 'HALOPSA_USE_UPDATE_FOR_ACTION',
    default: false
  },
  PORT: {
    format: Number,
    env: 'PORT',
    default: 3000
  },
  STELLAR_DB_HOST: {
    format: String,
    env: 'STELLAR_DB_HOST',
    default: null as unknown as string,
    doc: 'Hostname of Stellar Data Processor. I.e. "yourdomain.stellarcyber.cloud"'
  },
  STELLAR_USER: {
    format: String,
    env: 'STELLAR_USER',
    default: null as unknown as string,
    doc: 'Stellar API username'
  },
  STELLAR_API_KEY: {
    format: String,
    env: 'STELLAR_API_KEY',
    default: null as unknown as string,
    sensitive: true,
    doc: 'API token to access Stellar API.  Use legacy API tokens, not newer user-scoped API keys'
  },
  STELLAR_SAAS: {
    format: Boolean,
    env: 'STELLAR_SAAS',
    default: null as unknown as boolean,
    doc: 'Whether Stellar instance is a SAAS instance'
  },
  STELLAR_VERIFY_SSL: {
    format: Boolean,
    env: 'STELLAR_VERIFY_SSL',
    default: true,
    doc: 'Whether to verify SSL certificates for Stellar DP'
  },
  STELLAR_MIN_ALERT_COUNT: {
    format: 'optional-number',
    env: 'STELLAR_MIN_ALERT_COUNT',
    default: undefined as number | undefined
  },
  STELLAR_MIN_SCORE: {
    format: Number,
    env: 'STELLAR_MIN_SCORE',
    default: 0
  },
  STELLAR_INITIAL_LOOPBACK_DAYS: {
    format: Number,
    env: 'STELLAR_INITIAL_LOOPBACK_DAYS',
    default: 7
  },
  STELLAR_CASE_TAG: {
    format: String,
    env: 'STELLAR_CASE_TAG',
    default: 'ticket_opened'
  },
  STELLAR_USER_ID: {
    format: String,
    default: undefined as unknown as string // set during startup
  },
  STELLAR_TENANT_ID: {
    format: String,
    env: 'STELLAR_TENANT_ID',
    default: undefined as unknown as string // set during startup
  },
  SQLITE_FILENAME: {
    format: String,
    env: 'SQLITE_FILENAME',
    default: '/db/sqlite.db',
    doc: 'Filename used for sqlite DB.  Leave at default if running in Docker Compose'
  },
  INSTANCE_KEY: {
    format: String,
    env: 'INSTANCE_KEY',
    default: null as unknown as string,
    doc: 'A unique string identifier to identify this sync instance.  Future releases may allow multiple instance keys to be set'
  },
  POLL_INTERVAL_MINS: {
    format: Number,
    env: 'POLL_INTERVAL_MINS',
    default: 5,
    doc: 'How frequequently, in minutes, will the syncer poll Stellar Cyber and HaloPSA for new cases and comments'
  },
  DEBUG_DB: {
    format: Boolean,
    env: 'DEBUG_DB',
    default: false,
    doc: 'Used only for troubleshooting'
  },
  WIPE_DB_ON_STARTUP: {
    format: Boolean,
    env: 'WIPE_DB_ON_STARTUP',
    default: false,
    doc: 'Will cause the entire database to be wiped on startup, resulting in re-fetching / recreation of all cases.  Used only for debugging / troubleshooting.  Do not use in production'
  },
  // halopsa_to_stellar_priority_map: {
  HALOPSA_TO_STELLAR_PRIORITY_MAP: {
    doc: `Mapping of HaloPSA priorities to Stellar case severities.  Defaults to:\n\n ${JSON.stringify(HALOPSA_TO_STELLAR_DEFAULT_PRIORITY_MAP, null, 1)}`,
    format: Object,
    default: HALOPSA_TO_STELLAR_DEFAULT_PRIORITY_MAP as Record<string, string>,
    env: 'HALOPSA_TO_STELLAR_PRIORITY_MAP',
    coerce(val: unknown) {
      // If it's already an object, return as-is
      if (typeof val === 'object' && val !== null) {
        return val;
      }
      // If it's a string (from env var), parse as JSON
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        }
        catch (err: any) {
          throw new Error(`Invalid JSON in HALOPSA_TO_STELLAR_PRIORITY_MAP: ${err.message}`);
        }
      }
      // Fallback to default
      return HALOPSA_TO_STELLAR_DEFAULT_PRIORITY_MAP;
    }
  },
  PROCESS_CASES_PAGE_SIZE: {
    format: Number,
    env: 'PROCESS_CASES_PAGE_SIZE',
    default: 250,
    doc: 'Comments / actions are written via a queue with a high watermark.  Defines the maximum number of Stellar Cases that can be synced simultaneously in the comment cycle'
  },
  HALOPSA_USE_BETA_AUTO_INCREMENTING_TICKET_IDS: {
    format: Boolean,
    env: 'HALOPSA_USE_BETA_AUTO_INCREMENTING_TICKET_IDS',
    default: false,
    doc: 'If true,  will cause HaloPSA tickets to be created in parallel rather than serially.  Requires "Next Ticket ID Calculation Method" first be set to "Auto-incrementing key" in Configuration -> Advanced Settings -> Tickets'
  }
});
conf.validate({ allowed: 'strict' });
const {
  HALOPSA_AUTHORIZATION_SERVER_URL,
  HALOPSA_BASE_URL,
  HALOPSA_RESOURCE_SERVER_URL
} = conf.get();
const haloBaseURL = new URL(HALOPSA_BASE_URL);
if (!HALOPSA_RESOURCE_SERVER_URL) {
  conf.set('HALOPSA_RESOURCE_SERVER_URL', `${haloBaseURL.origin}/api`);
}
if (!HALOPSA_AUTHORIZATION_SERVER_URL) {
  conf.set('HALOPSA_AUTHORIZATION_SERVER_URL', `${haloBaseURL.origin}/auth`);
}
export const getConf = () => conf.get();
export const getSchema = () => conf.getSchema()._cvtProperties;
export type ServerConfig = ReturnType<typeof getConf>;
export type ServerConfigKey = keyof ServerConfig;
export const getProperties = () => conf.toString();
export const setConf = (key: keyof ServerConfig, value: any) => conf.set(key, value);
