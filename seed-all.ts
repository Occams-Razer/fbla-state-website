import { execSync } from "node:child_process";

function run(command: string) {
  execSync(command, { stdio: "inherit" });
}

run("npx tsx ./seed.ts");
run("npx tsx ./seed-items.ts");
