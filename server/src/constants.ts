import { StellarCaseSeverity } from ':dto';

export const MS_IN_SECOND = 1_000;
export const SECS_IN_MINUTE = 60;
export const THIRTY_SECONDS_IN_MS = 30_000;
export const SECONDS_IN_DAY = 86_400;
export const HALOPSA_LOOKUP_CODES = {
  Impact: 12,
  Urgency: 27,
  AutoRequestGroups: 19,
  RequestTypes: 21,
  RequestSource: 22,
  CarriageItems: 26,
  AddresssType: 30,
  PO_UserDefinedStatus: 32,
  SalesOrderUserStatus: 34,
  QuoteStatus: 39,
  AlertTypes: 43,
  ContributorValues: 48,
  ExcludeFromDynamicEmailList: 50,
  BillingCategory: 58,
  CategoryGroup: 62,
  KashflowProducts: 68,
  SalesforceStageNames: 75,
  CheckInStatus: 78,
  AppointmentStatus: 79,
  AppointmentLocations: 80,
  GetDeviceMatchingFieldIgnoreList: 81,
  HubspotLifeCycles: 82,
  AppointmentOther1: 84,
  AppointmentOther2: 85,
  BreakTimeNames: 86,
  ContributorQuality: 87,
  ShiftTypes: 88,
  CustomerRelationships: 89,
  Criticality: 90,
  MigrationAllowedValues: 92,
  ActionGroups: 94
} as const;
export const HALOPSA_UNASSIGGNED_AGENT_NAME = 'Unassigned';
export const HALOPSA_TO_STELLAR_DEFAULT_PRIORITY_MAP: Record<string, StellarCaseSeverity> = {
  Critical: 'Critical',
  High: 'High',
  Medium: 'Medium',
  Low: 'Low'
};
export const RATE_LIMIT_RESPONSE_CODE = 429;
