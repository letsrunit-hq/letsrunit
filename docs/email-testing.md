---
description: Test OTP flows, activation links, and other email-based journeys.
---

# Email Testing

Letsrunit generates a deterministic email address per test scenario and polls a mailbox service until the email arrives.

## Typical scenario

```gherkin
Feature: Registration

  Scenario: User activates account via email
    Given I'm on page "/register"
    When I set field "Email" to "user@inbox.testmail.app"
    And I set field "Password" to "secret123"
    And I click button "Create account"
    Then The page contains text "Check your inbox"
    When I open the latest email
    And I click the link in the email
    Then The page contains text "Account activated"
```

## Mailbox services

{% tabs %}
{% tab title="Mailpit" %}
[Mailpit](https://mailpit.axllent.org/) is the recommended option. It runs as a lightweight SMTP server that captures all outgoing mail, and works the same way locally and in CI.

```bash
docker run -d -p 8025:8025 -p 1025:1025 axllent/mailpit
```

#### Environment variables

```bash
MAILBOX_SERVICE=mailpit
MAILPIT_BASE_URL=http://localhost:8025   # default
```

Configure your app to send mail via `localhost:1025` (Mailpit's SMTP port). In CI this is the same configuration. The service container listens on the same port.

{% endtab %}

{% tab title="Supabase" %}

Supabase local development includes **Mailpit**. Configure the SMTP settings in `supabase/config.toml` to make Mailpit available on localhost:
```toml
[inbucket]
enabled = true
port = 54324
smtp_port = 54325
```

_The configuration group is called `inbucket` for legacy reasons. Recent versions of Supabase use Mailpit instead._

#### Environment variables

```bash
MAILBOX_SERVICE=mailpit
MAILPIT_BASE_URL=http://localhost:54325
```
{% endtab %}

{% tab title="Testmail.app" %}
[Testmail.app](https://testmail.app/) is a good alternative, particularly when testing against a staging environment. Because it receives mail at real `@inbox.testmail.app` addresses, your app doesn't need its mail settings changed. It sends normally and testmail.app receives it. No SMTP interception, no staging configuration required.

#### Environment variables

```bash
MAILBOX_SERVICE=testmail
TESTMAIL_API_KEY=your_api_key
TESTMAIL_NAMESPACE=your_namespace
MAILBOX_DOMAIN=inbox.testmail.app   # default
```

Addresses take the form `<namespace>.<tag>@inbox.testmail.app`. Letsrunit generates the tag automatically per test.
{% endtab %}

{% tab title="Mailhog (legacy)" %}
[Mailhog](https://github.com/mailhog/MailHog) is supported for projects that already use it.

#### Environment variables

```bash
MAILBOX_SERVICE=mailhog
MAILHOG_BASE_URL=http://localhost:8025   # default
```
{% endtab %}
{% endtabs %}

{% hint style="info" %}
The `MAILBOX_SERVICE` variable selects the backend. If it's not set, the mailbox steps will fail with a configuration error.
{% endhint %}
