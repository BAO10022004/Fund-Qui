import { CreateMoodData, ListJournalEntriesData, CreateJournalEntryData, CreateJournalEntryVariables, GetUserData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateMood(options?: useDataConnectMutationOptions<CreateMoodData, FirebaseError, void>): UseDataConnectMutationResult<CreateMoodData, undefined>;
export function useCreateMood(dc: DataConnect, options?: useDataConnectMutationOptions<CreateMoodData, FirebaseError, void>): UseDataConnectMutationResult<CreateMoodData, undefined>;

export function useListJournalEntries(options?: useDataConnectQueryOptions<ListJournalEntriesData>): UseDataConnectQueryResult<ListJournalEntriesData, undefined>;
export function useListJournalEntries(dc: DataConnect, options?: useDataConnectQueryOptions<ListJournalEntriesData>): UseDataConnectQueryResult<ListJournalEntriesData, undefined>;

export function useCreateJournalEntry(options?: useDataConnectMutationOptions<CreateJournalEntryData, FirebaseError, CreateJournalEntryVariables>): UseDataConnectMutationResult<CreateJournalEntryData, CreateJournalEntryVariables>;
export function useCreateJournalEntry(dc: DataConnect, options?: useDataConnectMutationOptions<CreateJournalEntryData, FirebaseError, CreateJournalEntryVariables>): UseDataConnectMutationResult<CreateJournalEntryData, CreateJournalEntryVariables>;

export function useGetUser(options?: useDataConnectQueryOptions<GetUserData>): UseDataConnectQueryResult<GetUserData, undefined>;
export function useGetUser(dc: DataConnect, options?: useDataConnectQueryOptions<GetUserData>): UseDataConnectQueryResult<GetUserData, undefined>;
