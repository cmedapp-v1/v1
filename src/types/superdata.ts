export type SuperDataSyncStatus = 'CONNECTED' | 'DISCONNECTED' | 'SYNCING' | 'ERROR';
export type SuperDataSyncMode = 'AUTOMATIC' | 'MANUAL';
export type SuperDataSyncFrequency = 'REALTIME' | 'HOURLY' | 'DAILY';
export type SuperDataConflictPolicy = 'MERGE_KEEP_LATEST' | 'SUPERDATA_PRIORITY' | 'CENTRE_PRIORITY';

export interface SuperDataConfig {
  endpoint: string;
  centerCode: string;
  apiKey: string;
  status: SuperDataSyncStatus;
  syncMode: SuperDataSyncMode;
  syncFrequency: SuperDataSyncFrequency;
  conflictPolicy: SuperDataConflictPolicy;
  autoPushAttendance: boolean;
  autoPullBeneficiaries: boolean;
  lastSyncAt?: string;
  totalSyncedBeneficiaries: number;
  totalSyncedAttendances: number;
  latencyMs: number;
  webhookUrl?: string;
  environment: 'PRODUCTION' | 'SANDBOX' | 'TEST';
}

export type SuperDataOperationType = 
  | 'PULL_BENEFICIARIES' 
  | 'PUSH_ATTENDANCES' 
  | 'FULL_SYNC' 
  | 'PING' 
  | 'WEBHOOK';

export interface SuperDataLog {
  id: string;
  timestamp: string;
  operation: SuperDataOperationType;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
  recordCount: number;
  durationMs: number;
  message: string;
  details?: string;
  user?: string;
}

export const DEFAULT_SUPERDATA_CONFIG: SuperDataConfig = {
  endpoint: 'https://api.superdata.ma/v1/sync',
  centerCode: 'C2C-CASABLANCA-01',
  apiKey: 'sd_live_948f2c817ea04d7c89',
  status: 'CONNECTED',
  syncMode: 'AUTOMATIC',
  syncFrequency: 'REALTIME',
  conflictPolicy: 'MERGE_KEEP_LATEST',
  autoPushAttendance: true,
  autoPullBeneficiaries: true,
  lastSyncAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  totalSyncedBeneficiaries: 24,
  totalSyncedAttendances: 48,
  latencyMs: 32,
  webhookUrl: 'https://api.superdata.ma/v1/webhooks/c2c-events',
  environment: 'PRODUCTION',
};
