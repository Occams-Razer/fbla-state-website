import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SearchBrowsePage } from "@/components/search";

export default function SearchPage() {
  return (
    <AppShell>
      <Suspense fallback={<p style={{ padding: "1.5rem" }}>Loading search...</p>}>
        <SearchBrowsePage />
      </Suspense>
    </AppShell>
  );
}
