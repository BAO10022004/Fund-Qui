import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface CreateJournalEntryData {
  journalEntry_insert: JournalEntry_Key;
}

export interface CreateJournalEntryVariables {
  title: string;
  content: string;
  entryDate: TimestampString;
}

export interface CreateMoodData {
  mood_insert: Mood_Key;
}

export interface EntryMood_Key {
  journalEntryId: UUIDString;
  moodId: UUIDString;
  __typename?: 'EntryMood_Key';
}

export interface EntryTag_Key {
  journalEntryId: UUIDString;
  tagId: UUIDString;
  __typename?: 'EntryTag_Key';
}

export interface GetUserData {
  user?: {
    id: UUIDString;
    username: string;
    email?: string | null;
  } & User_Key;
}

export interface JournalEntry_Key {
  id: UUIDString;
  __typename?: 'JournalEntry_Key';
}

export interface ListJournalEntriesData {
  journalEntries: ({
    id: UUIDString;
    title: string;
    content: string;
    entryDate: TimestampString;
  } & JournalEntry_Key)[];
}

export interface Mood_Key {
  id: UUIDString;
  __typename?: 'Mood_Key';
}

export interface Tag_Key {
  id: UUIDString;
  __typename?: 'Tag_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateMoodRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateMoodData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateMoodData, undefined>;
  operationName: string;
}
export const createMoodRef: CreateMoodRef;

export function createMood(): MutationPromise<CreateMoodData, undefined>;
export function createMood(dc: DataConnect): MutationPromise<CreateMoodData, undefined>;

interface ListJournalEntriesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListJournalEntriesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListJournalEntriesData, undefined>;
  operationName: string;
}
export const listJournalEntriesRef: ListJournalEntriesRef;

export function listJournalEntries(): QueryPromise<ListJournalEntriesData, undefined>;
export function listJournalEntries(dc: DataConnect): QueryPromise<ListJournalEntriesData, undefined>;

interface CreateJournalEntryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateJournalEntryVariables): MutationRef<CreateJournalEntryData, CreateJournalEntryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateJournalEntryVariables): MutationRef<CreateJournalEntryData, CreateJournalEntryVariables>;
  operationName: string;
}
export const createJournalEntryRef: CreateJournalEntryRef;

export function createJournalEntry(vars: CreateJournalEntryVariables): MutationPromise<CreateJournalEntryData, CreateJournalEntryVariables>;
export function createJournalEntry(dc: DataConnect, vars: CreateJournalEntryVariables): MutationPromise<CreateJournalEntryData, CreateJournalEntryVariables>;

interface GetUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetUserData, undefined>;
  operationName: string;
}
export const getUserRef: GetUserRef;

export function getUser(): QueryPromise<GetUserData, undefined>;
export function getUser(dc: DataConnect): QueryPromise<GetUserData, undefined>;

