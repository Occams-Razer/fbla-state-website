import Link from "next/link";
import styles from "./HomeHero.module.css";

function SearchIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20L16.5 16.5" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
      <path
        d="M2 12C4.2 8.2 7.4 6 12 6C16.6 6 19.8 8.2 22 12C19.8 15.8 16.6 18 12 18C7.4 18 4.2 15.8 2 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" fill="currentColor" r="2.2" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 24 24" width="14">
      <path
        d="M12 22C15.6 18.2 19 14.8 19 10.5C19 6.36 15.86 3 12 3C8.14 3 5 6.36 5 10.5C5 14.8 8.4 18.2 12 22Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="10.5" fill="currentColor" r="2.1" />
    </svg>
  );
}

export function HomeHero() {
  return (
    <section aria-labelledby="home-hero-title" className={styles.section}>
      <div aria-hidden="true" className={styles.shapeCircle} />
      <div aria-hidden="true" className={styles.shapeTriangleGreen} />
      <div aria-hidden="true" className={styles.shapeTriangleRed} />
      <div aria-hidden="true" className={styles.shapeStarBlue} />
      <div aria-hidden="true" className={styles.shapeSlabPink} />

      <div className={styles.hero}>
        <p className={styles.schoolBadge}>
          <PinIcon />
          <span>Middleton High School</span>
        </p>

        <h1 className={styles.title} id="home-hero-title">
          Lost something?
          <span> Let&apos;s find it.</span>
        </h1>

        <p className={styles.subtitle}>
          The easiest way to recover lost items at school. Search, report, and claim,
          all in one place.
        </p>

        <form action="/search" className={styles.searchRow}>
          <label className={styles.searchInputWrap} htmlFor="home-search">
            <SearchIcon />
            <input
              id="home-search"
              name="search"
              placeholder="Search for your item..."
              type="text"
            />
          </label>
          <button className={styles.searchButton} type="submit">
            Search
          </button>
        </form>

        <div className={styles.actions}>
          <Link className={styles.linkButtonGhost} href="/search">
            <EyeIcon />
            <span>Browse all items</span>
          </Link>
          <Link className={styles.linkButtonPrimary} href="/submit">
            <PlusIcon />
            <span>Report lost item</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
