#!/usr/bin/env npx tsx
/**
 * Site Setup Script
 *
 * Interactive CLI to configure a new site from the Astro SMB Minimal template.
 *
 * Usage: npm run setup
 *
 * Features:
 * - Optional website crawl to pre-fill business data
 * - Interactive prompts for all configuration
 * - Logo and favicon generation
 * - Template blog post creation
 */

import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { execSync, spawn } from 'child_process';
import * as YAML from 'yaml';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Setup data structure
interface SetupData {
  business: {
    name: string;
    legalName: string;
    tagline: string;
    description: string;
    yearFounded: number;
    industry: string;
  };
  site: {
    url: string;
    locale: string;
    timezone: string;
  };
  contact: {
    email: string;
    phone: string;
    phoneRaw: string;
    address: {
      street: string;
      suite: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
    serviceArea: string;
  };
  social: {
    facebook: string;
    instagram: string;
    twitter: string;
    linkedin: string;
    youtube: string;
    yelp: string;
    googleBusiness: string;
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
  cta: {
    primaryText: string;
    primaryUrl: string;
  };
}

// Default values
const defaults: SetupData = {
  business: {
    name: 'Acme Corp',
    legalName: '',
    tagline: 'Quality Solutions for Your Business',
    description: '',
    yearFounded: new Date().getFullYear(),
    industry: 'general',
  },
  site: {
    url: 'https://acme.com',
    locale: 'en-US',
    timezone: 'America/New_York',
  },
  contact: {
    email: 'hello@acme.com',
    phone: '(555) 555-0100',
    phoneRaw: '+15555550100',
    address: {
      street: '123 Main Street',
      suite: '',
      city: 'Springfield',
      state: 'ST',
      zip: '12345',
      country: 'USA',
    },
    serviceArea: '',
  },
  social: {
    facebook: '',
    instagram: '',
    twitter: '',
    linkedin: '',
    youtube: '',
    yelp: '',
    googleBusiness: '',
  },
  branding: {
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
    accentColor: '#f59e0b',
  },
  cta: {
    primaryText: 'Get Started',
    primaryUrl: '/contact',
  },
};

class SetupWizard {
  private rl: readline.Interface;
  private data: SetupData;
  private projectRoot: string;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    this.data = JSON.parse(JSON.stringify(defaults));
    this.projectRoot = process.cwd();
  }

  // Utility functions
  private print(message: string, color: string = '') {
    console.log(color ? `${color}${message}${colors.reset}` : message);
  }

  private printHeader(title: string) {
    console.log('');
    console.log(`${colors.cyan}${'═'.repeat(60)}${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}  ${title}${colors.reset}`);
    console.log(`${colors.cyan}${'═'.repeat(60)}${colors.reset}`);
    console.log('');
  }

  private printSuccess(message: string) {
    this.print(`✓ ${message}`, colors.green);
  }

  private printInfo(message: string) {
    this.print(`ℹ ${message}`, colors.blue);
  }

  private printWarning(message: string) {
    this.print(`⚠ ${message}`, colors.yellow);
  }

  private async prompt(question: string, defaultValue: string = ''): Promise<string> {
    const defaultHint = defaultValue ? ` ${colors.dim}(${defaultValue})${colors.reset}` : '';
    return new Promise((resolve) => {
      this.rl.question(`${question}${defaultHint}: `, (answer) => {
        resolve(answer.trim() || defaultValue);
      });
    });
  }

  private async promptYesNo(question: string, defaultYes: boolean = true): Promise<boolean> {
    const hint = defaultYes ? '[Y/n]' : '[y/N]';
    const answer = await this.prompt(`${question} ${hint}`, '');
    if (answer === '') return defaultYes;
    return answer.toLowerCase().startsWith('y');
  }

  private async promptChoice(question: string, choices: string[], defaultIndex: number = 0): Promise<string> {
    console.log(`\n${question}`);
    choices.forEach((choice, i) => {
      const marker = i === defaultIndex ? `${colors.green}→${colors.reset}` : ' ';
      console.log(`  ${marker} ${i + 1}. ${choice}`);
    });
    const answer = await this.prompt('Enter number', String(defaultIndex + 1));
    const index = parseInt(answer) - 1;
    return choices[index] || choices[defaultIndex];
  }

  // Banner
  private printBanner() {
    console.log('');
    console.log(`${colors.blue}${colors.bright}`);
    console.log('  ╔═══════════════════════════════════════════════════════╗');
    console.log('  ║                                                       ║');
    console.log('  ║     🚀 Astro SMB Minimal - Site Setup                ║');
    console.log('  ║                                                       ║');
    console.log('  ╚═══════════════════════════════════════════════════════╝');
    console.log(`${colors.reset}`);
    console.log(`${colors.dim}  Configure your new website in minutes${colors.reset}`);
    console.log('');
  }

  // CSP Integration - Extract data from existing website
  private async extractFromWebsite(url: string): Promise<Partial<SetupData> | null> {
    this.printInfo('Extracting data from website...');

    // Find CSP installation
    const cspPaths = [
      path.join(this.projectRoot, '..', '..', 'muchstars', 'agents', 'Captain Scrapey Pants (CSP)'),
      path.join(process.env.HOME || '', 'dev', 'muchstars', 'agents', 'Captain Scrapey Pants (CSP)'),
      'C:\\dev\\muchstars\\agents\\Captain Scrapey Pants (CSP)',
    ];

    let cspPath = '';
    for (const p of cspPaths) {
      if (fs.existsSync(path.join(p, 'csp.py'))) {
        cspPath = p;
        break;
      }
    }

    if (!cspPath) {
      this.printWarning('Captain Scrapey Pants not found. Skipping website extraction.');
      this.printInfo('You can install it from: https://github.com/your-repo/csp');
      return null;
    }

    const outputFile = path.join(this.projectRoot, '.extracted_data.json');

    try {
      // Run CSP extract command
      this.print(`  Crawling ${url}...`, colors.dim);
      execSync(
        `python csp.py extract "${url}" --no-playwright -o "${outputFile}"`,
        { cwd: cspPath, stdio: 'pipe', timeout: 120000 }
      );

      if (fs.existsSync(outputFile)) {
        const extracted = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
        fs.unlinkSync(outputFile); // Clean up

        // Map extracted data to our format
        const mapped: Partial<SetupData> = {
          business: {
            name: extracted.business?.name || '',
            legalName: extracted.business?.name || '',
            tagline: extracted.business?.tagline || '',
            description: extracted.business?.description || '',
            yearFounded: extracted.business?.year_founded || new Date().getFullYear(),
            industry: 'general',
          },
          contact: {
            email: extracted.contact?.email || '',
            phone: extracted.contact?.phone || '',
            phoneRaw: extracted.contact?.phone_raw || '',
            address: {
              street: extracted.contact?.address?.street || '',
              suite: '',
              city: extracted.contact?.address?.city || '',
              state: extracted.contact?.address?.state || '',
              zip: extracted.contact?.address?.zip || '',
              country: extracted.contact?.address?.country || 'USA',
            },
            serviceArea: '',
          },
          social: {
            facebook: extracted.social?.facebook || '',
            instagram: extracted.social?.instagram || '',
            twitter: extracted.social?.twitter || '',
            linkedin: extracted.social?.linkedin || '',
            youtube: extracted.social?.youtube || '',
            yelp: extracted.social?.yelp || '',
            googleBusiness: extracted.social?.google_business || '',
          },
          branding: {
            primaryColor: extracted.colors?.primary || '#2563eb',
            secondaryColor: extracted.colors?.secondary || '#1e40af',
            accentColor: extracted.colors?.accent || '#f59e0b',
          },
        };

        this.printSuccess('Data extracted successfully!');

        // Show what was found
        if (mapped.business?.name) this.print(`  • Business: ${mapped.business.name}`, colors.dim);
        if (mapped.contact?.phone) this.print(`  • Phone: ${mapped.contact.phone}`, colors.dim);
        if (mapped.contact?.email) this.print(`  • Email: ${mapped.contact.email}`, colors.dim);
        if (mapped.branding?.primaryColor) this.print(`  • Primary Color: ${mapped.branding.primaryColor}`, colors.dim);

        return mapped;
      }
    } catch (error) {
      this.printWarning('Could not extract data from website. Continuing with manual entry.');
    }

    return null;
  }

  // Collect business information
  private async collectBusinessInfo() {
    this.printHeader('Business Information');

    this.data.business.name = await this.prompt('Business name', this.data.business.name);
    this.data.business.legalName = await this.prompt('Legal name (for contracts)', this.data.business.name);
    this.data.business.tagline = await this.prompt('Tagline/slogan', this.data.business.tagline);
    this.data.business.description = await this.prompt(
      'Business description (1-2 sentences)',
      this.data.business.description || `${this.data.business.name} provides professional services and solutions.`
    );

    const yearInput = await this.prompt('Year founded', String(this.data.business.yearFounded));
    this.data.business.yearFounded = parseInt(yearInput) || new Date().getFullYear();

    const industries = ['general', 'plumbing', 'hvac', 'electrical', 'landscaping', 'construction', 'cleaning', 'other'];
    this.data.business.industry = await this.promptChoice('Industry/Category', industries, 0);
  }

  // Collect site information
  private async collectSiteInfo() {
    this.printHeader('Website Information');

    let domain = await this.prompt('Domain name (e.g., mybusiness.com)',
      this.data.site.url.replace('https://', '').replace('http://', ''));

    if (!domain.startsWith('http')) {
      domain = `https://${domain}`;
    }
    this.data.site.url = domain;
  }

  // Collect contact information
  private async collectContactInfo() {
    this.printHeader('Contact Information');

    this.data.contact.email = await this.prompt('Email address', this.data.contact.email);
    this.data.contact.phone = await this.prompt('Phone number', this.data.contact.phone);

    // Generate raw phone
    this.data.contact.phoneRaw = '+1' + this.data.contact.phone.replace(/\D/g, '');

    console.log(`\n${colors.dim}Address (leave blank to skip):${colors.reset}`);
    this.data.contact.address.street = await this.prompt('  Street address', this.data.contact.address.street);

    if (this.data.contact.address.street) {
      this.data.contact.address.suite = await this.prompt('  Suite/Unit', '');
      this.data.contact.address.city = await this.prompt('  City', this.data.contact.address.city);
      this.data.contact.address.state = await this.prompt('  State', this.data.contact.address.state);
      this.data.contact.address.zip = await this.prompt('  ZIP code', this.data.contact.address.zip);
    }

    this.data.contact.serviceArea = await this.prompt('Service area (e.g., "Greater Chicago Area")', '');
  }

  // Collect social media
  private async collectSocialMedia() {
    this.printHeader('Social Media');
    this.printInfo('Enter full URLs or leave blank to skip');

    this.data.social.facebook = await this.prompt('Facebook URL', this.data.social.facebook);
    this.data.social.instagram = await this.prompt('Instagram URL', this.data.social.instagram);
    this.data.social.linkedin = await this.prompt('LinkedIn URL', this.data.social.linkedin);
    this.data.social.yelp = await this.prompt('Yelp URL', this.data.social.yelp);
    this.data.social.googleBusiness = await this.prompt('Google Business URL', this.data.social.googleBusiness);
  }

  // Collect branding
  private async collectBranding() {
    this.printHeader('Branding');

    const colorPresets: Record<string, { primary: string; secondary: string; accent: string }> = {
      'Blue (Professional)': { primary: '#2563eb', secondary: '#1e40af', accent: '#f59e0b' },
      'Green (Nature/Health)': { primary: '#059669', secondary: '#047857', accent: '#f59e0b' },
      'Red (Bold/Urgent)': { primary: '#dc2626', secondary: '#b91c1c', accent: '#fbbf24' },
      'Purple (Creative)': { primary: '#7c3aed', secondary: '#6d28d9', accent: '#f59e0b' },
      'Orange (Energetic)': { primary: '#ea580c', secondary: '#c2410c', accent: '#2563eb' },
      'Custom colors': { primary: '', secondary: '', accent: '' },
    };

    const choice = await this.promptChoice('Choose a color scheme', Object.keys(colorPresets), 0);
    const preset = colorPresets[choice];

    if (preset.primary) {
      this.data.branding.primaryColor = preset.primary;
      this.data.branding.secondaryColor = preset.secondary;
      this.data.branding.accentColor = preset.accent;
    } else {
      this.data.branding.primaryColor = await this.prompt('Primary color (hex)', this.data.branding.primaryColor);
      this.data.branding.secondaryColor = await this.prompt('Secondary color (hex)', this.data.branding.secondaryColor);
      this.data.branding.accentColor = await this.prompt('Accent color (hex)', this.data.branding.accentColor);
    }
  }

  // Collect CTA
  private async collectCTA() {
    this.printHeader('Call to Action');

    const ctaOptions = [
      'Get Started',
      'Get a Free Quote',
      'Contact Us',
      'Schedule Consultation',
      'Call Now',
      'Custom text',
    ];

    const choice = await this.promptChoice('Primary CTA button text', ctaOptions, 0);
    this.data.cta.primaryText = choice === 'Custom text'
      ? await this.prompt('Enter custom CTA text', 'Get Started')
      : choice;

    const urlOptions = ['/contact', 'tel:' + this.data.contact.phoneRaw, 'mailto:' + this.data.contact.email];
    this.data.cta.primaryUrl = await this.promptChoice('CTA destination', urlOptions, 0);
  }

  // Generate config.yaml
  private generateConfig() {
    const configPath = path.join(this.projectRoot, 'config.yaml');
    const templatePath = path.join(this.projectRoot, 'config.example.yaml');

    // Read template
    let config: any;
    if (fs.existsSync(templatePath)) {
      config = YAML.parse(fs.readFileSync(templatePath, 'utf-8'));
    } else if (fs.existsSync(configPath)) {
      config = YAML.parse(fs.readFileSync(configPath, 'utf-8'));
    } else {
      throw new Error('No config template found');
    }

    // Update with collected data
    config.business = {
      name: this.data.business.name,
      legal_name: this.data.business.legalName,
      tagline: this.data.business.tagline,
      description: this.data.business.description,
      year_founded: this.data.business.yearFounded,
      industry: this.data.business.industry,
    };

    config.site = {
      url: this.data.site.url,
      locale: this.data.site.locale,
      timezone: this.data.site.timezone,
      default_og_image: '/images/og-image.png',
    };

    config.contact = {
      email: this.data.contact.email,
      phone: this.data.contact.phone,
      phone_raw: this.data.contact.phoneRaw,
      address: {
        street: this.data.contact.address.street,
        suite: this.data.contact.address.suite,
        city: this.data.contact.address.city,
        state: this.data.contact.address.state,
        zip: this.data.contact.address.zip,
        country: this.data.contact.address.country,
      },
      service_area: this.data.contact.serviceArea,
    };

    config.social = {
      facebook: this.data.social.facebook,
      instagram: this.data.social.instagram,
      twitter: this.data.social.twitter,
      linkedin: this.data.social.linkedin,
      youtube: this.data.social.youtube,
      yelp: this.data.social.yelp,
      google_business: this.data.social.googleBusiness,
      tiktok: '',
      pinterest: '',
      nextdoor: '',
      bbb: '',
      whatsapp: '',
    };

    config.branding.colors = {
      primary: this.data.branding.primaryColor,
      primary_dark: this.data.branding.secondaryColor,
      secondary: '#64748b',
      accent: this.data.branding.accentColor,
      text: '#1f2937',
      text_light: '#6b7280',
      background: '#ffffff',
      surface: '#f9fafb',
    };

    config.cta = {
      primary: {
        text: this.data.cta.primaryText,
        url: this.data.cta.primaryUrl,
      },
      secondary: {
        text: 'Call Now',
        url: 'tel:' + this.data.contact.phoneRaw,
      },
      urgency: '',
    };

    // Update other email references
    config.contact_form.recipient_email = this.data.contact.email;
    config.contact_form.subject_prefix = `[${this.data.business.name} Contact]`;
    config.email.from_email = `${this.data.business.name} <noreply@${this.data.site.url.replace('https://', '').replace('http://', '')}>`;
    config.email.reply_to = this.data.contact.email;
    config.seo.title_template = `%s | ${this.data.business.name}`;
    config.seo.default_title = `${this.data.business.name} - ${this.data.business.tagline}`;
    config.legal.copyright_holder = this.data.business.name;
    config.legal.privacy_email = this.data.contact.email;

    // Write config
    const yamlString = YAML.stringify(config, { lineWidth: 0 });
    fs.writeFileSync(configPath, yamlString);

    this.printSuccess(`Generated config.yaml`);
  }

  // Generate placeholder logo
  private generateLogo() {
    const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" fill="transparent"/>
  <text x="10" y="40" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="bold" fill="${this.data.branding.primaryColor}">${this.data.business.name}</text>
</svg>`;

    const logoPath = path.join(this.projectRoot, 'public', 'images', 'logo.svg');
    fs.mkdirSync(path.dirname(logoPath), { recursive: true });
    fs.writeFileSync(logoPath, logoSvg);

    this.printSuccess('Generated placeholder logo (public/images/logo.svg)');
  }

  // Generate favicon
  private generateFavicon() {
    // Generate a simple SVG favicon with first letter
    const initial = this.data.business.name.charAt(0).toUpperCase();
    const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <rect width="32" height="32" rx="4" fill="${this.data.branding.primaryColor}"/>
  <text x="16" y="23" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="bold" fill="white" text-anchor="middle">${initial}</text>
</svg>`;

    const faviconPath = path.join(this.projectRoot, 'public', 'favicon.svg');
    fs.writeFileSync(faviconPath, faviconSvg);

    this.printSuccess('Generated favicon (public/favicon.svg)');
    this.printInfo('For production, convert to .ico and .png formats');
  }

  // Generate template blog post
  private generateBlogPost() {
    const date = new Date().toISOString().split('T')[0];
    const blogPost = `---
title: "Welcome to Our New Website"
description: "We're excited to launch our new website built with modern technology for the best user experience."
pubDate: "${date}"
author: "${this.data.business.name} Team"
---

# Welcome to ${this.data.business.name}

We're thrilled to announce the launch of our brand new website! This site was built using [Astro](https://astro.build), a modern web framework that delivers lightning-fast performance.

## What's New

Our new website features:

- **Fast Loading** - Built with performance in mind
- **Mobile Friendly** - Looks great on any device
- **Easy Navigation** - Find what you need quickly
- **Contact Form** - Get in touch with us easily

## About This Template

This website was built using the **Astro SMB Minimal** template, designed specifically for small businesses. It includes:

- Clean, professional design
- SEO optimization built-in
- Contact form with email notifications
- Blog functionality (like this post!)
- Easy customization through a single config file

## Adding More Blog Posts

To add more blog posts, simply create a new \`.md\` file in the \`src/content/blog/\` directory with the following format:

\`\`\`markdown
---
title: "Your Post Title"
description: "A brief description of your post"
pubDate: "YYYY-MM-DD"
author: "Author Name"
---

Your content here...
\`\`\`

## Get In Touch

Have questions? We'd love to hear from you! [Contact us](/contact) today.
`;

    const blogDir = path.join(this.projectRoot, 'src', 'content', 'blog');
    fs.mkdirSync(blogDir, { recursive: true });

    const blogPath = path.join(blogDir, 'welcome-to-our-website.md');
    fs.writeFileSync(blogPath, blogPost);

    this.printSuccess('Generated welcome blog post');
  }

  // Update astro.config.mjs with correct site URL
  private updateAstroConfig() {
    const configPath = path.join(this.projectRoot, 'astro.config.mjs');
    if (fs.existsSync(configPath)) {
      let content = fs.readFileSync(configPath, 'utf-8');
      content = content.replace(
        /site:\s*['"]https?:\/\/[^'"]+['"]/,
        `site: '${this.data.site.url}'`
      );
      fs.writeFileSync(configPath, content);
      this.printSuccess('Updated astro.config.mjs');
    }
  }

  // Main run function
  async run() {
    this.printBanner();

    // Ask about existing website
    const hasExistingSite = await this.promptYesNo('Do you have an existing website to import data from?', false);

    if (hasExistingSite) {
      const existingUrl = await this.prompt('Enter the website URL (e.g., https://oldsite.com)', '');
      if (existingUrl) {
        const extracted = await this.extractFromWebsite(existingUrl);
        if (extracted) {
          // Merge extracted data with defaults
          this.data = {
            ...this.data,
            ...extracted,
            business: { ...this.data.business, ...extracted.business },
            contact: {
              ...this.data.contact,
              ...extracted.contact,
              address: { ...this.data.contact.address, ...extracted.contact?.address }
            },
            social: { ...this.data.social, ...extracted.social },
            branding: { ...this.data.branding, ...extracted.branding },
          };
        }
      }
    }

    // Collect/confirm information
    await this.collectBusinessInfo();
    await this.collectSiteInfo();
    await this.collectContactInfo();
    await this.collectSocialMedia();
    await this.collectBranding();
    await this.collectCTA();

    // Generate files
    this.printHeader('Generating Files');

    this.generateConfig();
    this.generateLogo();
    this.generateFavicon();
    this.generateBlogPost();
    this.updateAstroConfig();

    // Final message
    console.log('');
    console.log(`${colors.green}${'═'.repeat(60)}${colors.reset}`);
    console.log(`${colors.green}${colors.bright}  ✓ Setup Complete!${colors.reset}`);
    console.log(`${colors.green}${'═'.repeat(60)}${colors.reset}`);
    console.log('');
    console.log('Next steps:');
    console.log(`  1. Review ${colors.cyan}config.yaml${colors.reset} and make any adjustments`);
    console.log(`  2. Replace ${colors.cyan}public/images/logo.svg${colors.reset} with your actual logo`);
    console.log(`  3. Run ${colors.cyan}npm run dev${colors.reset} to preview your site`);
    console.log(`  4. Run ${colors.cyan}npm run build${colors.reset} when ready to deploy`);
    console.log('');

    this.rl.close();
  }
}

// Run the wizard
const wizard = new SetupWizard();
wizard.run().catch((error) => {
  console.error('Setup failed:', error);
  process.exit(1);
});
