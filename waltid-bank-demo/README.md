<div align="center">
<img src="../assets/walt-banner.png" alt="walt.id banner" />

  <p>White label bank demo app<span>by </span><a href="https://walt.id">walt.id</a></p>

<a href="https://walt.id/community">
<img src="https://img.shields.io/badge/Join-The Community-blue.svg?style=flat" alt="Join community!" />
</a>
<a href="https://www.linkedin.com/company/walt-id/">
<img src="https://img.shields.io/badge/-LinkedIn-0072b1?style=flat&logo=linkedin" alt="Follow walt_id" />
</a>
</div>

## Use cases shown

- Issuance of an EU PID
- Verification of an EU PID for opening an account

<br />

- Issuance of a SCA credential
- Verification of an SCA for (mock) online payment

<br />

- Issuance of a tax credential (SDJWT)
- Verification of a tax credential and PID for Applying for a loan

## Customization

This demo is designed to be easily whitelabeled for different banks. You can customize the branding by modifying a few configuration files.

### Bank Name and Text

Edit `lib/branding.ts` to change:

- **name**: The bank's display name
- **tagline**: Short tagline shown in the hero section
- **description**: Longer description for metadata
- **logo**: Path to the logo file (relative to `/public`)
- **logoAlt**: Alt text for the logo
- **copyright**: Name shown in the footer copyright
- **contact.name**: Name shown in the contact section

Example:

```typescript
export const branding = {
  name: "Your Bank Name",
  tagline: "Your Tagline Here",
  description: "Your bank description for SEO.",
  logo: "/your-logo.svg",
  logoAlt: "Your Bank Name",
  copyright: "Your Bank Name",
  contact: {
    name: "Your Bank Name",
  },
  metadata: {
    title: "Your Bank Name - Your Tagline",
    description: "Your bank description for SEO.",
  },
};
```

### Theme Colors

Edit the CSS variables in `app/globals.css` under the `:root` selector:

```css
:root {
  /* Bank Brand Colors - Customize these for different banks */
  --brand-primary: #1E40AF;        /* Primary brand color - buttons, headings, borders */
  --brand-primary-light: #3B82F6;  /* Lighter variant - hover states, secondary elements */
  --brand-primary-dark: #1E3A8A;   /* Darker variant - active states */
  --brand-accent: #60A5FA;         /* Accent color - gradients, highlights */
}
```

Color usage throughout the app:
- `--brand-primary`: Main brand color used for buttons, headings, borders, and primary UI elements
- `--brand-primary-light`: Used for hover states and secondary elements
- `--brand-primary-dark`: Used for active/pressed states
- `--brand-accent`: Used in gradients and accent highlights

### Logo

Replace `public/bank-logo.svg` with your bank's logo. Recommended specifications:
- Format: SVG (preferred) or PNG
- Dimensions: 200x50px (or similar aspect ratio)
- The logo should work well on a white background

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


### EUDI wallet

Download APK: https://drive.google.com/file/d/1G8mZhU5qTX46Zrkq5pehoaeaj0KNbSKF/view?usp=drive_link

Issuer Key:
{
  "kid": "Cf3QQYfWsQqyVALNCDiSKiUVbpzKk7FX70qTKyklt6o",
  "crv": "P-256",
  "d": "nR-TYUS5bU9QbiIvqKwV5tIC4S37AW6Yq2pG8rlc6TE",
  "kty": "EC",
  "x": "5AxZuqb4O8M7VFE-xVjNs1za-B1U7D3NmG76f7w1mqo",
  "y": "MbW-qJuXQZ2rxiUzIvzqtQHITjSozNGHmyNbN9b1JxM"
}


Issuer Cert:
"-----BEGIN CERTIFICATE-----\nMIIBljCCAT2gAwIBAgIUP/xM+biohoGvcYdfgGxd0CQBT28wCgYIKoZIzj0EAwIwFTETMBEGA1UEAwwKQ3VzdG9tUm9vdDAeFw0yNjAxMjYxMDAxMTFaFw0yNzAxMjYxMDAxMTFaMB0xGzAZBgNVBAMMEkN1c3RvbUludGVybWVkaWF0ZTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABOQMWbqm+DvDO1RRPsVYzbNc2vgdVOw9zZhu+n+8NZqqMbW+qJuXQZ2rxiUzIvzqtQHITjSozNGHmyNbN9b1JxOjYzBhMA8GA1UdEwEB/wQFMAMBAf8wDgYDVR0PAQH/BAQDAgEGMB0GA1UdDgQWBBRHt/+svL7jM/XYPvNMjwWM3JlYSjAfBgNVHSMEGDAWgBRHCT92dpAI1vlPm7tTUfYYjgkfwDAKBggqhkjOPQQDAgNHADBEAiALQcUEt5xjuTdYRZ+flY2dXXr7lW961XTJbxQsSDSJxQIgHK8ZyQrwkMjfze81axgISEmb+AZBUY8LCPtJ8MpNcWI=\n-----END CERTIFICATE-----\n"


Verifier Key:
{
    "crv": "P-256",
    "d": "-R82hNrYqfJ0zXpuGPq3SluDIS5tdvWRTgsJAZlD9OE",
    "kty": "EC",
    "x": "hKBLvu3Ffs963jdEQGVEmimmeUogqBZYJ3RI_gK6zyo",
    "y": "EKfH2Jr1tC5XIZNKeg3mMHrJ1nt0odTpA6Wr2jxQj88"
}


Verifier x5c chain:
[ "MIIBqjCCAVCgAwIBAgIUUaMjsQ+LpqmQSXz/y/zFyopMXIMwCgYIKoZIzj0EAwIwHTEbMBkGA1UEAwwSQ3VzdG9tSW50ZXJtZWRpYXRlMB4XDTI2MDQyMjEzMjUzNloXDTI3MDQyMjEzMjUzNlowEzERMA8GA1UEAwwIVmVyaWZpZXIwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAASEoEu+7cV+z3reN0RAZUSaKaZ5SiCoFlgndEj+ArrPKhCnx9ia9bQuVyGTSnoN5jB6ydZ7dKHU6QOlq9o8UI/Po3gwdjAMBgNVHRMBAf8EAjAAMA4GA1UdDwEB/wQEAwIHgDAWBgNVHREEDzANggtleGFtcGxlLmNvbTAdBgNVHQ4EFgQUe8FQHtuN1sXBw0wOvgSOcqiMKBcwHwYDVR0jBBgwFoAUR7f/rLy+4zP12D7zTI8FjNyZWEowCgYIKoZIzj0EAwIDSAAwRQIhAOOkDRYIsp+nu0h55OCGBM8+hIYTH/qLnwzWedqC6HKdAiAkeD5GF2Wiz33WzCLFLnc+ASCo79bBFXoGfd+XGaEgxg==", "MIIBljCCAT2gAwIBAgIUP/xM+biohoGvcYdfgGxd0CQBT28wCgYIKoZIzj0EAwIwFTETMBEGA1UEAwwKQ3VzdG9tUm9vdDAeFw0yNjAxMjYxMDAxMTFaFw0yNzAxMjYxMDAxMTFaMB0xGzAZBgNVBAMMEkN1c3RvbUludGVybWVkaWF0ZTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABOQMWbqm+DvDO1RRPsVYzbNc2vgdVOw9zZhu+n+8NZqqMbW+qJuXQZ2rxiUzIvzqtQHITjSozNGHmyNbN9b1JxOjYzBhMA8GA1UdEwEB/wQFMAMBAf8wDgYDVR0PAQH/BAQDAgEGMB0GA1UdDgQWBBRHt/+svL7jM/XYPvNMjwWM3JlYSjAfBgNVHSMEGDAWgBRHCT92dpAI1vlPm7tTUfYYjgkfwDAKBggqhkjOPQQDAgNHADBEAiALQcUEt5xjuTdYRZ+flY2dXXr7lW961XTJbxQsSDSJxQIgHK8ZyQrwkMjfze81axgISEmb+AZBUY8LCPtJ8MpNcWI=", "MIIBfzCCASWgAwIBAgIUXEIqXLJxKNw4fyB6Refg+3/jDhkwCgYIKoZIzj0EAwIwFTETMBEGA1UEAwwKQ3VzdG9tUm9vdDAeFw0yNjAxMjYxMDAxMDJaFw0zNjAxMjQxMDAxMDJaMBUxEzARBgNVBAMMCkN1c3RvbVJvb3QwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAT14hxuShArxQSyzsB6dA88PkqZt6YAZtbZ5dd0HUbI+nN6ukGILX/6cQU1xz3R/CHxGZAFPGGM/XZuSUzcP2+no1MwUTAdBgNVHQ4EFgQURwk/dnaQCNb5T5u7U1H2GI4JH8AwHwYDVR0jBBgwFoAURwk/dnaQCNb5T5u7U1H2GI4JH8AwDwYDVR0TAQH/BAUwAwEB/zAKBggqhkjOPQQDAgNIADBFAiEArRWF0pUU1BSVGAdztPJjU/IGJ2b3mti1fuPzdpikidACIExOxRV/P41YaxYWhjVUZgnVXD7z8Z1Mrfa0MMvZi0ZG" ]