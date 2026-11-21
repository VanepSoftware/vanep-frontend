import type { Metadata } from "next";

import { LegalDocumentPage } from "@/components/legal-document";
import { t } from "@/lib/l10n";

const accountDeletion = t("legal").accountDeletion;

export const metadata: Metadata = {
  title: accountDeletion.metaTitle,
  description: accountDeletion.metaDescription,
};

export default function AccountDeletion() {
  return <LegalDocumentPage document={accountDeletion} />;
}
