import { ShieldCheck, ShieldAlert, Shield } from "lucide-react";
import { motion } from "framer-motion";

type StateType = "texas" | "florida" | "california";

interface ComplianceShieldsProps {
  state: StateType;
}

const STATE_CONTENT = {
  florida: {
    badge: "Florida Rule 4-1.5 Verification Assistant",
    copy: "A data-processing tool to assist in Rule 4-1.5 verification. Our software helps firms identify billing inconsistencies and ensures fee reasonableness in compliance with the 75/25 primary-secondary responsibility standards.",
    icon: ShieldCheck,
    color: "text-blue-400",
    borderColor: "border-blue-500/20",
    bgColor: "bg-blue-500/5",
  },
  texas: {
    badge: "Texas Rule 1.04 Consistency Tool",
    copy: "An automated consistency-checker for Rule 1.04 fee transparency. Aligned with Texas Rule 1.04 Standards, LawAuditor helps firms mitigate risk through objective, data-driven report generation.",
    icon: Shield,
    color: "text-amber-400",
    borderColor: "border-amber-500/20",
    bgColor: "bg-amber-500/5",
  },
  california: {
    badge: "SB 37 & AB 316 Verified SaaS",
    copy: "CA SB 37 Transparency: LawAuditor is a software provider. Business Address: 123 California St, San Francisco, CA 94104. We are not a Lawyer Referral Service (LRS) and receive no fees for referrals. Fully compliant with CA AB 316 AI responsibility standards.",
    icon: ShieldAlert,
    color: "text-emerald-400",
    borderColor: "border-emerald-500/20",
    bgColor: "bg-emerald-500/5",
  },
};

export function ComplianceShields({ state }: ComplianceShieldsProps) {
  const content = STATE_CONTENT[state];
  if (!content) return null;

  const Icon = content.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`p-8 border ${content.borderColor} ${content.bgColor} rounded-none relative group overflow-hidden`}
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Icon className="w-24 h-24" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 border ${content.borderColor} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${content.color}`} />
          </div>
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">
            {content.badge}
          </h3>
        </div>
        
        <p className="text-slate-400 text-sm leading-relaxed font-medium max-w-2xl">
          {content.copy}
        </p>
      </div>
    </motion.div>
  );
}

