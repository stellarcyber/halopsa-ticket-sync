# HaloPSA Ticket Sync for Stellar Cyber
Containerized version of the Sync service between Stellar Cases and Halo PSA tickets

There is one important file associated with the Sync service that is contained in this repository:

- config.env:
  * credentials (users / api keys) need to query the Stellar Cyber instance and the Jira projects
  * other important configuration directives

## Directions:

1. Clone this project on a target machine running docker
   
    `git clone https://github.com/stellarcyber/halopsa-ticket-sync.git`

2. Navigate to the cloned repo and build the docker image
   
    `docker build -t halopsa:latest .`

3. Create a directory on the docker machine that will contain the db using for ticket tracking and timestamps. This directory will be bind mounted to the container at runtime.

   `mkdir /some/db/directory`

4. Create a highly protected directory to store the environmental variables that contain all the credentials and configuration directives needed for the service.

   `mkdir /some/protected/directory`

5. Copy the env template to the protected directory and edit (see the following section for variables and their explainations).

   `cp config.env /some/protected/directory/halo-sync.env`
   
   `vi /some/protected/directory/halo-sync.env`

7. Run the docker image using a bind mount to point to the db directory.
   Replace **/some/db/directory** with the local directory used in step 3.
   Replace **/some/protected/directory** with the path to the env file used in step 4/5.

   ``docker run --restart unless-stopped -d --mount type=bind,source=/some/db/directory,target=/db --env-file /some/protected/directory/halo-sync.env halopsa:latest``


## Environment Config Schema

The below outlines all configuration options available for syncing between **HaloPSA** and **Stellar Cyber**.  
Each setting can be provided via environment variables. Sensitive values are marked accordingly.

---

## HaloPSA Configuration

| Key | Env | Format | Default | Description |
|-----|-----|--------|---------|-------------|
| **HALOPSA_BASE_URL** | `HALOPSA_BASE_URL` | string | — | Base URL of your HaloPSA instance (e.g., `https://yourdomain.halopsa.com`). |
| **HALOPSA_RESOURCE_SERVER_URL** | `HALOPSA_RESOURCE_SERVER_URL` | string | derived from `HALOPSA_BASE_URL` | API endpoint for HaloPSA (e.g., `https://yourdomain.halopsa.com/api`). |
| **HALOPSA_AUTHORIZATION_SERVER_URL** | `HALOPSA_AUTHORIZATION_SERVER_URL` | string | derived from `HALOPSA_BASE_URL` | Authorization endpoint for HaloPSA (e.g., `https://yourdomain.halopsa.com/auth`). |
| **HALOPSA_ASSIGN_USERNAME** | `HALOPSA_ASSIGN_USERNAME` | string | — | Username under which tickets and actions will be created. |
| **HALOPSA_TICKET_TYPE_NAME** | `HALOPSA_TICKET_TYPE_NAME` | string | — | Ticket type name (e.g., `"Incident"`). |
| **HALOPSA_TICKET_TYPE_ID** | `HALOPSA_TICKET_TYPE_ID` | optional-number | — | Ticket type ID (overrides `HALOPSA_TICKET_TYPE_NAME`). |
| **HALOPSA_CLIENT_NAME** | `HALOPSA_CLIENT_NAME` | string | — | Name of the HaloPSA client. |
| **HALOPSA_CLIENT_ID** | `HALOPSA_CLIENT_ID` | optional-number | — | Unique client ID (overrides `HALOPSA_CLIENT_NAME`). |
| **HALOPSA_PRIORITY_ID** | `HALOPSA_PRIORITY_ID` | number | — | Default priority ID (e.g., `1`). |
| **HALOPSA_SYNC_PRIORITY** | `HALOPSA_SYNC_PRIORITY` | boolean | false | If true, maps HaloPSA ticket severity to Stellar cases using `HALOPSA_TO_STELLAR_PRIORITY_MAP`. |
| **HALOPSA_TEAM_NAME** | `HALOPSA_TEAM_NAME` | string | — | Team name assigned to tickets. |
| **HALOPSA_CATEGORY_NAME** | `HALOPSA_CATEGORY_NAME` | string | — | Ticket category (e.g., `"IT Security Threats>Investigations"`). |
| **HALOPSA_IMPACT_NAME** | `HALOPSA_IMPACT_NAME` | string | — | Impact value (e.g., `"Company Wide"`). |
| **HALOPSA_IMPACT_ID** | `HALOPSA_IMPACT_ID` | optional-number | — | Impact ID (overrides `HALOPSA_IMPACT_NAME`). |
| **HALOPSA_URGENCY_NAME** | `HALOPSA_URGENCY_NAME` | string | — | Urgency value (e.g., `"High"`). |
| **HALOPSA_URGENCY_ID** | `HALOPSA_URGENCY_ID` | optional-number | — | Urgency ID (overrides `HALOPSA_URGENCY_NAME`). |
| **HALOPSA_ADD_HALO_ASSIGNEE_TO_STELLAR_COMMENT** | `HALOPSA_ADD_HALO_ASSIGNEE_TO_STELLAR_COMMENT` | boolean | false | Adds a comment in Stellar when assignee changes in HaloPSA. |
| **HALOPSA_OIDC_CLIENT_ID** | `HALOPSA_OIDC_CLIENT_ID` | string | — | OAuth client ID for HaloPSA. |
| **HALOPSA_OIDC_CLIENT_SECRET** | `HALOPSA_OIDC_CLIENT_SECRET` | string (sensitive) | — | OAuth client secret for HaloPSA. |
| **HALOPSA_OIDC_CLIENT_SCOPE** | `HALOPSA_OIDC_CLIENT_SCOPE` | string | `all` | OAuth scope. |
| **HALOPSA_USE_UPDATE_FOR_ACTION** | `HALOPSA_USE_UPDATE_FOR_ACTION` | boolean | false | Uses update endpoint instead of action for ticket updates. |

---

## Stellar Cyber Configuration

| Key | Env | Format | Default | Description |
|-----|-----|--------|---------|-------------|
| **STELLAR_DB_HOST** | `STELLAR_DB_HOST` | string | — | Hostname of Stellar Data Processor (e.g., `yourdomain.stellarcyber.cloud`). |
| **STELLAR_USER** | `STELLAR_USER` | string | — | API username for Stellar. |
| **STELLAR_API_KEY** | `STELLAR_API_KEY` | string (sensitive) | — | API token for Stellar (use legacy API tokens, not user-scoped keys). |
| **STELLAR_SAAS** | `STELLAR_SAAS` | boolean | — | Marks instance as SaaS. |
| **STELLAR_VERIFY_SSL** | `STELLAR_VERIFY_SSL` | boolean | true | Verify SSL certificates for Stellar DP. |
| **STELLAR_MIN_ALERT_COUNT** | `STELLAR_MIN_ALERT_COUNT` | optional-number | — | Minimum number of alerts required. |
| **STELLAR_MIN_SCORE** | `STELLAR_MIN_SCORE` | number | 0 | Minimum score threshold for alerts. |
| **STELLAR_INITIAL_LOOPBACK_DAYS** | `STELLAR_INITIAL_LOOPBACK_DAYS` | number | 7 | Initial lookback window in days. |
| **STELLAR_CASE_TAG** | `STELLAR_CASE_TAG` | string | `ticket_opened` | Default case tag. |
| **STELLAR_USER_ID** | `STELLAR_USER_ID` | string | — | Stellar user ID. |
| **STELLAR_TENANT_ID** | `STELLAR_TENANT_ID` | string | — | Stellar tenant ID. |

---

## Database & Runtime

| Key | Env | Format | Default | Description |
|-----|-----|--------|---------|-------------|
| **SQLITE_FILENAME** | `SQLITE_FILENAME` | string | `/db/sqlite.db` | SQLite database file path (default used in Docker Compose). |
| **INSTANCE_KEY** | `INSTANCE_KEY` | string | — | Unique identifier for this sync instance. |
| **PORT** | `PORT` | number | 3000 | Port for the sync service. |
| **POLL_INTERVAL_MINS** | `POLL_INTERVAL_MINS` | number | 5 | Polling interval in minutes for syncing cases/comments. |
| **DEBUG_DB** | `DEBUG_DB` | boolean | false | Enables database debugging. |
| **WIPE_DB_ON_STARTUP** | `WIPE_DB_ON_STARTUP` | boolean | false | Wipes database on startup (for troubleshooting only). |

---

## Priority Mapping

| Key | Env | Format | Default | Description |
|-----|-----|--------|---------|-------------|
| **HALOPSA_TO_STELLAR_PRIORITY_MAP** | `HALOPSA_TO_STELLAR_PRIORITY_MAP` | object | `{ "Critical": "Critical", "High": "High", "Medium": "Medium", "Low": "Low" }` | Mapping of HaloPSA priorities to Stellar severities. |

---

## Processing

| Key | Env | Format | Default | Description |
|-----|-----|--------|---------|-------------|
| **PROCESS_CASES_PAGE_SIZE** | `PROCESS_CASES_PAGE_SIZE` | number | 250 | Max number of cases processed in a sync cycle. |

---

## Example Configuration

```env
HALOPSA_BASE_URL=https://<your_halo_domain>.halopsa.com
HALOPSA_ASSIGN_USERNAME=
HALOPSA_TICKET_TYPE_NAME=Incident
HALOPSA_CLIENT_NAME=Stellar Cyber
HALOPSA_CATEGORY_NAME=
HALOPSA_PRIORITY_ID=1
HALOPSA_SYNC_PRIORITY=true
HALOPSA_IMPACT_NAME=Company Wide
HALOPSA_URGENCY_NAME=High
HALOPSA_OIDC_CLIENT_ID=32d**************192b1
HALOPSA_OIDC_CLIENT_SECRET=cab1a*******************************6d7c16c
INSTANCE_KEY=


STELLAR_DB_HOST=<stellar_domain>.stellarcyber.cloud
STELLAR_USER=SD_API@nologon.nologon
STELLAR_API_KEY=QsffC7X2U**************************6HYGkzukjA
STELLAR_VERIFY_SSL=true
STELLAR_SAAS=true

SQLITE_FILENAME=/db/sqlite.db
POLL_INTERVAL_MINS=5
