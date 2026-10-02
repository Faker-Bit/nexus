export type LegalSection = { h: string; p: string[] };
export type LegalDocSet = Record<string, { title: string; updated: string; sections: LegalSection[] }>;

export const LEGAL_DOCS: LegalDocSet = {
  terms: {
    title: "Terms of service",
    updated: "Updated 1 October 2026",
    sections: [
      {
        h: "1. What NEXUS is",
        p: [
          "NEXUS is a marketplace that connects independent creators with buyers of digital projects. We provide the listing, discovery, negotiation, settlement and delivery infrastructure. We are not a party to the licence grant between a creator and a buyer - that agreement is formed directly between them.",
          "Creators retain all rights in the work they upload. Listing on NEXUS grants us a limited, non-exclusive licence to host and display that work for the purpose of operating the marketplace.",
        ],
      },
      {
        h: "2. Accounts",
        p: [
          "You are responsible for activity under your account and for keeping your credentials secure. One wallet address may be linked to exactly one NEXUS account. Accounts may be suspended for fraud, chargeback abuse, or listing material you do not have the right to sell.",
          "Handles are permanent. They are your storefront URL and the identity attached to every licence you issue.",
        ],
      },
      {
        h: "3. Listings and prohibited content",
        p: [
          "Listings must accurately describe the delivered files. Screenshots, demos and documentation you advertise must exist in the archive you deliver. Misleading listings are grounds for removal and, where buyers are harmed, refund.",
          "Prohibited: stolen or mislicensed code, malware, credential harvesting tools, mass-targeting spam systems, and anything whose primary purpose is to violate law or the rights of others.",
        ],
      },
      {
        h: "4. Fees, settlement and refunds",
        p: [
          "The platform fee is eight percent of the gross sale price, deducted from the amount credited to the creator. Listing is free and there is no subscription.",
          "Funds settle from buyer to creator on the selected network. NEXUS does not take custody of settled funds. Buyers may raise a refund claim within 30 days where the delivered files materially fail to match the listing description.",
        ],
      },
      {
        h: "5. Changes",
        p: [
          "We may update these terms. Material changes are announced in the changelog at least 14 days before taking effect, and continuing to use the service after that constitutes acceptance.",
        ],
      },
    ],
  },

  privacy: {
    title: "Privacy policy",
    updated: "Updated 1 October 2026",
    sections: [
      {
        h: "What we collect",
        p: [
          "Account data (email, display name, handle, optional profile links), listing content you upload, transaction records required for accounting and dispute handling, and aggregate analytics about how the marketplace is used.",
          "We do not use third-party advertising or tracking pixels. Session identifiers for analytics are a salted hash of the request IP and are never shared.",
        ],
      },
      {
        h: "Where data lives",
        p: [
          "Account and listing data is stored in our primary database. Delivered files live in private object storage and are never publicly addressable; access is granted through short-lived signed URLs tied to a purchase.",
          "On-chain transaction metadata is public by nature of the networks involved. We link public hashes to your account so you can see your own ledger - you can opt out of that association.",
        ],
      },
      {
        h: "Retention",
        p: [
          "Orders, transaction records and licences are retained for the period required by law and by our refund window, even if an account is deleted. Analytics events are retained for 90 days and then aggregated or discarded.",
          "Request export or deletion of your personal data by contacting support. We respond within 30 days.",
        ],
      },
      {
        h: "Security",
        p: [
          "Passwords are hashed with bcrypt at cost 12 and never logged. Sessions are stateless JWTs in httpOnly, SameSite cookies. All writes are validated server-side and rate limited per scope. Download access is signed and audited.",
        ],
      },
    ],
  },

  licenses: {
    title: "Licence terms",
    updated: "Updated 1 October 2026",
    sections: [
      {
        h: "Tiers",
        p: [
          "Standard: a perpetual, single-project licence for the purchasing individual or entity. No redistribution of the source archive.",
          "Extended: as standard, plus unlimited projects for the licensee and priority support from the creator.",
          "Source + resale: as extended, plus the right to sublicense the delivered work as part of a product you sell.",
        ],
      },
      {
        h: "Creators' own licences",
        p: [
          "The licence named on a listing (MIT, Apache 2.0, GPL 3.0, proprietary or commercial) governs the underlying work and is enforced by the creator, not by NEXUS. NEXUS records which licence and tier was granted on each order for evidentiary purposes.",
        ],
      },
      {
        h: "Delivery and integrity",
        p: [
          "Each download is signed, counted and logged against the buyer's licence. Attempts to redistribute a delivered archive are traceable. Licences are non-transferable except where the tier explicitly permits sublicensing.",
        ],
      },
    ],
  },

  cookies: {
    title: "Cookie policy",
    updated: "Updated 1 October 2026",
    sections: [
      {
        h: "What we set",
        p: [
          "nexus_session - an httpOnly, SameSite=Lax session cookie holding a signed JWT. Required to sign in.",
          "nexus_wallet_nonce - a short-lived cookie holding the wallet sign-in nonce. Deleted immediately after verification.",
          "nexus.wallet - a localStorage entry remembering which address you connected. Never transmitted beyond the sign-in handshake.",
        ],
      },
      {
        h: "What we do not set",
        p: ["No advertising cookies. No cross-site trackers. No third-party pixels of any kind."],
      },
    ],
  },
};