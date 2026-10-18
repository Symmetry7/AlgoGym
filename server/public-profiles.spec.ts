import {describe,it,expect} from 'vitest';
import {parsePublicProfile} from '../supabase/functions/profile-verification/public-profiles';
describe('public ownership fields',()=>{
 it('reads only AtCoder affiliation',()=>{expect(parsePublicProfile('atcoder','tourist','Contest Status <th>Affiliation</th><td>VERIFY-AC-ABC</td>','https://atcoder.jp/users/tourist').challenge).toBe('VERIFY-AC-ABC')});
 it('rejects a mismatched AtCoder page',()=>expect(()=>parsePublicProfile('atcoder','other','Contest Status','https://atcoder.jp/users/tourist')).toThrow());
 it('uses the canonical CodeChef handle after redirect',()=>{const p=parsePublicProfile('codechef','old','<div class="user-details-container"><header><h1>VERIFY-CC-ABC</h1></header><span class="m-username--link">new</span>','https://www.codechef.com/users/new');expect(p.username).toBe('new');expect(p.challenge).toBe('VERIFY-CC-ABC')});
 it('rejects unrelated CodeChef headings',()=>expect(()=>parsePublicProfile('codechef','x','<h1>VERIFY-CC-ABC</h1>','https://www.codechef.com/users/x')).toThrow());
 it('reads GitHub bio only for a personal matching account',()=>{expect(parsePublicProfile('github','octocat',JSON.stringify({login:'octocat',id:1,type:'User',bio:'VERIFY-GH-ABC'}),'').challenge).toBe('VERIFY-GH-ABC');expect(()=>parsePublicProfile('github','other',JSON.stringify({login:'octocat',id:1,type:'User',bio:'x'}),'')).toThrow()});
 it('rejects GitHub organizations',()=>expect(()=>parsePublicProfile('github','org',JSON.stringify({login:'org',id:1,type:'Organization',bio:'x'}),'')).toThrow());
 it('reads only the GFG requested mentor bio, ignoring recommended users',()=>{const flight='6:'+JSON.stringify(['$','$L',null,{username:'alice',mentor:{handle:'alice',bio:'VERIFY-GFG-ABC'},recommendations:[{handle:'bob',bio:'other'}]}])+'\n';const html='<script>self.__next_f.push('+JSON.stringify([1,flight])+')</script>';expect(parsePublicProfile('geeksforgeeks','alice',html,'').challenge).toBe('VERIFY-GFG-ABC');expect(()=>parsePublicProfile('geeksforgeeks','bob',html,'')).toThrow()});
 it('fails closed on changed public markup',()=>{for(const p of ['atcoder','codechef','geeksforgeeks'] as const)expect(()=>parsePublicProfile(p,'alice','<html>Access denied</html>','https://example.com')).toThrow()});
});
