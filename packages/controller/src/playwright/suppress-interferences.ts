import type { Page } from '@playwright/test';
import { sleep } from '../utils/sleep';
import { getTranslations } from '../translations';

type Options = {
  timeoutMs?: number;     // max sweep time
  preferReject?: boolean; // click "Reject"/"Decline" where possible
  verbose?: boolean;
  lang?: string;
};

interface TrRegExps {
  accept: RegExp,
  reject: RegExp,
  close: RegExp,
}

const knownCMPSelectors: Array<{ name: string; accept: string[]; reject: string[] }> = [
  { name: "OneTrust", accept: ["#onetrust-accept-btn-handler"], reject: ["#onetrust-reject-all-handler"] },
  { name: "Cookiebot", accept: ["#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll"], reject: ["#CybotCookiebotDialogBodyLevelButtonDecline"] },
  { name: "Didomi", accept: ["button.didomi-accept-all"], reject: ["button.didomi-reject-all"] },
  { name: "Quantcast", accept: ['button[qc-cmp2-action="accept_all"]'], reject: ['button[qc-cmp2-action="reject_all"]'] },
  { name: "TrustArc", accept: ["#truste-consent-button"], reject: ["#truste-reject-button", "#truste-consent-required"] },
  { name: "Iubenda", accept: ["button.iubenda-cs-accept-btn"], reject: ["button.iubenda-cs-reject-btn"] },
  { name: "CookieYes", accept: ["#wt-cli-accept-all-btn", "#cookie_action_close_header"], reject: ["#wt-cli-reject-btn"] },
  { name: "Osano", accept: [".osano-cm-accept-all"], reject: [".osano-cm-reject-all"] },
  { name: "Klaro", accept: [".cm-btn-accept"], reject: [".cm-btn-decline"] },
];

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizePhrase(p: string): string {
  // collapse whitespace to \s+ to match various spacing and NBSPs
  return escapeRegex(p.trim()).replace(/\s+/g, "\\s+");
}

function buildRegexFromTranslations(phrases: string[], opts?: { anchorWhole?: boolean; flags?: string }): RegExp {
  const unique = Array.from(new Set(phrases.map(normalizePhrase))).filter(s => s.length > 0);
  const body = unique.length ? unique.join("|") : "";
  const source = opts?.anchorWhole ? `^(?:${body})$` : `(?:${body})`;
  return new RegExp(source, opts?.flags ?? "i");
}

async function tryClick(page: Page, selectors: string[], label: string) {
  for (const s of selectors) {
    const el = page.locator(s).first();
    if (await el.count().catch(() => 0)) {
      try {
        await el.scrollIntoViewIfNeeded({ timeout: 250 });
        await el.click({ timeout: 500 });
        return true;
      } catch {}
    }
  }
  return false;
}

async function closeNativeJsAlerts(page: Page) {
  page.on("dialog", d => d.accept().catch(() => {}));
}

// 1) Known cookie CMPs (quick wins)
async function sweepKnownCMPs(page: Page, preferReject: boolean): Promise<boolean> {
  for (const cmp of knownCMPSelectors) {
    if (preferReject && (await tryClick(page, cmp.reject, `${cmp.name} reject`))) return true;
    if (await tryClick(page, cmp.accept, `${cmp.name} accept`)) return true;
    if (!preferReject && (await tryClick(page, cmp.reject, `${cmp.name} reject`))) return true;
  }
  return false;
}

// 2) Role/text-based generic approach (works surprisingly often)
async function clickByRoleAndText(page: Page, preferReject: boolean, regex: TrRegExps): Promise<boolean> {
  // Dialogs
  const dialogs = page.getByRole("dialog");
  if (await dialogs.count().catch(() => 0)) {
    const target = preferReject
      ? dialogs.getByRole("button", { name: regex.reject }).first()
      : dialogs.getByRole("button", { name: regex.accept }).first();

    if (await target.count().catch(() => 0)) {
      try {
        await target.click({ timeout: 700 });
        return true;
      } catch {}
    }
    // fallback: any accept/reject in dialog
    const any =
      (await dialogs.getByRole("button", { name: regex.accept }).first().count()) ||
      (await dialogs.getByRole("button", { name: regex.reject }).first().count());
    if (any) {
      try {
        const btn = dialogs.getByRole("button", { name: regex.accept }).first();
        await (await btn.count() ? btn : dialogs.getByRole("button", { name: regex.reject }).first()).click({ timeout: 700 });
        return true;
      } catch {}
    }
    // close-icon
    const close = dialogs.getByRole("button", { name: regex.close }).first();
    if (await close.count().catch(() => 0)) {
      try { await close.click({ timeout: 700 }); return true; } catch {}
    }
  }

  // Random buttons (no dialog role)
  const generic = page.getByRole("button", { name: preferReject ? regex.reject : regex.accept }).first();
  if (await generic.count().catch(() => 0)) {
    try { await generic.click({ timeout: 700 }); return true; } catch {}
  }
  return false;
}

// 3) Heuristic for “promo/newsletter” modals (email field + close button)
async function sweepNewsletter(page: Page, regex: TrRegExps): Promise<boolean> {
  const modalLike = page.locator('*:visible').filter({
    has: page.locator('input[type="email"],input[placeholder*="email" i]'),
  });
  if (await modalLike.count().catch(() => 0)) {
    const close = modalLike.getByRole("button", { name: regex.close }).first();
    if (await close.count().catch(() => 0)) {
      try { await close.click({ timeout: 700 }); return true; } catch {}
    }
    // click outside the modal (overlay)
    const overlay = page.locator('div[role="presentation"], .modal-backdrop, .overlay, .ReactModal__Overlay');
    if (await overlay.count().catch(() => 0)) {
      try { await overlay.first().click({ timeout: 500, position: { x: 5, y: 5 } }); return true; } catch {}
    }
  }
  return false;
}

// 4) Full-screen overlay heuristic (fixed + large + high z-index)
async function sweepOverlays(page: Page, regex: TrRegExps): Promise<boolean> {
  const acceptRxSource = regex.accept.source; // serialize for page.evaluate closure safety
  const acceptRxFlags = regex.accept.flags;

  return await page.evaluate(([source, flags]) => {
    const acceptRx = new RegExp(source, flags);
    const isBig = (el: Element) => {
      const r = (el as HTMLElement).getBoundingClientRect?.();
      return r && r.width > window.innerWidth * 0.6 && r.height > window.innerHeight * 0.4;
    };
    const candidates = Array.from(document.querySelectorAll<HTMLElement>("body *"))
      .filter(el => {
        const s = getComputedStyle(el);
        if (!s) return false;
        const fixed = s.position === "fixed" || s.position === "sticky";
        const z = parseInt(s.zIndex || "0", 10);
        return fixed && z >= 1000 && isBig(el) && (el as HTMLElement).offsetParent !== null;
      })
      .slice(0, 5);

    for (const el of candidates) {
      // try a close button inside
      const btn =
        el.querySelector<HTMLElement>('[aria-label*="close" i], button[aria-label*="close" i], button:has(svg), .close, [data-close], .btn-close');

      if (btn) {
        btn.click();
        return true;
      }

      // otherwise: click a visible “accept/agree/ok”
      const clickByText = (rx: RegExp) => {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT);
        let n: Node | null;
        while ((n = walker.nextNode())) {
          const e = n as HTMLElement;
          if (!e) continue;
          if (!(e as HTMLElement).offsetParent) continue;
          const text = (e as HTMLElement).innerText?.trim();

          if (text && rx.test(text)) {
            (e as HTMLElement).click();
            return true;
          }
        }
        return false;
      };
      if (clickByText(acceptRx)) return true;
    }
    return false;
  }, [acceptRxSource, acceptRxFlags]).catch(() => false);
}

export async function suppressInterferences(page: Page, opts: Options = {}) {
  const timeoutMs = opts.timeoutMs ?? 4000;
  const preferReject = opts.preferReject ?? false;

  const pollIntervalMs = 120;           // how often we probe when nothing happened
  const settleAfterActionMs = 300;      // give the DOM time to settle after a click
  const quietPeriodMs = 800;            // stop if nothing happened for this long
  const minSweepMs = 500;               // always sweep at least this long (to catch late banners)
  const maxActions = 6;                 // safety: don't click forever on re-spawning modals

  const endAt = Date.now() + timeoutMs;

  // Build regexes from translations so callers can provide i18n
  const { accept, reject, close } = getTranslations(opts.lang ?? 'en');
  const regex = {
    accept: buildRegexFromTranslations(accept, { anchorWhole: true }),
    reject: buildRegexFromTranslations(reject, { anchorWhole: true }),
    close: buildRegexFromTranslations(close, { anchorWhole: false }),
  };

  let actions = 0;
  const startedAt = Date.now();
  let lastActivityAt = startedAt;

  await closeNativeJsAlerts(page);

  while (Date.now() < endAt) {
    // Try sweepers (short-circuit on first success)
    const did =
      (await sweepKnownCMPs(page, preferReject)) ||
      (await clickByRoleAndText(page, preferReject, regex)) ||
      (await sweepNewsletter(page, regex)) ||
      (await sweepOverlays(page, regex));

    if (did) {
      actions += 1;
      lastActivityAt = Date.now();

      // Optional: bail if we are hitting a loop of re-spawning popups
      if (actions >= maxActions) {
        if (opts.verbose) console.log(`[suppressInterferences] Max actions ${maxActions} reached, stopping.`);
        break;
      }

      // Let the DOM settle; some UIs spawn a second layer after the first click
      await sleep(settleAfterActionMs);
      continue;
    }

    // Nothing clicked this iteration — if we've been quiet long enough (and passed a minimum sweep window), stop early
    const quietFor = Date.now() - lastActivityAt;
    const ranFor = Date.now() - startedAt;

    if (quietFor >= quietPeriodMs && ranFor >= minSweepMs) {
      if (opts.verbose) console.log(`[suppressInterferences] Quiet for ${quietFor}ms, stopping early.`);
      break;
    }

    // Brief pause before probing again
    await sleep(pollIntervalMs);
  }
}
