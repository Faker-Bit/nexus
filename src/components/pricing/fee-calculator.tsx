"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { formatUSD } from "@/lib/utils";

const PRESETS = [1900, 4900, 9900, 24900, 49900, 129900];

/** Live "what do I actually keep" calculator - the question every seller asks. */
export function FeeCalculator() {
  const [price, setPrice] = useState(4900);
  const [monthlySales, setMonthlySales] = useState(6);

  const { fee, net, annual } = useMemo(() => {
    const f = Math.round(price * 0.08);
    const n = price - f;
    return { fee: f, net: n, annual: n * monthlySales * 12 };
  }, [price, monthlySales]);

  return (
    <div className="glass overflow-hidden rounded-2xl p-6">
      <h3 className="text-[16px] font-semibold">What do I actually keep?</h3>
      <p className="mt-1 text-[12.5px] text-mist-500">Drag the price and sales volume. The maths is the same maths.</p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <label className="text-[11.5px] uppercase tracking-wider text-mist-500">List price</label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PRESETS.map((value) => (
              <button
                key={value}
                onClick={() => setPrice(value)}
                className={`rounded-lg border px-2.5 py-1.5 text-[12px] tnum transition-all ${
                  price === value
                    ? "border-neon-400/45 bg-neon-400/10 text-neon-100"
                    : "border-white/10 text-mist-400 hover:border-white/20"
                }`}
              >
                {formatUSD(value)}
              </button>
            ))}
          </div>
          <input
            type="range"
            min={0}
            max={129900}
            step={100}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="mt-4 w-full accent-neon-400"
            aria-label="List price"
          />
          <p className="tnum mt-1 text-[13px] text-mist-200">{formatUSD(price, { precise: true })}</p>
        </div>

        <div>
          <label className="text-[11.5px] uppercase tracking-wider text-mist-500">Sales per month</label>
          <input
            type="range"
            min={1}
            max={200}
            value={monthlySales}
            onChange={(e) => setMonthlySales(Number(e.target.value))}
            className="mt-4 w-full accent-violet-soft"
            aria-label="Monthly sales"
          />
          <p className="tnum mt-1 text-[13px] text-mist-200">{monthlySales}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-white/8 bg-white/6 sm:grid-cols-3">
        {[
          { label: "Platform fee", value: fee, tone: "text-mist-300" },
          { label: "You keep per sale", value: net, tone: "text-mint" },
          { label: "Annualised", value: annual, tone: "text-mist-50" },
        ].map((row) => (
          <div key={row.label} className="bg-ink-950/70 px-4 py-4">
            <p className="text-[10.5px] uppercase tracking-wider text-mist-500">{row.label}</p>
            <motion.p
              key={`${row.label}-${row.value}`}
              initial={{ opacity: 0.4, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`tnum mt-1 text-[19px] font-semibold ${row.tone}`}
            >
              {formatUSD(row.value, { precise: row.value < 100000 })}
            </motion.p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[11.5px] text-mist-600">
        Assumes no refunds, disputes or taxes. On-chain gas is paid by the buyer on their side and never comes out of
        your share.
      </p>
    </div>
  );
}