export const FEE_LABEL = "8% platform fee";

export const FAQ = [
  {
    q: "What exactly is the 8% taken from?",
    a: "The fee is calculated on the gross sale price, before licence-tier multipliers are applied. Buyers pay the listed amount; NEXUS deducts 8% from what reaches your wallet. There are no additional charges on the buyer side beyond what they see at checkout.",
  },
  {
    q: "When do I get paid?",
    a: "As soon as settlement confirms on the network the buyer used. There is no withdrawal step, no minimum balance and no payout schedule - the funds are already in your wallet address by the time the buyer's download link is minted.",
  },
  {
    q: "Which currencies and networks are supported?",
    a: "Stablecoins (USDC, USDT, DAI) and ETH on Ethereum, Base, Arbitrum and Polygon. Creators can also opt into memecoin rails (PEPE, WIF, BONK, SHIB) per listing for promotional volume.",
  },
  {
    q: "Do I need to handle taxes or invoices?",
    a: "NEXUS records every transaction with a reference, amount, token and block hash. That ledger is what you attach to your accountant; we do not withhold or remit on your behalf, and the legal responsibility for your income stays with you.",
  },
  {
    q: "What happens if a buyer claims the files are broken?",
    a: "Open a dispute within 30 days of purchase. If the delivered archive does not do what the listing described, the buyer is refunded in full and the order is flagged on your record. Three upheld disputes in a row suspends payouts pending review.",
  },
  {
    q: "Can I sell under my own licence terms?",
    a: "Yes. Choose a licence per listing from MIT, Apache 2.0, GPL 3.0, proprietary or commercial, and buyers can upgrade to extended or resale rights at checkout. NEXUS records which tier was sold on every order.",
  },
  {
    q: "Is there an API?",
    a: "Yes - the same endpoints the storefront uses are documented in the API reference. Reads are public; writes require a session. Rate limits are per-IP and per-scope, and every write is validated server-side.",
  },
];