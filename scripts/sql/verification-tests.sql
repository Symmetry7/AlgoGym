do $$
declare v_user uuid; v_other uuid; v_result jsonb; v_existing text; i integer;
begin
 select u.id into v_user from auth.users u where not exists(select 1 from public.coding_profiles c where c.user_id=u.id and c.platform='codeforces') limit 1;
 select user_id into v_other from public.coding_profiles where platform='codeforces' limit 1;
 if v_user is null or v_other is null then raise exception 'Ownership tests require one linked and one unlinked test identity'; end if;
 perform public.create_owned_challenge(v_user,'codeforces','rollback_verification',repeat('a',64));
 perform public.create_owned_challenge(v_user,'codeforces','rollback_verification',repeat('b',64));
 v_result:=public.consume_challenge_attempt(v_user,'codeforces','rollback_verification',repeat('a',64));
 if v_result->>'code'<>'mismatch' then raise exception 'Regeneration did not invalidate the previous code'; end if;
 begin perform public.claim_verified_profile(v_other,'codeforces','rollback_verification',repeat('b',64)); raise exception 'Cross-user challenge reuse succeeded'; exception when raise_exception then if sqlerrm='Cross-user challenge reuse succeeded' then raise; end if; end;
 update public.profile_verification_challenges set expires_at=now()-interval '1 second' where user_id=v_user and platform='codeforces';
 v_result:=public.consume_challenge_attempt(v_user,'codeforces','rollback_verification',repeat('b',64));
 if v_result->>'code'<>'expired' then raise exception 'An expired code was accepted'; end if;
 perform public.create_owned_challenge(v_user,'codeforces','rollback_verification',repeat('c',64));
 begin perform public.claim_verified_profile(v_user,'codeforces','wrong_handle',repeat('c',64)); raise exception 'Mismatched handle was accepted'; exception when raise_exception then if sqlerrm='Mismatched handle was accepted' then raise; end if; end;
 v_result:=public.consume_challenge_attempt(v_user,'codeforces','rollback_verification',repeat('c',64));
 if v_result->>'ok'<>'true' then raise exception 'A correct active challenge was rejected'; end if;
 perform public.claim_verified_profile(v_user,'codeforces','rollback_verification',repeat('c',64));
 begin perform public.claim_verified_profile(v_user,'codeforces','rollback_verification',repeat('c',64)); raise exception 'A consumed challenge was accepted again'; exception when raise_exception then if sqlerrm='A consumed challenge was accepted again' then raise; end if; end;
 select username into v_existing from public.coding_profiles where user_id=v_other and platform='leetcode';
 if v_existing is not null then begin perform public.create_owned_challenge(v_user,'leetcode',v_existing,repeat('d',64)); raise exception 'Duplicate ownership was accepted'; exception when raise_exception then if sqlerrm='Duplicate ownership was accepted' then raise; end if; end; end if;
 perform public.create_owned_challenge(v_user,'leetcode','rollback_rate_limit',repeat('e',64));
 for i in 1..5 loop perform public.consume_challenge_attempt(v_user,'leetcode','rollback_rate_limit',repeat('f',64)); end loop;
 v_result:=public.consume_challenge_attempt(v_user,'leetcode','rollback_rate_limit',repeat('e',64));
 if v_result->>'code'<>'rate_limited' then raise exception 'Attempt rate limit failed'; end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',v_user,'role','authenticated')::text,true);
end $$;
set local role authenticated;
do $$ declare v_count integer; begin
 select count(*) into v_count from public.profiles;
 if v_count<>1 then raise exception 'Profile RLS did not isolate the current identity'; end if;
 begin perform token_hash from public.profile_verification_challenges; raise exception 'Challenge hashes are client-readable'; exception when insufficient_privilege then null; end;
 begin perform public.claim_verified_profile(gen_random_uuid(),'codeforces','forged',repeat('0',64)); raise exception 'Client can claim profile ownership'; exception when insufficient_privilege then null; end;
end $$;
reset role;
