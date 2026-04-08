import { Button, Input } from "@/components/ui";
import styles from "./HomeHero.module.css";

export function HomeHero() {
  return (
    <section aria-labelledby="home-hero-title" className={styles.hero}>
      <div className={styles.badge} aria-label="Middleton High School">
        <span aria-hidden="true">📍</span>
        Middleton High School
      </div>

      <h1 id="home-hero-title" className={styles.title}>
        Lost something?
        <span className={styles.titleAccent}> Let&apos;s find it.</span>
      </h1>

      <p className={styles.subtitle}>
        The easiest way to recover lost items at school. Search, report, and
        claim all in one place.
      </p>

      <form action="/search" className={styles.searchRow}>
        <Input
          aria-label="Search listings"
          inputClassName={styles.searchInput}
          name="search"
          placeholder="Search for your item..."
        />
        <Button className={styles.searchButton} size="lg" type="submit">
          Search
        </Button>
      </form>

      <div className={styles.actions}>
        <form action="/search" className={styles.linkWrap}>
          <Button
            fullWidth
            iconLeft={<span aria-hidden="true">👁️</span>}
            size="lg"
            type="submit"
            variant="secondary"
          >
            Browse all items
          </Button>
        </form>
        <form action="/submit" className={styles.linkWrap}>
          <Button
            fullWidth
            iconLeft={<span aria-hidden="true">＋</span>}
            size="lg"
            type="submit"
          >
            Report lost item
          </Button>
        </form>
      </div>
    </section>
  );
}
