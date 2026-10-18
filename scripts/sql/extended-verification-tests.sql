do $$
declare u uuid; other_user uuid; p text; result jsonb;
begin
 select id into u from auth.users order by created_at limit 1;
 select id into other_user from auth.users where id<>u limit 1;
 foreach p in array array['codechef','atcoder','github','geeksforgeeks'] loop
  perform public.create_owned_challenge(u,p,'algogym_rollback_probe',repeat('a',64));
  perform public.create_owned_challenge(u,p,'algogym_rollback_probe',repeat('b',64));
  result:=public.consume_challenge_attempt(u,p,'algogym_rollback_probe',repeat('a',64));
  if result->>'code'<>'mismatch' then raise exception 'Old code accepted for %',p;end if;
  result:=public.consume_challenge_attempt(other_user,p,'algogym_rollback_probe',repeat('b',64));
  if result->>'ok'='true' then raise exception 'Cross-user code accepted';end if;
  update public.profile_verification_challenges set expires_at=now()-interval '1 second' where user_id=u and platform=p;
  result:=public.consume_challenge_attempt(u,p,'algogym_rollback_probe',repeat('b',64));
  if result->>'code'<>'expired' then raise exception 'Expired code accepted';end if;
  perform public.create_owned_challenge(u,p,'algogym_rollback_probe',repeat('c',64));
  result:=public.consume_challenge_attempt(u,p,'algogym_rollback_probe',repeat('c',64));
  if result->>'ok'<>'true' then raise exception 'Active code rejected';end if;
  perform public.claim_verified_profile(u,p,'algogym_rollback_probe',repeat('c',64));
  begin
   perform public.create_owned_challenge(other_user,p,'algogym_rollback_probe',repeat('d',64));
   raise exception 'Duplicate ownership accepted';
  exception when raise_exception then if sqlerrm='Duplicate ownership accepted' then raise;end if;end;
 end loop;
end $$;
