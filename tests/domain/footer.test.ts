import assert from "node:assert/strict";
import { test } from "@playwright/test";
import { footerData } from "@/data/footer";
import { getPublicInfoPage } from "@/services/public-info-pages";

test("footer destinations are actionable and every informational link has a page", () => {
  const links = [...footerData.linkGroups.flatMap(({ links: groupLinks }) => groupLinks), ...footerData.bottomLinks];
  for (const link of links) {
    assert.notEqual(link.href, "#", `${link.label} must not be a placeholder destination`);
    assert.ok(link.href.startsWith("/") || /^https:\/\//.test(link.href), `${link.label} must use an internal route or HTTPS URL`);
    const infoRoute = link.href.match(/^\/info\/([^/?#]+)$/);
    if (infoRoute) assert.ok(getPublicInfoPage(infoRoute[1]), `${link.label} info destination must resolve`);
  }
  for (const social of footerData.socials) assert.ok(/^https:\/\//.test(social.href), `${social.label} must use HTTPS`);
});
