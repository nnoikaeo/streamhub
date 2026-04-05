/**
 * Pre-deploy script for Firebase Cloud Functions.
 *
 * Nuxt build generates .output/server/package.json with platform-specific
 * packages (e.g. @img/sharp-darwin-arm64) that break Cloud Build on Linux x64.
 * This script removes those packages and creates the files needed for
 * Firebase CLI to discover and deploy the Cloud Function correctly.
 *
 * Run automatically via `npm run deploy` (predeploy hook).
 * Can also be run manually: `node scripts/prepare-firebase-deploy.mjs`
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const serverDir = resolve(root, '.output/server')

// 1. Verify build output exists
if (!existsSync(serverDir)) {
  console.error('❌ .output/server not found — run `npm run build` first')
  process.exit(1)
}

// 2. Remove platform-specific packages from package.json
const pkgPath = resolve(serverDir, 'package.json')
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))

const PLATFORM_SPECIFIC_PATTERNS = [
  'darwin', 'linux-arm64', 'linux-arm', 'linux-ppc64',
  'linux-s390x', 'linux-x64', 'win32', 'freebsd',
  '@img/sharp-',
]

let removed = 0
for (const key of Object.keys(pkg.dependencies || {})) {
  if (PLATFORM_SPECIFIC_PATTERNS.some(p => key.includes(p))) {
    delete pkg.dependencies[key]
    removed++
  }
}

writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))
if (removed > 0) {
  console.log(`✅ Removed ${removed} platform-specific package(s) from .output/server/package.json`)
}

// 3. Create .gcloudignore to exclude local node_modules from Cloud Build upload
//    Cloud Build will run a clean npm install on Linux instead.
const gcloudignorePath = resolve(serverDir, '.gcloudignore')
writeFileSync(gcloudignorePath, 'node_modules/\n')
console.log('✅ Created .output/server/.gcloudignore (excludes node_modules from upload)')

// 4. Create functions.yaml so Firebase CLI discovers functions via YAML
//    (avoids requiring firebase-functions to be importable locally)
//    Reads environmentVariables and secretEnvironmentVariables from firebase.json
//    so Cloud Functions runtime gets all configured env vars at startup.
const firebaseJsonPath = resolve(root, 'firebase.json')
const firebaseConfig = JSON.parse(readFileSync(firebaseJsonPath, 'utf8'))
const fnConfig = (firebaseConfig.functions || [])[0] || {}

// Build environmentVariables YAML block from firebase.json
const envVars = fnConfig.environmentVariables || {}
const envVarEntries = Object.entries(envVars)
let envVarsYaml = ''
if (envVarEntries.length > 0) {
  envVarsYaml = '    environmentVariables:\n'
  for (const [key, value] of envVarEntries) {
    envVarsYaml += `      ${key}: "${value}"\n`
  }
}

// Build secretEnvironmentVariables YAML block from firebase.json
const secretEnvVars = fnConfig.secretEnvironmentVariables || []
let secretEnvVarsYaml = ''
if (secretEnvVars.length > 0) {
  secretEnvVarsYaml = '    secretEnvironmentVariables:\n'
  for (const secret of secretEnvVars) {
    secretEnvVarsYaml += `      - key: ${secret.key}\n`
  }
}

const functionsYamlPath = resolve(serverDir, 'functions.yaml')
const functionsYaml = `specVersion: v1alpha1
endpoints:
  server:
    platform: gcfv2
    region:
      - us-central1
    labels: {}
    httpsTrigger: {}
    entryPoint: server
    timeoutSeconds: 60
    availableMemoryMb: 1024
${envVarsYaml}${secretEnvVarsYaml}`
writeFileSync(functionsYamlPath, functionsYaml)
console.log(`✅ Created .output/server/functions.yaml (${envVarEntries.length} env vars, ${secretEnvVars.length} secrets)`)

console.log('\n🚀 Firebase deploy pre-flight checks complete.')
