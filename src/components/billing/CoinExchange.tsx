"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { CoinMark } from "@/components/brand/ChakraMark";
import { useAuth } from "@/contexts/AuthContext";
import { useBilling } from "@/hooks/use-billing";
import { jsonRequest } from "@/hooks/use-account";

const exchanges = [{ coins: 1000, credits: 10 }, { coins: 10000, credits: 100 }] as const;

export function CoinExchange() {
  const { user } = useAuth();
  const billing = useBilling();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<number | null>(null);
  const keys = useRef<Record<number, string>>({});
  const exchangeUnavailable = Boolean(user && billing.data?.credits === null);

  async function exchange(coins: 1000 | 10000) {
    if (!user) { router.push("/sign-in?next=%2Fpricing"); return; }
    keys.current[coins] ||= crypto.randomUUID();
    setPending(coins);
    try {
      await jsonRequest("/api/coin-exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coins, operationKey: keys.current[coins] }),
      });
      delete keys.current[coins];
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["billing"] }),
        queryClient.invalidateQueries({ queryKey: ["symm"] }),
      ]);
      toast.success(`${coins / 100} AI credits added to your account.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Coin exchange failed. Please retry.");
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="coin-exchange" aria-labelledby="coin-exchange-title">
      <div className="coin-exchange-heading">
        <div><span className="coin-exchange-kicker">Earned in practice</span><h2 id="coin-exchange-title">Turn Coins into paths.</h2></div>
        <p>Use Coins from verified solves to make more SYMM AI learning paths.</p>
      </div>
      <div className="coin-exchange-grid">
        {exchanges.map(({ coins, credits }) => (
          <article className="coin-exchange-card" key={coins}>
            <div className="coin-exchange-card-top"><CoinMark className="coin-exchange-image" /><span>{credits} AI credits</span></div>
            <div className="coin-exchange-value"><strong>{coins.toLocaleString()}</strong><span>Coins</span></div>
            <p>{credits} new learning paths</p>
            <button type="button" disabled={pending !== null || Boolean(user && (billing.isPending || exchangeUnavailable || (billing.data?.coins ?? 0) < coins))} onClick={() => void exchange(coins)}>
              {pending === coins ? "Exchanging…" : exchangeUnavailable ? "Coin exchange coming soon" : user && (billing.data?.coins ?? 0) < coins ? "More Coins needed" : `Exchange for ${credits} credits`}
              <ArrowRight size={16} />
            </button>
          </article>
        ))}
      </div>
      <p className="coin-exchange-balance">Your balance: <CoinMark className="coin-exchange-balance-image" /> {billing.data?.coins?.toLocaleString() ?? "—"} Coins</p>
    </section>
  );
}
