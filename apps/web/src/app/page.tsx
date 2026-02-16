import {
  FailureExplainSection,
  GherkinSection,
  IntegrationSection,
  TestGenerationSection,
} from '@/components/home-page';
import { ArrowUp } from 'lucide-react';
import Image from 'next/image';
import Logo from '../assets/logo.svg';
import { AuthButton } from '../components/auth-button';
import { BackToTopButton } from '../components/back-to-top-button';
import { ExploreForm } from '../components/explore-form';
import { ScrollDownButton } from '../components/scroll-down-button';
import styles from './page.module.css';

export default function Home() {
  return (
    <>
      <AuthButton className="absolute top-0 right-0 m-4 z-5" />
      <main className={styles.main}>
        <section className={styles.heroSection}>
          <div className={styles.hero}>
            <div className={styles.logoWrap}>
              <Image src={Logo} width={640} height={111} alt="letsrunit logo" className={styles.logo} priority />
            </div>
            <p className={styles.subtitle}>
              You paste a URL<span>.</span> We test your site<span>.</span>
            </p>
            <ExploreForm
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
          <div className={styles.heroFade} aria-hidden="true"></div>
        </section>

        <div id="learn-more">
          <GherkinSection />
          <TestGenerationSection />
          <FailureExplainSection />
          <IntegrationSection />
        </div>

        <div className={styles.backTopWrap}>
          <BackToTopButton
            ariaLabel="Back to top"
            label="Back to top"
            icon={<ArrowUp aria-hidden="true" />}
            className={styles.backTopBtn}
          />
        </div>
      </main>
    </>
  );
}
