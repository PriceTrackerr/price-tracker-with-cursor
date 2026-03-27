==> Cloning from https://github.com/PriceTrackerr/price-tracker-with-cursor
==> Checking out commit ed6403f1418b793f8f45bcea69f72cfd33d53999 in branch main
==> Using Node.js version 22.22.0 (default)
==> Docs on specifying a Node.js version: https://render.com/docs/node-version
==> Running build command 'npm install && npm run build'...
added 1432 packages, and audited 1484 packages in 1m
192 packages are looking for funding
  run `npm fund` for details
53 vulnerabilities (12 low, 9 moderate, 30 high, 2 critical)
To address issues that do not require attention, run:
  npm audit fix
To address all issues (including breaking changes), run:
  npm audit fix --force
Run `npm audit` for details.
> real-price-tracker@1.0.0 build
> npm run build --workspaces
> price-tracker-extension@1.0.0 build
> webpack --mode=production
CLI for webpack must be installed.
  webpack-cli (https://github.com/webpack/webpack-cli)
We will use "npm" to install the CLI via "npm install -D webpack-cli".
Do you want to install 'webpack-cli' (yes/no): npm error Lifecycle script `build` failed with error:
npm error code 1
npm error path /opt/render/project/src/extension
npm error workspace price-tracker-extension@1.0.0
npm error location /opt/render/project/src/extension
npm error command failed
npm error command sh -c webpack --mode=production
> price-tracker-web@1.0.0 build
> cross-env NODE_ENV=production npx tsc && vite build
vite v7.2.4 building client environment for production...
transforming...
Browserslist: browsers data (caniuse-lite) is 9 months old. Please run:
  npx update-browserslist-db@latest
  Why you should do it regularly: https://github.com/browserslist/update-db#readme
✓ 2605 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                     0.90 kB │ gzip:   0.50 kB
dist/assets/index-B6IJCy3I.css     79.87 kB │ gzip:  12.54 kB
dist/assets/index-DY-KHcUL.js   1,268.13 kB │ gzip: 354.65 kB
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 6.57s
> price-tracker-backend@1.0.0 build
> tsc
==> Build failed 😞
==> Common ways to troubleshoot your deploy: https://render.com/docs/troubleshooting-deploys