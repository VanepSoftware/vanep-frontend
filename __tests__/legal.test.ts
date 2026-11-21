import { describe, expect, it } from "vitest";

import { legalContactFromEnv } from "@/lib/legal";
import legal from "@/messages/legal-pt-BR";

describe("legalContactFromEnv", () => {
  it("reads and trims the controller contact from the environment", () => {
    expect(
      legalContactFromEnv({
        VANEP_LEGAL_CONTACT_EMAIL: " privacidade@example.com ",
        VANEP_LEGAL_ENTITY_NAME: "Vanep Ltda",
        VANEP_LEGAL_ENTITY_DOCUMENT: "00.000.000/0001-00",
      }),
    ).toEqual({
      email: "privacidade@example.com",
      entityName: "Vanep Ltda",
      entityDocument: "00.000.000/0001-00",
    });
  });

  it("returns empty values when the environment is not configured", () => {
    expect(legalContactFromEnv({})).toEqual({
      email: "",
      entityName: "",
      entityDocument: "",
    });
  });
});

describe("legal documents", () => {
  const documents = [legal.privacy, legal.terms, legal.accountDeletion];

  it.each(documents)("$title has unique anchors and non-empty sections", (document) => {
    const ids = document.sections.map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const section of document.sections) {
      expect(section.title).not.toBe("");
      expect((section.paragraphs?.length ?? 0) +
          (section.items?.length ?? 0) +
          (section.closing?.length ?? 0)).toBeGreaterThan(0);
    }
  });

  it.each(documents)("$title ends with the contact section", (document) => {
    expect(document.sections.at(-1)?.id).toBe("contato");
  });

  it("discloses how Google user data is used, as Google OAuth verification requires", () => {
    const google = legal.privacy.sections.find((section) => section.id === "dados-google");
    const text = google?.paragraphs?.join(" ") ?? "";
    expect(text).toContain("openid, email e profile");
    expect(text).toContain("Uso Limitado");
  });

  it("explains how to delete the account, as Google Play requires", () => {
    expect(legal.privacy.sections.some((section) => section.id === "exclusao")).toBe(true);
  });

  it("has a deletion page that names the app and discloses retained data, as Google Play requires", () => {
    const page = legal.accountDeletion;
    expect(page.intro).toContain("Vanep");
    expect(page.sections.map((section) => section.id)).toEqual(
      expect.arrayContaining(["como-pedir", "dados-apagados", "dados-mantidos"]),
    );
  });
});
