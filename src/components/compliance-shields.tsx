import { ShieldCheck, ShieldAlert, Shield } from "lucide-react";
import { motion } from "framer-motion";

type StateType = "texas" | "florida" | "california";

interface ComplianceShieldsProps {
  state: StateType;
}

const STATE_CONTENT = {
  florida: {
    badge: "Florida Rule 4-1.5 Integrity",
    copy: "Engineered for Florida Rule 4-1.5 Integrity. Our auditing logic helps firms ensure fee reasonableness and compliance with the 75/25 primary-secondary responsibility standards.",
    icon: ShieldCheck,
    color: "text-blue-400",
    borderColor: "border-blue-500/20",
    bgColor: "bg-blue-500/5",
  },
  texas: {
    badge: "Texas Rule 1.04 Standard",
    copy: "Aligned with Texas Rule 1.04 Standards. We help Texas firms avoid 'unconscionable fee' risks through objective, data-driven audit reporting.",
    icon: Shield,
    color: "text-amber-400",
    borderColor: "border-amber-500/20",
    bgColor: "bg-amber-500/5",
  },
  california: {
    badge: "SB 37 Verified Privacy",
    copy: "Fully compliant with CA SB 37. Unlike traditional lead-gen tools, LawAuditor's Zero-Retention model ensures your firm's data is never stored, sold, or accessible to third parties. We are a software-first solution, not a capper or runner service.",
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

