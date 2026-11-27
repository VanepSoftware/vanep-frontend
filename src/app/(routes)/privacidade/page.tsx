import type { Metadata } from "next";

import { LegalDocumentPage } from "@/components/legal-document";
import { t } from "@/lib/l10n";

const privacy = t("legal").privacy;

export const metadata: Metadata = {
  title: privacy.metaTitle,
  description: privacy.metaDescription,
};

export default function PrivacyPolicy() {
  return <LegalDocumentPage document={privacy} />;
}
