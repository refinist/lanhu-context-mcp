# Get a Lanhu Token

The Lanhu token used here is the full value copied from the browser `Cookie` request header.

## Prerequisites

- You can log in to Lanhu successfully
- Chrome is recommended

## Steps

1. Open `https://lanhuapp.com` and make sure you are logged in
2. Open browser developer tools and switch to `Network`
3. Refresh the page
4. Click any request whose domain is `lanhuapp.com`
5. In `Headers`, find the `Request Headers` section and locate `Cookie`
6. Copy only the full value after `Cookie:` and do not include the `Cookie:` label itself. That full value is the token used here

Once you have the token, follow the [environment variable step in Getting Started](/en/guide/getting-started#step-1-prepare-environment-variables).

::: warning Note
Tokens do expire. If authentication starts failing, Lanhu asks you to log in again, or requests suddenly stop working, log in again and copy a fresh one.
:::

::: danger Security warning
Your Lanhu token is effectively a login credential. Do not commit it to a public repository, do not share it with other people, and use it only in your local environment.
:::
