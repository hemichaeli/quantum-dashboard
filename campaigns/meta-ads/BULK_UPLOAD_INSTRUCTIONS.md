# QUANTUM Meta Ads - Bulk Upload Instructions

## How to Import the CSV into Meta Ads Manager

1. Open **Meta Business Suite** (business.facebook.com)
2. Navigate to **Ads Manager** from the left sidebar
3. Click **Bulk Actions** (or the upload icon) in the top toolbar
4. Select **Import Campaigns**
5. Click **Choose File** and select `bulk_upload.csv`
6. Review the mapping preview -- Meta will auto-detect columns
7. Resolve any validation warnings (see Notes below)
8. Click **Import** to create the campaign, ad sets, and ads as drafts
9. Review each ad in Ads Manager before publishing

## Column Definitions

| Column | Description |
|--------|-------------|
| **Campaign Name** | Name of the campaign. All 14 ads share one campaign. |
| **Campaign Objective** | `Leads` -- optimizes for lead form submissions. |
| **Campaign Special Ad Categories** | `Housing` -- required for real estate advertising. Restricts targeting options. |
| **Campaign Budget Optimization** | `Off` -- budgets are set at the ad set level, not campaign level. |
| **Ad Set Name** | Name of the ad set. Groups ads by language/region (EN, FR, ES, DE, RU, HE). |
| **Ad Set Daily Budget** | Daily spend cap in USD per ad set ($10/day each). |
| **Ad Set Start Time** | ISO 8601 start date for delivery. |
| **Ad Set Optimization Goal** | `Lead generation` -- Meta optimizes delivery for lead form completions. |
| **Ad Set Bid Strategy** | `Lowest cost` -- Meta auto-bids to get the most results at lowest cost. |
| **Ad Set Billing Event** | `IMPRESSIONS` -- charged per impression (standard for lead campaigns). |
| **Ad Set Targeting Location Countries** | JSON array of ISO country codes for geo-targeting. |
| **Ad Set Targeting Interests** | JSON array of interest-based audience segments. |
| **Ad Set Placements Publisher Platforms** | JSON array: `facebook`, `instagram`. |
| **Ad Set Placements Facebook Positions** | Feed, Video feeds, Stories, Reels. |
| **Ad Set Placements Instagram Positions** | Feed (stream), Stories, Reels, Explore. |
| **Ad Name** | Unique name for each ad creative variant. |
| **Ad Creative Primary Text** | Main body copy shown above the video. |
| **Ad Creative Headline** | Bold headline below the video. |
| **Ad Creative Description** | Supporting text below the headline. |
| **Ad Creative Call To Action Type** | CTA button label (LEARN_MORE for all ads). |
| **Ad Creative Link** | Landing page URL with UTM-style source tracking. |
| **Ad Creative Video File Name** | Filename of the video asset to attach. |

## Housing Special Ad Category -- Limitations

Because this campaign is classified under the **Housing** special ad category, Meta enforces these restrictions:

- **No age targeting** -- you cannot restrict by age range; ads serve to ages 18+
- **No gender targeting** -- ads must serve to all genders
- **No zip/postal code targeting** -- minimum geo-targeting radius is 15 miles / 25 km
- **Limited interest exclusions** -- many detailed targeting exclusions are unavailable
- **No lookalike audiences** -- use Special Ad Audiences instead (based on existing leads/site visitors)
- **CTA limitations** -- some CTA types may be restricted; LEARN_MORE is always allowed

These restrictions are automatically enforced by Meta during import. If you see warnings about targeting restrictions, they are expected behavior for Housing category campaigns.

## Manual Steps Required After Import

### 1. Upload Video Assets
The CSV references video filenames but cannot embed the actual files. After import:
- Go to each ad in Ads Manager
- Click **Edit** on the ad creative
- Upload the corresponding `.mp4` file from the `video_assets/` folder:
  - `QUANTUM_EN_A.mp4`, `QUANTUM_EN_B.mp4`, `QUANTUM_EN_C.mp4`
  - `QUANTUM_FR_A.mp4`, `QUANTUM_FR_B.mp4`, `QUANTUM_FR_C.mp4`
  - `QUANTUM_ES_A.mp4`, `QUANTUM_ES_B.mp4`
  - `QUANTUM_DE_A.mp4`, `QUANTUM_DE_B.mp4`
  - `QUANTUM_RU_A.mp4`, `QUANTUM_RU_B.mp4`
  - `QUANTUM_HE_A.mp4`, `QUANTUM_HE_B.mp4`

### 2. Create and Link Instant Forms (Lead Forms)
Lead generation campaigns require Instant Forms:
- In Ads Manager, go to each ad set or ad
- Under **Destination**, select **Instant Form**
- Create a new form or link an existing one for each language variant
- Recommended form fields: Full Name, Email, Phone Number, Country
- Add a privacy policy link (required)
- Consider adding a custom question about investment timeline or budget

### 3. Set Up the Meta Pixel / Conversions API
- Ensure the Meta Pixel is installed on `u-r-quantum.com`
- Configure the Conversions API for server-side event tracking
- Set up Lead and CompleteRegistration events for optimization

### 4. Review and Publish
- Double-check all ad copy for accuracy in each language
- Verify landing page URLs load correctly with tracking parameters
- Confirm the Facebook Page and Instagram Account are correctly linked
- Set payment method if not already configured
- Click **Publish** to submit ads for review (typically 24 hours)

### 5. Ongoing: Monitor and Optimize
- Check Cost Per Lead (CPL) by ad set after 3-5 days
- Pause underperforming ad variants
- Adjust daily budgets toward best-performing language segments
- Consider creating Special Ad Audiences from lead form completers for retargeting
