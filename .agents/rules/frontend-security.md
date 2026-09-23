---
description: Mandatory secure frontend development practices for NEXAWIS modules and the Dashboard.
---

# Secure Frontend Development

Even though we are currently building only the frontend, implement the UI using secure-by-default development practices.

**IMPORTANT:**
Frontend security does NOT replace backend authorization or validation. Never assume that hiding a UI element, route, or button provides real security. Backend/API authorization will remain the final security boundary.

## 1. INPUT HANDLING
- Never insert user-controlled content directly into HTML.
- Use React's normal escaped rendering.
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary.
- If HTML rendering is genuinely required, sanitize the content with an established sanitization library before rendering.
- Validate and normalize form inputs on the client for usability, but assume all client-side validation can be bypassed.
- Never trust URL parameters, query parameters, `localStorage` values, or user-provided data.

## 2. XSS PROTECTION
- Do not use unsafe HTML injection.
- Avoid dynamically constructing HTML from user input.
- Do not execute strings as JavaScript.
- Never use `eval()`, `new Function()`, or similar dynamic code execution.
- Sanitize any rich-text/HTML content before displaying it.

## 3. AUTHENTICATION & AUTHORIZATION
- Use the existing authentication system rather than creating a custom authentication mechanism.
- Do not store passwords in frontend code or browser storage.
- Never expose authentication secrets, private API keys, database credentials, service-role keys, or signing secrets in client-side code.
- Never put sensitive secrets in `NEXT_PUBLIC_*` or other publicly exposed environment variables.
- UI route protection should be implemented for user experience, but actual authorization must be enforced by the backend/server.

## 4. TOKENS & SESSION DATA
- Do not unnecessarily store authentication tokens in `localStorage`/`sessionStorage`.
- Prefer the authentication provider's secure session mechanism.
- If authentication cookies are used, rely on secure server-managed cookies where applicable.
- Never expose tokens in URLs, query parameters, logs, analytics events, or error messages.

## 5. API COMMUNICATION
- Centralize API requests through a secure API/service layer instead of scattering fetch logic throughout components.
- Use HTTPS endpoints in production.
- Do not hardcode API keys, credentials, or private endpoints.
- Handle API errors without exposing internal server details to users.
- Do not trust HTTP status/data from the frontend as proof of authorization.
- Never send unnecessary employee/project data to the browser.

## 6. SENSITIVE DATA
NEXAWIS may eventually handle workforce-related information. Therefore:
- Do not expose unnecessary employee personal information in UI state.
- Avoid displaying sensitive information in URLs.
- Do not place sensitive data in `console.log()`.
- Do not include sensitive information in client-side analytics/events.
- Avoid persisting sensitive employee/project data in `localStorage`.
- Mask sensitive information where appropriate.
- Only request/render the data required for the current page.

## 7. ERROR HANDLING
- Show clean user-friendly error messages.
- Never expose stack traces, database errors, SQL errors, internal paths, API keys, tokens, or implementation details.
- Log only safe diagnostic information during development.
- Remove debug logging before production where it could expose sensitive information.

## 8. DEPENDENCIES
- Use reputable, maintained packages.
- Do not add unnecessary dependencies.
- Prefer existing project dependencies when they already provide the required functionality.
- Avoid packages with unnecessary access to sensitive browser capabilities.
- Keep dependencies reasonably up to date.
- Do not disable security warnings simply to make the build pass.

## 9. ROUTING & ACCESS
- Protect authenticated application routes using the existing authentication architecture.
- Do not rely only on client-side route checks for authorization.
- Handle unauthorized/expired sessions gracefully.
- Do not reveal protected page data before authentication is confirmed.
- Avoid exposing internal route information unnecessarily.

## 10. SECURITY HEADERS / PLATFORM CONFIGURATION
Where supported by the existing framework/deployment architecture, prepare the frontend for security headers such as:
- `Content-Security-Policy`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `Strict-Transport-Security` in production HTTPS environments

Do not add an overly restrictive CSP that breaks legitimate application functionality. Configure it based on the actual resources used by the application.

## 11. FORMS
For every form:
- Validate required fields.
- Enforce reasonable input length limits.
- Prevent accidental duplicate submissions.
- Show safe validation errors.
- Do not expose backend validation details.
- Do not store submitted sensitive information unnecessarily.
- Disable/guard submit actions appropriately while requests are processing.

## 12. CLIENT-SIDE STORAGE
Before using `localStorage`/`sessionStorage`/cookies for application state, ask:
*"Does this data actually need to persist?"*

Do not store:
- Passwords
- API secrets
- Private keys
- Sensitive authentication tokens
- Sensitive employee information

Use storage only for appropriate non-sensitive preferences such as:
- Theme preference
- Non-sensitive UI preferences

## 13. URL & NAVIGATION SAFETY
- Do not blindly redirect users to arbitrary URLs supplied through query parameters.
- Validate external URLs before using them.
- Use safe navigation methods.
- Do not construct executable URLs from user-controlled input.

## 14. FILE UPLOADS
If any future frontend module supports file uploads:
- Restrict accepted file types.
- Restrict file size.
- Do not trust the client-provided MIME type alone.
- Treat uploaded files as untrusted.
- Do not execute uploaded files.
- Actual file validation must also happen server-side.

## 15. SECURITY + UX BALANCE
Security should not make the UI unnecessarily difficult to use. Implement:
- Clear authentication states
- Loading states
- Unauthorized states
- Session-expired states
- Safe error states
- Empty states
...without exposing sensitive implementation details.

## 16. DEVELOPMENT HYGIENE
Before completing the module:
- Search for accidentally hardcoded secrets.
- Search for API keys/tokens/passwords.
- Search for `console.log` statements containing potentially sensitive data.
- Check for unsafe HTML rendering.
- Check for unsafe dynamic URLs.
- Check that environment variables intended to remain private are not exposed to the client.
- Check that new dependencies are necessary.
- Check that TypeScript types prevent obvious unsafe data handling where applicable.

## 17. IMPORTANT SECURITY PRINCIPLE
NEVER implement fake frontend security such as:
```javascript
if (user.isAdmin) {
   showAdminButton();
}
```
and assume the resource is protected. UI visibility is only a UX feature.

Real authorization must ultimately be enforced by the backend/API/database/security layer.

For the frontend, our responsibility is:
- Minimize exposed data
- Safely render data
- Safely handle user input
- Avoid leaking secrets
- Handle authentication states correctly
- Communicate with APIs safely
- Avoid introducing XSS/client-side vulnerabilities
- Keep the application secure-by-default
