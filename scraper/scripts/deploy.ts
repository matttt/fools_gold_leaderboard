
import { execSync } from "child_process";

function run(cmd: string) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

// Parse version/tag from CLI or generate one
const rawVersion = process.argv[2];
const version = rawVersion
  ? rawVersion
  : `v${new Date().toISOString().replace(/[:.]/g, "-")}`;

// Configuration via ENV or defaults
const projectId = process.env.GCP_PROJECT_ID || "celestial-gist-216505";
const region = process.env.ARTIFACT_REGISTRY_REGION || "us-central1";
const repo = process.env.ARTIFACT_REGISTRY_REPO || "fg-api-repo";
const imageName = process.env.IMAGE_NAME || "fg-scraper";

// Build, tag, and push
run(`docker build -t ${imageName} --platform=linux/amd64 .`);

const target = `${region}-docker.pkg.dev/${projectId}/${repo}/${imageName}:${version}`;
run(`docker tag ${imageName} ${target}`);
run(`docker push ${target}`);

console.log(`\n✅ Deployed ${imageName}:${version} to ${target}`);
