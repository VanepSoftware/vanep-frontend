import type { Metadata } from "next";

import { LegalDocumentPage } from "@/components/legal-document";
import { t } from "@/lib/l10n";

const terms = t("legal").terms;

export const metadata: Metadata = {
  title: terms.metaTitle,
  description: terms.metaDescription,
};

export default function TermsOfUse() {
  return <LegalDocumentPage document={terms} />;
}
