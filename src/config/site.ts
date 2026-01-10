/**
 * Site Configuration Loader
 * Reads from config.yaml - the single source of truth for all settings
 *
 * This module bridges the new comprehensive config.yaml structure to the
 * interface expected by existing components. New fields are also exposed
 * for components that want to use them.
 */

import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface NavItem {
  name: string;
  href: string;
  children?: NavItem[];
}

interface FooterLinks {
  quickLinks: NavItem[];
  legal: NavItem[];
}

interface Address {
  street: string;
  suite?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface Contact {
  email: string;
  phone: string;
  phoneRaw: string;
  phoneLocal: string; // Kept for backward compatibility
  address: Address;
  serviceArea: string;
}

interface Social {
  facebook: string;
  instagram: string;
  twitter: string;
  linkedin: string;
  youtube: string;
  tiktok: string;
  pinterest: string;
  yelp: string;
  googleBusiness: string;
  nextdoor: string;
  bbb: string;
  whatsapp: string;
}

interface Hours {
  display: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

interface HoursStructured {
  days: string[];
  open: string;
  close: string;
}

interface Analytics {
  googleAnalytics: {
    enabled: boolean;
    measurementId: string;
  };
  googleTagManager: {
    enabled: boolean;
    containerId: string;
  };
  googleSiteVerification: string;
}

interface ReviewPageConfig {
  path: string;
  layout: 'featured' | 'standard' | 'compact' | 'carousel' | '3-row';
  position: 'before-cta' | 'after-cta' | 'after-hero';
  maxReviews: number;
}

interface ReviewsConfig {
  enabled: boolean;
  pages: ReviewPageConfig[];
  tagged: Record<string, string[]>;
}

// New comprehensive types
interface Business {
  name: string;
  legalName: string;
  tagline: string;
  description: string;
  yearFounded: number;
  industry: string;
}

interface BrandingColors {
  primary: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  text: string;
  textLight: string;
  background: string;
  surface: string;
}

interface Branding {
  colors: BrandingColors;
  fonts: {
    heading: string;
    body: string;
  };
  style: 'modern' | 'classic' | 'playful' | 'minimal';
  logo: {
    text: string;
    showIcon: boolean;
  };
}

interface Trust {
  showYearsInBusiness: boolean;
  yearsInBusiness: number; // Calculated from yearFounded
  customersServed: string;
  satisfactionRate: string;
  responseTime: string;
  certifications: string[];
  awards: string[];
  affiliations: string[];
  guarantees: string[];
}

interface CTA {
  primary: {
    text: string;
    url: string;
  };
  secondary: {
    text: string;
    url: string;
  };
  urgency: string;
}

interface ServiceItem {
  name: string;
  description: string;
  icon: string;
  url: string;
}

interface Services {
  enabled: boolean;
  headline: string;
  subheadline: string;
  items: ServiceItem[];
}

interface ValuePropItem {
  title: string;
  description: string;
  icon: string;
}

interface ValueProps {
  enabled: boolean;
  headline: string;
  items: ValuePropItem[];
}

interface Features {
  blog: boolean;
  contactForm: boolean;
  reviews: boolean;
  servicesSection: boolean;
  newsletter: boolean;
  chat: boolean;
  booking: boolean;
}

interface SEO {
  titleTemplate: string;
  defaultTitle: string;
  defaultDescription: string;
  keywords: string[];
}

interface Legal {
  copyrightHolder: string;
  privacyEmail: string;
  termsLastUpdated: string;
  privacyLastUpdated: string;
}

// Main config interface - backward compatible + new fields
export interface SiteConfig {
  // === Backward compatible fields (existing components use these) ===
  name: string;
  tagline: string;
  description: string;
  url: string;
  contact: Contact;
  social: Social;
  hours: Hours;
  hoursStructured: HoursStructured[];
  navigation: NavItem[];
  footerLinks: FooterLinks;
  defaultOgImage: string;
  analytics: Analytics;
  reviews: ReviewsConfig;
  copyright: string;

  // === New comprehensive fields ===
  business: Business;
  branding: Branding;
  trust: Trust;
  cta: CTA;
  services: Services;
  valueProps: ValueProps;
  features: Features;
  seo: SEO;
  legal: Legal;
  locale: string;
  timezone: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  hasPhoto: boolean;
}

// =============================================================================
// CONFIG LOADER
// =============================================================================

function loadConfig(): SiteConfig {
  const configPath = path.join(process.cwd(), 'config.yaml');
  const configFile = fs.readFileSync(configPath, 'utf-8');
  const config = YAML.parse(configFile);

  // Calculate years in business
  const currentYear = new Date().getFullYear();
  const yearFounded = config.business?.year_founded || currentYear;
  const yearsInBusiness = currentYear - yearFounded;

  // Build the business object
  const business: Business = {
    name: config.business?.name || config.site?.name || 'Acme Corp',
    legalName: config.business?.legal_name || config.business?.name || config.site?.name || 'Acme Corp',
    tagline: config.business?.tagline || config.site?.tagline || '',
    description: config.business?.description || config.site?.description || '',
    yearFounded: yearFounded,
    industry: config.business?.industry || 'general',
  };

  // Build branding object with defaults
  const branding: Branding = {
    colors: {
      primary: config.branding?.colors?.primary || '#2563eb',
      primaryDark: config.branding?.colors?.primary_dark || '#1e40af',
      secondary: config.branding?.colors?.secondary || '#64748b',
      accent: config.branding?.colors?.accent || '#f59e0b',
      text: config.branding?.colors?.text || '#1f2937',
      textLight: config.branding?.colors?.text_light || '#6b7280',
      background: config.branding?.colors?.background || '#ffffff',
      surface: config.branding?.colors?.surface || '#f9fafb',
    },
    fonts: {
      heading: config.branding?.fonts?.heading || 'Inter',
      body: config.branding?.fonts?.body || 'Inter',
    },
    style: config.branding?.style || 'modern',
    logo: {
      text: config.branding?.logo?.text || '',
      showIcon: config.branding?.logo?.show_icon ?? true,
    },
  };

  // Build trust signals
  const trust: Trust = {
    showYearsInBusiness: config.trust?.show_years_in_business ?? true,
    yearsInBusiness: yearsInBusiness,
    customersServed: config.trust?.customers_served || '',
    satisfactionRate: config.trust?.satisfaction_rate || '',
    responseTime: config.trust?.response_time || '',
    certifications: (config.trust?.certifications || []).filter((c: string) => c),
    awards: config.trust?.awards || [],
    affiliations: config.trust?.affiliations || [],
    guarantees: config.trust?.guarantees || [],
  };

  // Build CTA config
  const cta: CTA = {
    primary: {
      text: config.cta?.primary?.text || 'Get Started',
      url: config.cta?.primary?.url || '/contact',
    },
    secondary: {
      text: config.cta?.secondary?.text || 'Call Now',
      url: config.cta?.secondary?.url || `tel:${config.contact?.phone_raw || ''}`,
    },
    urgency: config.cta?.urgency || '',
  };

  // Build services
  const services: Services = {
    enabled: config.services?.enabled ?? true,
    headline: config.services?.headline || 'Our Services',
    subheadline: config.services?.subheadline || '',
    items: (config.services?.items || []).map((s: any) => ({
      name: s.name || '',
      description: s.description || '',
      icon: s.icon || 'star',
      url: s.url || '',
    })),
  };

  // Build value props
  const valueProps: ValueProps = {
    enabled: config.value_props?.enabled ?? true,
    headline: config.value_props?.headline || 'Why Choose Us',
    items: (config.value_props?.items || []).map((v: any) => ({
      title: v.title || '',
      description: v.description || '',
      icon: v.icon || 'check',
    })),
  };

  // Build features flags
  const features: Features = {
    blog: config.features?.blog ?? true,
    contactForm: config.features?.contact_form ?? true,
    reviews: config.features?.reviews ?? true,
    servicesSection: config.features?.services_section ?? true,
    newsletter: config.features?.newsletter ?? false,
    chat: config.features?.chat ?? false,
    booking: config.features?.booking ?? false,
  };

  // Build SEO config
  const seo: SEO = {
    titleTemplate: config.seo?.title_template || `%s | ${business.name}`,
    defaultTitle: config.seo?.default_title || business.name,
    defaultDescription: config.seo?.default_description || business.description,
    keywords: config.seo?.keywords || [],
  };

  // Build legal config
  const legal: Legal = {
    copyrightHolder: config.legal?.copyright_holder || business.name,
    privacyEmail: config.legal?.privacy_email || config.contact?.email || '',
    termsLastUpdated: config.legal?.terms_last_updated || '',
    privacyLastUpdated: config.legal?.privacy_last_updated || '',
  };

  // Phone handling - support both old and new formats
  const phoneDisplay = config.contact?.phone || config.contact?.phone_local || '';
  const phoneRaw = config.contact?.phone_raw || phoneDisplay.replace(/\D/g, '');

  // Hours handling - support both old and new formats
  const hoursDetailed = config.hours?.detailed || config.hours || {};

  return {
    // === Backward compatible mappings ===
    name: business.name,
    tagline: business.tagline,
    description: business.description,
    url: config.site?.url || '',
    defaultOgImage: config.site?.default_og_image || '/images/og-image.png',

    contact: {
      email: config.contact?.email || '',
      phone: phoneDisplay,
      phoneRaw: phoneRaw,
      phoneLocal: phoneDisplay, // Alias for backward compatibility
      address: {
        street: config.contact?.address?.street || '',
        suite: config.contact?.address?.suite || '',
        city: config.contact?.address?.city || '',
        state: config.contact?.address?.state || '',
        zip: config.contact?.address?.zip || '',
        country: config.contact?.address?.country || '',
      },
      serviceArea: config.contact?.service_area || '',
    },

    social: {
      facebook: config.social?.facebook || '',
      instagram: config.social?.instagram || '',
      twitter: config.social?.twitter || '',
      linkedin: config.social?.linkedin || '',
      youtube: config.social?.youtube || '',
      tiktok: config.social?.tiktok || '',
      pinterest: config.social?.pinterest || '',
      yelp: config.social?.yelp || '',
      googleBusiness: config.social?.google_business || '',
      nextdoor: config.social?.nextdoor || '',
      bbb: config.social?.bbb || '',
      whatsapp: config.social?.whatsapp || '',
    },

    hours: {
      display: config.hours?.display || 'Mon-Fri: 9AM-5PM',
      monday: hoursDetailed.monday || '',
      tuesday: hoursDetailed.tuesday || '',
      wednesday: hoursDetailed.wednesday || '',
      thursday: hoursDetailed.thursday || '',
      friday: hoursDetailed.friday || '',
      saturday: hoursDetailed.saturday || '',
      sunday: hoursDetailed.sunday || '',
    },

    hoursStructured: (config.hours?.structured || []).map((h: any) => ({
      days: h.days || [],
      open: h.open || '',
      close: h.close || '',
    })),

    navigation: config.navigation?.main || [],

    footerLinks: {
      quickLinks: config.navigation?.footer?.quick_links || config.navigation?.footer?.quickLinks || [],
      legal: config.navigation?.footer?.legal || [],
    },

    analytics: {
      googleAnalytics: {
        enabled: config.analytics?.google_analytics?.enabled || false,
        measurementId: config.analytics?.google_analytics?.measurement_id || '',
      },
      googleTagManager: {
        enabled: config.analytics?.google_tag_manager?.enabled || false,
        containerId: config.analytics?.google_tag_manager?.container_id || '',
      },
      googleSiteVerification: config.analytics?.google_site_verification || '',
    },

    reviews: {
      enabled: config.reviews?.enabled ?? true,
      pages: (config.reviews?.pages || []).map((p: any) => ({
        path: p.path,
        layout: p.layout || 'standard',
        position: p.position || 'before-cta',
        maxReviews: p.max_reviews || 3,
      })),
      tagged: config.reviews?.tagged || {},
    },

    copyright: `© ${currentYear} ${legal.copyrightHolder}. All rights reserved.`,

    // === New comprehensive fields ===
    business,
    branding,
    trust,
    cta,
    services,
    valueProps,
    features,
    seo,
    legal,
    locale: config.site?.locale || 'en-US',
    timezone: config.site?.timezone || 'America/New_York',
  };
}

// =============================================================================
// REVIEWS LOADER
// =============================================================================

function loadReviews(): Review[] {
  try {
    const reviewsPath = path.join(process.cwd(), 'data', 'reviews.json');
    const reviewsFile = fs.readFileSync(reviewsPath, 'utf-8');
    const data = JSON.parse(reviewsFile);
    return (data.reviews || []).map((r: any) => ({
      id: r.id,
      author: r.author,
      rating: r.rating,
      date: r.date,
      text: r.text,
      hasPhoto: r.hasPhoto || false,
    }));
  } catch {
    return [];
  }
}

// Get reviews for a specific page path
export function getReviewsForPage(pagePath: string): {
  reviews: Review[];
  config: ReviewPageConfig | null;
} {
  if (!siteConfig.reviews.enabled) {
    return { reviews: [], config: null };
  }

  const pageConfig = siteConfig.reviews.pages.find(p => p.path === pagePath);
  if (!pageConfig) {
    return { reviews: [], config: null };
  }

  const allReviews = loadReviews();
  const tagged = siteConfig.reviews.tagged;

  // Find reviews tagged for this page
  const taggedReviewIds = Object.entries(tagged)
    .filter(([_, pages]) => pages.includes(pagePath))
    .map(([id]) => id);

  const pageReviews = allReviews
    .filter(r => taggedReviewIds.includes(r.id))
    .slice(0, pageConfig.maxReviews);

  return { reviews: pageReviews, config: pageConfig };
}

// =============================================================================
// EXPORTS
// =============================================================================

export const siteConfig = loadConfig();

// Helper to get full address as string
export function getFullAddress(): string {
  const addr = siteConfig.contact.address;
  const parts = [addr.street];
  if (addr.suite) parts.push(addr.suite);
  parts.push(`${addr.city}, ${addr.state} ${addr.zip}`);
  return parts.join(', ');
}

// Helper to get years in business text
export function getYearsInBusinessText(): string {
  const years = siteConfig.trust.yearsInBusiness;
  if (years < 1) return 'New business';
  if (years === 1) return '1 year in business';
  return `${years}+ years in business`;
}
