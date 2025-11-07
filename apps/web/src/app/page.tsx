import styles from "./page.module.css";
import Logo from "../assets/logo.svg";
import Image from "next/image";
import { UrlForm } from "../components/UrlForm";
import { ScrollDownButton } from "../components/ScrollDownButton";
import { BackToTopButton } from "../components/BackToTopButton";

export default function Home() {
  return (
    <main>
      <section className={styles.container}>
        <div className={styles.hero}>
          <div className={styles.logoWrap}>
            <Image
              src={Logo}
              width={640}
              height={111}
              alt="letsrunit logo"
              className={styles.logo}
              priority
            />
          </div>
          <p className={styles.subtitle}>
            Vibe<span>.</span> Run<span>.</span> Test<span>.</span>
          </p>
          <UrlForm
            className={styles.formRow}
            inputClassName={styles.input}
            buttonClassName={styles.button}
            placeholder="https://www.example.com"
            buttonLabel="Run it."
          />
          <div className={styles.scrollWrap}>
            <ScrollDownButton
              ariaLabel="Scroll to learn more"
              className={`p-button-rounded p-button-text ${styles.scrollBtn}`}
              targetId="learn-more"
            />
          </div>
        </div>
      </section>

      <section id="learn-more" className={styles.section}>
        <div className={styles.sectionInner}>
          <h2 className={styles.h2}>Ship fearless. Let the bots break it first.</h2>
          <p className={styles.lead}>
            Letsrunit explores your product like a curious power‑user and turns the
            journey into living, readable tests. Less guesswork. More green
            checkmarks.
          </p>

          <div className={styles.grid}>
            <div className={styles.card}>
              <i className={`pi pi-sitemap ${styles.cardIcon}`} aria-hidden="true"></i>
              <h3>E2E tests, generated<span>.</span></h3>
              <p>
                Point us at your staging site. We map flows, identify critical
                paths and draft clean Gherkin scenarios you can commit on day one.
              </p>
            </div>
            <div className={styles.card}>
              <i className={`pi pi-list-check ${styles.cardIcon}`} aria-hidden="true"></i>
              <h3>Reproduce, report, recover<span>.</span></h3>
              <p>
                Turn vague “it’s broken” into precise, repeatable steps with
                screenshots, traces and a ready‑to‑run failing test attached.
              </p>
            </div>
            <div className={styles.card}>
              <i className={`pi pi-lightbulb ${styles.cardIcon}`} aria-hidden="true"></i>
              <h3>BDD clarity on red builds<span>.</span></h3>
              <p>
                When a spec fails, we explain the why — which step, which rule,
                and the state the app was in — so you can fix, not forage.
              </p>
            </div>
          </div>

          <div className={styles.steps}>
            <h4 className={styles.stepsTitle}>How it works</h4>
            <ol className={styles.stepList}>
              <li className={styles.stepItem}>
                <div className={styles.stepBadge}>1</div>
                <div className={styles.stepContent}>
                  <h5>Explore your web app</h5>
                  <p>We crawl your staging site like a power user: follow links, trigger forms, and chart the visible UI so we understand pages, states, and guardrails.</p>
                </div>
              </li>
              <li className={styles.stepItem}>
                <div className={styles.stepBadge}>2</div>
                <div className={styles.stepContent}>
                  <h5>Bootstrap a fresh account</h5>
                  <p>If sign‑up is open, we register a clean user and store credentials securely, ensuring flows like onboarding and email checks run end‑to‑end.</p>
                </div>
              </li>
              <li className={styles.stepItem}>
                <div className={styles.stepBadge}>3</div>
                <div className={styles.stepContent}>
                  <h5>Suggest meaningful stories</h5>
                  <p>Based on what we learned, we surface high‑impact user stories as ready‑to‑run scenarios — login, checkout, posting, permissions and more.</p>
                </div>
              </li>
              <li className={styles.stepItem}>
                <div className={styles.stepBadge}>4</div>
                <div className={styles.stepContent}>
                  <h5>Run and generate tests</h5>
                  <p>Pick a suggestion or describe your own. We execute it, collect traces/screenshots, and output clean, readable Gherkin with Playwright behind it.</p>
                </div>
              </li>
              <li className={styles.stepItem}>
                <div className={styles.stepBadge}>5</div>
                <div className={styles.stepContent}>
                  <h5>Codify your rules</h5>
                  <p>Add guardrails like “required fields must be filled out.” We translate these into Gherkin Rules with examples — your tests evolve with your product.</p>
                </div>
              </li>
            </ol>
          </div>

          <div className={styles.backTopWrap}>
            <BackToTopButton
              ariaLabel="Back to top"
              label="Back to top"
              icon="pi pi-arrow-up"
              className={styles.backTopBtn}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
