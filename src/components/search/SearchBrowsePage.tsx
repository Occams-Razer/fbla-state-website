"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ListingCard } from "@/components/listings";
import { Button, Card } from "@/components/ui";
import { isApiError } from "@/lib/api/errors";
import { fetchItems } from "@/lib/api/items";
import type { Item, ItemSortOrder } from "@/lib/types";
import styles from "./SearchBrowsePage.module.css";

const CATEGORY_OPTIONS = [
  { label: "All Categories", value: "" },
  { label: "Electronics", value: "Electronics" },
  { label: "Clothing", value: "Clothing" },
  { label: "Accessories", value: "Accessories" },
  { label: "School Supplies", value: "School Supplies" },
  { label: "Sports", value: "Sports" },
  { label: "Other", value: "Other" },
] as const;

const SORT_OPTIONS: Array<{ label: string; value: ItemSortOrder }> = [
  { label: "Newest First", value: "newest" },
  { label: "Oldest First", value: "oldest" },
];

interface SearchQuery {
  category: string;
  search: string;
  sort: ItemSortOrder;
}

function normalizeSort(value: string | null): ItemSortOrder {
  return value === "oldest" ? "oldest" : "newest";
}

function readQueryParams(searchParams: URLSearchParams): SearchQuery {
  return {
    category: searchParams.get("category") ?? "",
    search: searchParams.get("search") ?? "",
    sort: normalizeSort(searchParams.get("sort")),
  };
}

function buildNextUrl(pathname: string, query: SearchQuery) {
  const params = new URLSearchParams();

  if (query.search.trim()) {
    params.set("search", query.search.trim());
  }

  if (query.category) {
    params.set("category", query.category);
  }

  if (query.sort !== "newest") {
    params.set("sort", query.sort);
  }

  const serialized = params.toString();
  return serialized.length ? `${pathname}?${serialized}` : pathname;
}

export function SearchBrowsePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isSubmitting, startTransition] = useTransition();
  const [items, setItems] = useState<Item[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const appliedQuery = useMemo(
    () => readQueryParams(searchParams),
    [searchParams],
  );
  const [searchDraft, setSearchDraft] = useState(appliedQuery.search);
  const [categoryDraft, setCategoryDraft] = useState(appliedQuery.category);
  const [sortDraft, setSortDraft] = useState<ItemSortOrder>(appliedQuery.sort);

  useEffect(() => {
    setSearchDraft(appliedQuery.search);
    setCategoryDraft(appliedQuery.category);
    setSortDraft(appliedQuery.sort);
  }, [appliedQuery.category, appliedQuery.search, appliedQuery.sort]);

  useEffect(() => {
    let ignore = false;

    async function loadItems() {
      setLoading(true);
      setError(null);

      try {
        const results = await fetchItems({
          category: appliedQuery.category || undefined,
          search: appliedQuery.search || undefined,
          sort: appliedQuery.sort,
        });

        if (!ignore) {
          setItems(results.items);
          setTotalCount(results.total);
        }
      } catch (fetchError) {
        if (ignore) {
          return;
        }

        if (isApiError(fetchError)) {
          setError(fetchError.message);
          return;
        }

        setError("We could not load listings right now. Please try again.");
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadItems();

    return () => {
      ignore = true;
    };
  }, [appliedQuery.category, appliedQuery.search, appliedQuery.sort, retryCount]);

  function applyQuery(nextQuery: SearchQuery) {
    const nextUrl = buildNextUrl(pathname, nextQuery);
    startTransition(() => {
      router.replace(nextUrl);
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyQuery({
      category: categoryDraft,
      search: searchDraft,
      sort: sortDraft,
    });
  }

  function clearFilters() {
    setSearchDraft("");
    setCategoryDraft("");
    setSortDraft("newest");
    applyQuery({ category: "", search: "", sort: "newest" });
  }

  return (
    <div className={styles.page}>
      <section aria-labelledby="browse-title" className={styles.header}>
        <h1 className={styles.title} id="browse-title">
          Search Lost Items
        </h1>
        <p className={styles.subtitle}>
          Browse items that have been found and turned in at school.
        </p>
      </section>

      <form className={styles.controlsForm} onSubmit={handleSubmit}>
        <label className={styles.searchWrap} htmlFor="search-listings">
          <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20L16.5 16.5" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
          </svg>
          <input
            id="search-listings"
            name="search"
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Search by name, description..."
            value={searchDraft}
          />
        </label>

        <label className={styles.selectWrap}>
          <span className={styles.srOnly}>Category</span>
          <select
            name="category"
            onChange={(event) => setCategoryDraft(event.target.value)}
            value={categoryDraft}
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.selectWrap}>
          <span className={styles.srOnly}>Sort by</span>
          <select
            name="sort"
            onChange={(event) => setSortDraft(normalizeSort(event.target.value))}
            value={sortDraft}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.desktopActions}>
          <Button loading={isSubmitting} size="md" type="submit">
            Apply
          </Button>
          <Button onClick={clearFilters} size="md" type="button" variant="secondary">
            Reset
          </Button>
        </div>
      </form>

      <p className={styles.resultCount} role="status">
        {loading ? "Loading items..." : `${totalCount} items found`}
      </p>

      {!loading && error ? (
        <Card className={styles.stateCard} role="alert" variant="muted">
          <h2 className={styles.stateTitle}>Could not load listings</h2>
          <p className={styles.stateText}>{error}</p>
          <div className={styles.stateActions}>
            <Button onClick={() => setRetryCount((count) => count + 1)} variant="secondary">
              Try again
            </Button>
          </div>
        </Card>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <Card className={styles.stateCard} variant="muted">
          <h2 className={styles.stateTitle}>No matching listings</h2>
          <p className={styles.stateText}>
            Try a different search term or clear filters to see more approved items.
          </p>
          <div className={styles.stateActions}>
            <Button onClick={clearFilters} variant="secondary">
              Clear filters
            </Button>
          </div>
        </Card>
      ) : null}

      {loading ? (
        <div aria-hidden="true" className={styles.loadingGrid}>
          {Array.from({ length: 5 }).map((_, index) => (
            <Card className={styles.skeletonCard} key={`skeleton-${index}`} />
          ))}
        </div>
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <div className={styles.grid}>
          {items.map((item) => (
            <ListingCard item={item} key={item.id} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
