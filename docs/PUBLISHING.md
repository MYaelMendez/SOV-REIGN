# Public review is not deployment

The existing monosite and OpenAI Site remain untouched. There is no CNAME, Pages deployment action, provider token, auto-merge or public-site provisioning in this repository.

## Review sequence

1. Inspect the implementation diff and MIT license proposal.
2. Run `npm run check` on Node.js 22 or newer and review all output.
3. Run `npm start` and test the real page on desktop and mobile browsers, including consent invalidation, reload, downloads, keyboard access and privacy.
4. Review the exact public artifact and ensure the named public fields contain no private data.
5. Obtain separate explicit human approval for the destination, files and revision to publish.
6. Configure hosting using that destination's supported mechanism. Verify the rendered URL, assets, certificate and security headers independently.
7. Record the actual deployment revision and result, separate from the local unsigned receipt.

The manual validation workflow does not deploy. GitHub may require its workflow to be on the default branch before it can be dispatched; do not interpret a prepared workflow as a successful Actions run.

A static host may not reproduce the local server's security headers. Review the target host before release. JavaScript and Web Crypto require a supported secure browser context such as HTTPS or localhost.
