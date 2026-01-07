const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'quyphong',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const createMoodRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateMood');
}
createMoodRef.operationName = 'CreateMood';
exports.createMoodRef = createMoodRef;

exports.createMood = function createMood(dc) {
  return executeMutation(createMoodRef(dc));
};

const listJournalEntriesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListJournalEntries');
}
listJournalEntriesRef.operationName = 'ListJournalEntries';
exports.listJournalEntriesRef = listJournalEntriesRef;

exports.listJournalEntries = function listJournalEntries(dc) {
  return executeQuery(listJournalEntriesRef(dc));
};

const createJournalEntryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateJournalEntry', inputVars);
}
createJournalEntryRef.operationName = 'CreateJournalEntry';
exports.createJournalEntryRef = createJournalEntryRef;

exports.createJournalEntry = function createJournalEntry(dcOrVars, vars) {
  return executeMutation(createJournalEntryRef(dcOrVars, vars));
};

const getUserRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetUser');
}
getUserRef.operationName = 'GetUser';
exports.getUserRef = getUserRef;

exports.getUser = function getUser(dc) {
  return executeQuery(getUserRef(dc));
};
