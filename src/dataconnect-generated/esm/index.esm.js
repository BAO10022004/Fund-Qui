import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'quyphong',
  location: 'us-east4'
};

export const createMoodRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateMood');
}
createMoodRef.operationName = 'CreateMood';

export function createMood(dc) {
  return executeMutation(createMoodRef(dc));
}

export const listJournalEntriesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListJournalEntries');
}
listJournalEntriesRef.operationName = 'ListJournalEntries';

export function listJournalEntries(dc) {
  return executeQuery(listJournalEntriesRef(dc));
}

export const createJournalEntryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateJournalEntry', inputVars);
}
createJournalEntryRef.operationName = 'CreateJournalEntry';

export function createJournalEntry(dcOrVars, vars) {
  return executeMutation(createJournalEntryRef(dcOrVars, vars));
}

export const getUserRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetUser');
}
getUserRef.operationName = 'GetUser';

export function getUser(dc) {
  return executeQuery(getUserRef(dc));
}

