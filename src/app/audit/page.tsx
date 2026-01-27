import { AuditPortal } from "@/components/audit/audit-portal";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audit Portal | LawAuditor",
  description: "Enterprise-grade legal spend analysis with real-time violation detection and zero-retention data processing.",
};

export default function AuditPage() {
  return <AuditPortal />;
}

