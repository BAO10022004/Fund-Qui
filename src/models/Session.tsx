import type { Action } from "./Action";

export interface Session {
  id?: string;
  number: number;
  actionId: string;
}
