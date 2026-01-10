# Astro SMB Minimal

A minimal, production-ready Astro static site template for small businesses.

## Features

- **Static Site Generation** - Fast, secure, SEO-friendly
- **Tailwind CSS v4** - Modern utility-first styling
- **Config-Driven** - Single `config.yaml` for all settings
- **SEO Ready** - Meta tags, Open Graph, JSON-LD schema
- **Blog System** - Markdown-based with content collections
- **Contact Form** - PHP backend with email notifications
- **Admin Panel** - View form submissions
- **Mobile Responsive** - Works on all devices

## Prerequisites

Before you begin, make sure you have:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **PHP 8+** (only needed for contact form on your server)

To check your versions:
```bash
node --version   # Should show v18.x.x or higher
npm --version    # Should show 9.x.x or higher
```

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/stooky/astro-smb-minimal.git my-site
cd my-site

# Install dependencies
npm install
```

### 2. Configure Your Site

Open `config.yaml` and update with your business info:

```yaml
site:
  name: "Your Company Name"
  tagline: "Your Tagline Here"
  description: "A brief description for SEO"
  url: "https://yoursite.com"

contact:
  email: "hello@yoursite.com"
  phone: "1-800-555-0100"
  address:
    street: "123 Main Street"
    city: "Your City"
    state: "ST"
    zip: "12345"
    country: "USA"
```

### 3. Start Development

```bash
npm run dev
```

Open http://localhost:4321 in your browser. Changes auto-refresh.

### 4. Build for Production

```bash
npm run build
```

Your site is now in the `dist/` folder, ready to deploy.

## Configuration

### Main Config (`config.yaml`)

This is the single source of truth for your entire site:

| Section | What It Controls |
|---------|------------------|
| `site` | Name, tagline, description, URL |
| `contact` | Email, phone, address |
| `hours` | Business hours (displayed on contact page) |
| `social` | Social media links (leave empty to hide) |
| `navigation.main` | Header navigation links |
| `navigation.footer` | Footer link columns |

### Secrets (`config.local.yaml`)

Create this file for sensitive settings (it's git-ignored):

```yaml
email:
  resend_api_key: "re_your_api_key_here"

admin:
  secret_path: "your-secret-admin-path"
```

## Project Structure

```
my-site/
├── src/
│   ├── pages/              # Each file = one page
│   │   ├── index.astro     # Homepage (/)
│   │   ├── about.astro     # About page (/about)
│   │   ├── contact.astro   # Contact page (/contact)
│   │   ├── privacy.astro   # Privacy policy (/privacy)
│   │   ├── terms.astro     # Terms of service (/terms)
│   │   └── blog/
│   │       ├── index.astro       # Blog listing (/blog)
│   │       └── [...slug].astro   # Individual posts (/blog/post-name)
│   ├── components/         # Reusable UI pieces
│   ├── layouts/            # Page templates
│   ├── content/blog/       # Your blog posts (markdown)
│   ├── config/site.ts      # Loads config.yaml
│   └── styles/global.css   # Colors and global styles
├── api/                    # PHP backend (for hosting with PHP)
│   ├── contact.php         # Handles contact form
│   └── admin.php           # Admin panel
├── data/                   # JSON data storage
├── public/                 # Static files (images, favicon)
├── config.yaml             # Your site settings
└── config.local.yaml       # Secrets (create this)
```

## Pages Included

| Page | URL | Description |
|------|-----|-------------|
| Homepage | `/` | Main landing with hero, features, testimonials |
| About | `/about` | Company story, values, team info |
| Contact | `/contact` | Contact form + business info |
| Blog | `/blog` | List of all blog posts |
| Blog Post | `/blog/[slug]` | Individual article pages |
| Privacy | `/privacy` | Privacy policy |
| Terms | `/terms` | Terms of service |

## Customization

### Changing Colors

Edit `src/styles/global.css`:

```css
:root {
  /* Primary - your main brand color */
  --color-primary-500: #2563eb;  /* Change this */
  --color-primary-600: #1d4ed8;
  --color-primary-700: #1e40af;

  /* Secondary - accent color */
  --color-secondary-500: #0891b2;
  --color-secondary-600: #0e7490;
}
```

**Tip:** Use [Tailwind Color Generator](https://uicolors.app/create) to generate a full color palette from your brand color.

### Adding a New Page

1. Create a file in `src/pages/`, e.g., `services.astro`:

```astro
---
import Layout from '../layouts/Layout.astro';
import Section from '../components/Section.astro';
import { siteConfig } from '../config/site';
---

<Layout title="Our Services" description="What we offer">
  <Section title="Our Services">
    <p>Your content here...</p>
  </Section>
</Layout>
```

2. Add it to navigation in `config.yaml`:

```yaml
navigation:
  main:
    - name: "Services"
      href: "/services"
```

### Adding Blog Posts

Create a markdown file in `src/content/blog/`:

```markdown
---
title: "Your Post Title"
description: "A brief summary for SEO and previews"
pubDate: 2024-01-15
author: "Your Name"
image: "/images/blog/your-image.jpg"
imageAlt: "Description of the image"
tags: ["tips", "guide"]
draft: false
---

Your article content here. Supports **bold**, *italic*, [links](https://example.com), and more.

## Subheadings Work

So do lists:
- Item one
- Item two
```

### Adding Images

1. Place images in `public/images/`
2. Reference them with `/images/your-image.jpg`

For blog post images, use `public/images/blog/`.

## Contact Form Setup

The contact form works out of the box for development. For production:

### Option 1: Resend API (Recommended)

1. Sign up at [resend.com](https://resend.com) (free tier: 3,000 emails/month)
2. Create an API key
3. Add to `config.local.yaml`:

```yaml
email:
  resend_api_key: "re_your_key_here"
  from_email: "Your Company <hello@yourdomain.com>"
```

4. Verify your domain in Resend dashboard

### Option 2: PHP mail()

Works without setup but emails often land in spam. Not recommended for production.

### Form Security

Built-in protections:
- **Honeypot field** - Catches most spam bots
- **Rate limiting** - 10 submissions per IP per hour
- **Server-side validation** - Never trusts client input

## Admin Panel

View form submissions at:
```
https://yoursite.com/api/admin.php?key=YOUR_SECRET_PATH
```

Set `YOUR_SECRET_PATH` in `config.yaml` under `admin.secret_path`. Use something hard to guess.

## Deployment

### Option 1: Static Hosting (Vercel, Netlify, Cloudflare Pages)

These platforms auto-build from GitHub:

1. Push your code to GitHub
2. Connect repo to Vercel/Netlify
3. Set build command: `npm run build`
4. Set output directory: `dist`

**Note:** Contact form won't work (no PHP). Use a form service like Formspree instead.

### Option 2: Traditional Hosting (with PHP)

For hosts like SiteGround, Bluehost, or your own server:

1. Build locally:
```bash
npm run build
```

2. Upload these folders to your server:
   - `dist/` → your web root (e.g., `public_html/`)
   - `api/` → next to or inside web root
   - `config.yaml` → server root (not web-accessible)
   - `data/` → server root (not web-accessible)

3. Configure your web server to serve `dist/` as the document root

### Option 3: VPS (DigitalOcean, Linode, etc.)

See [full deployment guide](#) for nginx configuration.

## Troubleshooting

### "npm install" fails
- Make sure Node.js 18+ is installed
- Delete `node_modules` and `package-lock.json`, then run `npm install` again

### Changes not showing
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Restart dev server: `Ctrl+C` then `npm run dev`

### Contact form not sending
- Check `config.local.yaml` exists with valid Resend API key
- Verify domain is verified in Resend dashboard
- Check browser console for errors

### Build errors
- Run `npm run build` and read the error message
- Most common: missing image file or broken import

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Astro 5 |
| Styling | Tailwind CSS 4 |
| Types | TypeScript |
| Backend | PHP 8 |
| Email | Resend API |

## Getting Help

- **Astro Docs:** https://docs.astro.build
- **Tailwind Docs:** https://tailwindcss.com/docs
- **Issues:** https://github.com/stooky/astro-smb-minimal/issues

## License

MIT License - use it for anything, free or commercial.
