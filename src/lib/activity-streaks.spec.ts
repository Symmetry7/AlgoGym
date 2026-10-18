import {describe,it,expect} from 'vitest';
import {activityStreaks} from './activity-streaks';
describe('verified activity streaks',()=>{
 it('deduplicates days and permits the current day to be unfinished',()=>{expect(activityStreaks([{date:'2026-10-15',count:1},{date:'2026-10-16',count:2},{date:'2026-10-16',count:3}],new Date('2026-10-17T12:00:00Z'))).toEqual({current:2,maximum:2,activeDays:2});});
 it('breaks on a missing day and excludes zero activity',()=>{expect(activityStreaks([{date:'2026-10-14',count:1},{date:'2026-10-15',count:0}],new Date('2026-10-17T12:00:00Z'))).toEqual({current:0,maximum:1,activeDays:1});});
});
