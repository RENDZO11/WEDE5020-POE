# UrbanNest (WEDE5020 Part 3)

Property rental and sales website for UrbanNest, built with HTML, CSS and JavaScript.
Live site: https://YOUR-SITE.netlify.app  |  Repository: https://github.com/YOUR-USER/YOUR-REPO

## Pages and files
| Page | Purpose | Scripts |
|------|---------|---------|
| index.html | Landing page and search form that opens the Properties page pre-filtered | script.js |
| products-and-services.html | 60 listings with search, filters, sorting, map and photo viewer | properties-data.js, properties.js, script.js, forms.js |
| about-us.html | Company story, values, team | script.js |
| gallery.html | Photo gallery with category filter and lightbox | script.js, urbannest-fixes.js |
| news-and-updates.html | Articles | script.js |
| enquiry.html | Property enquiry form with cost and availability response | properties-data.js, script.js, forms.js |
| contact-us.html | Contact form (emailed) and Leaflet map | script.js, forms.js |
| robots.txt, sitemap.xml | SEO | none |

## Changelog

### Part 3: changes made from Part 2 feedback
| Date | File(s) | Change | Reason |
|------|---------|--------|--------|
| 2026-10-11 | README.md | Added this detailed, dated changelog listing every file changed and why | Part 2 feedback: changelog scored 1/10 (incomplete or missing) |
| 2026-10-11 | README.md | Added a Harvard reference list (below) | Part 2 feedback: references scored 0/5 |

### Part 3: new functionality
| Date | File(s) | Change |
|------|---------|--------|
| 2026-10-11 | js/properties-data.js | Single data source for all 60 listings, used by the Properties page and the enquiry form |
| 2026-10-11 | js/properties.js | Dynamic listing cards, text search, filters drawer, sort (price, bedrooms), Leaflet city map, photo viewer, URL parameters from the index page |
| 2026-10-11 | js/forms.js | Per-field validation with clear messages (name, email, SA phone number, message length, dates), sending via FormSubmit, mailto fallback, enquiry response with rent/deposit or price and availability |
| 2026-10-11 | js/script.js | Mobile menu toggle and Leaflet branch map |
| 2026-10-11 | js/urbannest-fixes.js | Gallery category filter and full-screen photo viewer |
| 2026-10-11 | contact-us.html | Replaced the Google embed with an interactive Leaflet map; form now validated and emailed |
| 2026-10-12 | enquiry.html | Property of Interest dropdown offers the property types (residential, commercial and industrial, land and developments, alternative options); optional Specific Listing dropdown filled from the listings; success panel shows cost and availability; removed duplicate script tags that sent each form twice |
| 2026-10-11 | gallery.html | Loaded urbannest-fixes.js so the filter pills and lightbox work; added a hidden h2 for heading structure |
| 2026-10-11 | index.html | Search form values now match the listing data; featured cards match real listings; added a "Looking to" selector |
| 2026-10-11 | about-us.html | Links open the correct Properties tab; call-to-action uses the shared band style |
| 2026-10-11 | css/style.css | Defined missing colour variables, sr-only and no-scroll helpers; fixed invisible menu icon; fixed centred section headings; larger gallery lightbox; Leaflet map styles |
| 2026-10-11 | css/properties.css | Styles for the Properties page (search bar, filters drawer, cards, photo viewer) |
| 2026-10-11 | All pages | Unique title, meta description and keywords; descriptive alt text; Enquiry link in navigation |
| 2026-10-11 | robots.txt, sitemap.xml | Added for SEO |

## References (Harvard)
- Agafonkin, V. (2023) *Leaflet: an open-source JavaScript library for interactive maps*, version 1.9.4. Available at: https://leafletjs.com (Accessed: 11 October 2026).
- FormSubmit (2026) *FormSubmit: form backend service*. Available at: https://formsubmit.co (Accessed: 11 October 2026).
- Mozilla Developer Network (2026) *Client-side form validation*. Available at: https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation (Accessed: 11 October 2026).
- OpenStreetMap contributors (2026) *OpenStreetMap*. Available at: https://www.openstreetmap.org (Accessed: 11 October 2026).
