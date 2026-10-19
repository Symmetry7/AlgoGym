import type { VerifiedProfile } from "./profile-verification";
export interface TrackedSolve { id:string; problemId:string; title:string; provider:"codeforces"|"leetcode"; rating:number|null; difficulty:string|null; tags:string[]; url:string; acceptedAt:string; chakra:number|null }
export interface LedgerEntry { id:string; delta:number; createdAt:string; provider:string|null; difficulty:string|null }
export interface ProviderSnapshot { provider:"codeforces"|"leetcode"; profile:Record<string,any>; summary:{rating?:number|null;maxRating?:number|null;ratedContests?:number|null;totalSolved?:number|null;easySolved?:number|null;mediumSolved?:number|null;hardSolved?:number|null}; history_complete:boolean;last_synced_at:string|null;updated_at:string }
export interface TrackerData {
 accounts:VerifiedProfile[];snapshots:ProviderSnapshot[];jobs:Array<{id:string;provider:string;status:string;error_code:string|null;updated_at:string}>;
 historyComplete:boolean;days:number;provider:string;solvedIds:string[];recentSolves:TrackedSolve[];solves:TrackedSolve[];
 overview:{verifiedSolves:number|null;knownSolves:number;totalSolves:number;activeDays:number|null;chakra:number;chakraWeek:number;chakraMonth:number};
 ratingHistory:Array<{provider:string;date:string;contestId:string;contestName?:string|null;contestRank?:number|null;before:number|null;rating:number}>;
 difficulty:Array<{label:string;count:number}>;topics:Array<{topic:string;count:number}>;activity:Array<{date:string;count:number}>;
 chakraHistory:Array<{date:string;points:number}>;chakraByProvider:Array<{label:string;points:number}>;chakraByDifficulty:Array<{label:string;points:number}>;ledger:LedgerEntry[];
}
