# Mailbox Package (`@letsrunit/mailbox`)

## Installation

```bash
npm install @letsrunit/mailbox
# or
yarn add @letsrunit/mailbox
```

Utilities for interacting with mailbox services to test email-based flows (OTP, activation links, etc.). It supports multiple backends for both local development and production environments.

## Exported Functions

### `getMailbox(seed, name?, domain?)`

Generates a deterministic email address based on a seed (UUID).

- **`seed`**: A UUID used to ensure the email is unique but reproducible.
- **`name`**: Optional sub-address name.
- **`domain`**: Optional domain. Defaults to the configured `MAILBOX_DOMAIN`.

### `receiveMail(emailAddress, options)`

Retrieves emails sent to a specific address.

- **`emailAddress`**: The address to check.
- **`options`**:
    - `timeout`: How long to wait for emails.
    - `until`: A predicate function to stop polling when an email is found.

### `toEml(email)`

Converts an `Email` object into a string representation in `.eml` format.

### `fromEml(email)`

Convert a string in `.eml` from to an `Email` object.

## Supported Services

The package automatically selects the service based on the `MAILBOX_SERVICE` environment variable.

### [Mailpit](https://mailpit.axllent.org/)
Recommended for local development. It provides a fast, lightweight way to capture and view emails.
- **Environment Variables**: `MAILPIT_BASE_URL` (defaults to `http://localhost:8025`).

### [Testmail.app](https://testmail.app/)
Recommended for production/GCP. It provides infinite private email addresses and a powerful GraphQL API.
- **Environment Variables**: `TESTMAIL_API_KEY`, `TESTMAIL_NAMESPACE`, `MAILBOX_DOMAIN` (optional, defaults to `inbox.testmail.app`).

### [Mailhog](https://github.com/mailhog/MailHog)
Supported for legacy environments.
- **Environment Variables**: `MAILHOG_BASE_URL` (defaults to `http://localhost:8025`).

## Testing

Run tests for this package:

```bash
yarn test
```
