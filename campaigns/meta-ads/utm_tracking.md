# QUANTUM Meta Ads - UTM Tracking Reference

## UTM Parameter Structure

All campaign URLs follow this format:

```
https://u-r-quantum.com/international-investors?source=meta_{lang}_{variant}&utm_source=meta&utm_medium=paid&utm_campaign=quantum_pilot&utm_content={ad_name}&utm_term={adset_name}
```

### Parameter Definitions

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `source` | `meta_{lang}_{variant}` | Internal source tracking (matches ad URL param) |
| `utm_source` | `meta` | Traffic source platform |
| `utm_medium` | `paid` | Marketing medium |
| `utm_campaign` | `quantum_pilot` | Campaign identifier |
| `utm_content` | `{ad_name}` | Specific ad creative identifier |
| `utm_term` | `{adset_name}` | Ad set / audience segment |

---

## Complete Tracking URLs (14 Ads)

### EN - US/CA/UK (3 ads)

| Ad | Tracking URL |
|----|-------------|
| EN_A - Family + Hidden Properties | `https://u-r-quantum.com/international-investors?source=meta_en_a&utm_source=meta&utm_medium=paid&utm_campaign=quantum_pilot&utm_content=EN_A_Family_Hidden_Properties&utm_term=QUANTUM_EN_US_CA_UK` |
| EN_B - Kids + Hidden Gems | `https://u-r-quantum.com/international-investors?source=meta_en_b&utm_source=meta&utm_medium=paid&utm_campaign=quantum_pilot&utm_content=EN_B_Kids_Hidden_Gems&utm_term=QUANTUM_EN_US_CA_UK` |
| EN_C - Urgency + Pre-Renewal | `https://u-r-quantum.com/international-investors?source=meta_en_c&utm_source=meta&utm_medium=paid&utm_campaign=quantum_pilot&utm_content=EN_C_Urgency_Pre_Renewal&utm_term=QUANTUM_EN_US_CA_UK` |

### FR - France/Belgium (3 ads)

| Ad | Tracking URL |
|----|-------------|
| FR_A - Votre chez-vous | `https://u-r-quantum.com/international-investors?source=meta_fr_a&utm_source=meta&utm_medium=paid&utm_campaign=quantum_pilot&utm_content=FR_A_Votre_chez_vous&utm_term=QUANTUM_FR_France_Belgium` |
| FR_B - Enfants + joyaux | `https://u-r-quantum.com/international-investors?source=meta_fr_b&utm_source=meta&utm_medium=paid&utm_campaign=quantum_pilot&utm_content=FR_B_Enfants_joyaux&utm_term=QUANTUM_FR_France_Belgium` |
| FR_C - Urgence | `https://u-r-quantum.com/international-investors?source=meta_fr_c&utm_source=meta&utm_medium=paid&utm_campaign=quantum_pilot&utm_content=FR_C_Urgence&utm_term=QUANTUM_FR_France_Belgium` |

### ES - LATAM (2 ads)

| Ad | Tracking URL |
|----|-------------|
| ES_A - Tu hogar | `https://u-r-quantum.com/international-investors?source=meta_es_a&utm_source=meta&utm_medium=paid&utm_campaign=quantum_pilot&utm_content=ES_A_Tu_hogar&utm_term=QUANTUM_ES_LATAM` |
| ES_B - Hijos + joyas | `https://u-r-quantum.com/international-investors?source=meta_es_b&utm_source=meta&utm_medium=paid&utm_campaign=quantum_pilot&utm_content=ES_B_Hijos_joyas&utm_term=QUANTUM_ES_LATAM` |

### DE - Germany/Austria (2 ads)

| Ad | Tracking URL |
|----|-------------|
| DE_A - Zuhause + Rendite | `https://u-r-quantum.com/international-investors?source=meta_de_a&utm_source=meta&utm_medium=paid&utm_campaign=quantum_pilot&utm_content=DE_A_Zuhause_Rendite&utm_term=QUANTUM_DE_Germany_Austria` |
| DE_B - Kinder + Juwelen | `https://u-r-quantum.com/international-investors?source=meta_de_b&utm_source=meta&utm_medium=paid&utm_campaign=quantum_pilot&utm_content=DE_B_Kinder_Juwelen&utm_term=QUANTUM_DE_Germany_Austria` |

### RU - Russia/CIS (2 ads)

| Ad | Tracking URL |
|----|-------------|
| RU_A - Dom + dohodnost | `https://u-r-quantum.com/international-investors?source=meta_ru_a&utm_source=meta&utm_medium=paid&utm_campaign=quantum_pilot&utm_content=RU_A_Dom_dohodnost&utm_term=QUANTUM_RU_Russia_CIS` |
| RU_B - Deti + zhemchuzhiny | `https://u-r-quantum.com/international-investors?source=meta_ru_b&utm_source=meta&utm_medium=paid&utm_campaign=quantum_pilot&utm_content=RU_B_Deti_zhemchuzhiny&utm_term=QUANTUM_RU_Russia_CIS` |

### HE - Israel (2 ads)

| Ad | Tracking URL |
|----|-------------|
| HE_A - Properties the market doesn't know | `https://u-r-quantum.com/international-investors?source=meta_he_a&utm_source=meta&utm_medium=paid&utm_campaign=quantum_pilot&utm_content=HE_A_Hidden_Properties&utm_term=QUANTUM_HE_Israel` |
| HE_B - Your kids in Israel | `https://u-r-quantum.com/international-investors?source=meta_he_b&utm_source=meta&utm_medium=paid&utm_campaign=quantum_pilot&utm_content=HE_B_Kids_Israel&utm_term=QUANTUM_HE_Israel` |

---

## Summary Table

| # | Lang | Ad Name | source param | utm_content | utm_term |
|---|------|---------|-------------|-------------|----------|
| 1 | EN | EN_A - Family + Hidden Properties | meta_en_a | EN_A_Family_Hidden_Properties | QUANTUM_EN_US_CA_UK |
| 2 | EN | EN_B - Kids + Hidden Gems | meta_en_b | EN_B_Kids_Hidden_Gems | QUANTUM_EN_US_CA_UK |
| 3 | EN | EN_C - Urgency + Pre-Renewal | meta_en_c | EN_C_Urgency_Pre_Renewal | QUANTUM_EN_US_CA_UK |
| 4 | FR | FR_A - Votre chez-vous | meta_fr_a | FR_A_Votre_chez_vous | QUANTUM_FR_France_Belgium |
| 5 | FR | FR_B - Enfants + joyaux | meta_fr_b | FR_B_Enfants_joyaux | QUANTUM_FR_France_Belgium |
| 6 | FR | FR_C - Urgence | meta_fr_c | FR_C_Urgence | QUANTUM_FR_France_Belgium |
| 7 | ES | ES_A - Tu hogar | meta_es_a | ES_A_Tu_hogar | QUANTUM_ES_LATAM |
| 8 | ES | ES_B - Hijos + joyas | meta_es_b | ES_B_Hijos_joyas | QUANTUM_ES_LATAM |
| 9 | DE | DE_A - Zuhause + Rendite | meta_de_a | DE_A_Zuhause_Rendite | QUANTUM_DE_Germany_Austria |
| 10 | DE | DE_B - Kinder + Juwelen | meta_de_b | DE_B_Kinder_Juwelen | QUANTUM_DE_Germany_Austria |
| 11 | RU | RU_A - Dom + dohodnost | meta_ru_a | RU_A_Dom_dohodnost | QUANTUM_RU_Russia_CIS |
| 12 | RU | RU_B - Deti + zhemchuzhiny | meta_ru_b | RU_B_Deti_zhemchuzhiny | QUANTUM_RU_Russia_CIS |
| 13 | HE | HE_A - Hidden Properties | meta_he_a | HE_A_Hidden_Properties | QUANTUM_HE_Israel |
| 14 | HE | HE_B - Kids Israel | meta_he_b | HE_B_Kids_Israel | QUANTUM_HE_Israel |

---

## Google Analytics 4 (GA4) Configuration

### Custom Dimensions

Create the following custom dimensions in GA4 Admin > Custom definitions:

| Dimension Name | Scope | Parameter Name | Description |
|----------------|-------|----------------|-------------|
| Language | Event | `language` | Ad language variant (EN, FR, ES, DE, RU, HE) |
| Market | Event | `market` | Target market/region (US_CA_UK, France_Belgium, LATAM, etc.) |
| Ad Variant | Event | `ad_variant` | Creative variant identifier (A, B, C) |

### Event Tracking Recommendations

Configure the following GA4 events to track the full funnel:

| Event Name | Trigger | Parameters |
|------------|---------|------------|
| `page_view` | Landing page load | `page_location`, `page_referrer`, UTM params (auto-captured) |
| `lead_form_open` | User clicks CTA / form opens | `language`, `market`, `ad_variant` |
| `lead_form_submit` | Form submission completed | `language`, `market`, `ad_variant`, `investment_budget`, `investment_timeline` |
| `lead_qualified` | Backend qualification event | `language`, `market`, `lead_score` |
| `consultation_booked` | Advisor books a call | `language`, `market` |

### GA4 Data Layer Push (for landing page)

```javascript
// Parse UTM parameters and push to dataLayer on page load
(function() {
  var params = new URLSearchParams(window.location.search);
  var source = params.get('source') || '';
  var parts = source.split('_');
  
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'campaign_landing',
    language: parts[1] || '',
    market: params.get('utm_term') || '',
    ad_variant: parts[2] || '',
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
    utm_content: params.get('utm_content') || '',
    utm_term: params.get('utm_term') || ''
  });
})();
```

---

## Meta Pixel Conversion Tracking

### Required Pixel Events

| Pixel Event | Trigger Point | Custom Parameters |
|-------------|---------------|-------------------|
| `PageView` | Landing page load | Auto-fired by base pixel |
| `Lead` | Instant Form submission (auto-tracked by Meta for lead forms) | `content_name: "quantum_pilot"`, `content_category: "{language}"` |
| `CompleteRegistration` | Thank-you page / CRM confirmation | `content_name: "quantum_pilot"`, `value: 0`, `currency: "USD"` |

### Pixel Base Code

```html
<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', 'YOUR_PIXEL_ID');
fbq('track', 'PageView');
</script>
```

### Lead Event (fires on form submit confirmation)

```javascript
fbq('track', 'Lead', {
  content_name: 'quantum_pilot',
  content_category: 'EN',  // dynamic: language code
  value: 0,
  currency: 'USD'
});
```

### CompleteRegistration Event (fires on CRM-confirmed lead)

```javascript
fbq('track', 'CompleteRegistration', {
  content_name: 'quantum_pilot',
  content_category: 'EN',  // dynamic: language code
  value: 0,
  currency: 'USD'
});
```

---

## Conversion API (CAPI) Recommendation

For reliable server-side tracking alongside the pixel, configure Meta Conversions API:

1. Set up server-side event forwarding for `Lead` and `CompleteRegistration` events
2. Include `fbp` (browser cookie) and `fbc` (click ID) parameters for deduplication
3. Send `event_id` matching between browser and server events to avoid double-counting
4. Required user data parameters: `em` (hashed email), `ph` (hashed phone), `country`

---

## Notes

- All Instant Form leads are auto-tracked as `Lead` events by Meta -- no additional pixel code needed for form submissions
- The `source` parameter (e.g., `meta_en_a`) is the primary internal tracking key and matches the existing URLs in `ads.json`
- UTM parameters are appended for GA4 attribution; Meta uses its own click ID (`fbclid`) for attribution
- For RU and HE ad content values, Latin transliterations are used in UTM parameters to ensure URL compatibility
- Replace `YOUR_PIXEL_ID` with the actual Meta Pixel ID before deployment
