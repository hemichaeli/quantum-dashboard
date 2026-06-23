#!/usr/bin/env python3
"""
QUANTUM Meta Ads Campaign Creator

Creates campaigns, ad sets, and ads via the Meta Marketing API
based on the campaign definition in ads.json.

Structure:
  Campaign 1: QUANTUM Investors - Housing (US/CA/UK)  [Special Ad Category: HOUSING]
  Campaign 2: QUANTUM Investors - International        [No Special Ad Category]

Usage:
    python create_campaigns.py              # Execute campaign creation
    python create_campaigns.py --dry-run    # Preview without creating
"""

import argparse
import io
import json
import logging
import os
import sys
import time
from pathlib import Path

# Fix Windows console encoding for Hebrew/Unicode
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

from dotenv import load_dotenv
from facebook_business.api import FacebookAdsApi
from facebook_business.adobjects.adaccount import AdAccount
from facebook_business.adobjects.campaign import Campaign
from facebook_business.adobjects.adset import AdSet
from facebook_business.adobjects.ad import Ad
from facebook_business.adobjects.adcreative import AdCreative
from facebook_business.adobjects.advideo import AdVideo
from facebook_business.adobjects.leadgenform import LeadgenForm
from rich.console import Console
from rich.table import Table

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)
console = Console(force_terminal=True)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
PLACEMENT_MAP = {
    "facebook": {
        "Feed": "feed",
        "Video feeds": "video_feeds",
        "Stories": "story",
    },
    "instagram": {
        "Feed": "stream",
        "Stories": "story",
        "Reels": "reels",
        "Explore": "explore",
    },
}

COUNTRY_CODES = {
    "United States": "US",
    "Canada": "CA",
    "United Kingdom": "GB",
    "France": "FR",
    "Belgium": "BE",
    "Argentina": "AR",
    "Mexico": "MX",
    "Panama": "PA",
    "Germany": "DE",
    "Austria": "AT",
    "Israel": "IL",
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def load_config():
    """Load environment variables and return config dict."""
    script_dir = Path(__file__).resolve().parent
    env_path = script_dir / ".env"
    load_dotenv(env_path)

    required = ["ACCESS_TOKEN", "AD_ACCOUNT_ID", "PAGE_ID", "PIXEL_ID"]
    config = {}
    missing = []
    for key in required:
        val = os.getenv(key)
        if not val:
            missing.append(key)
        config[key] = val

    if missing:
        logger.error("Missing required env vars: %s", ", ".join(missing))
        sys.exit(1)

    return config


def load_ads_json() -> dict:
    """Load and return the ads.json campaign definition."""
    ads_path = Path(__file__).resolve().parent / "ads.json"
    with open(ads_path, "r", encoding="utf-8") as f:
        return json.load(f)


def upload_video(account: AdAccount, video_path: str, dry_run: bool = False) -> str | None:
    """Upload a video file and return its ID."""
    if dry_run:
        logger.info("[DRY-RUN] Would upload video: %s", video_path)
        return None

    full_path = Path(__file__).resolve().parent / "videos" / video_path
    if not full_path.exists():
        logger.warning("Video file not found: %s -- skipping upload", full_path)
        return None

    logger.info("Uploading video: %s", video_path)
    video = AdVideo(parent_id=account.get_id())
    video[AdVideo.Field.filepath] = str(full_path)
    video.remote_create()
    video_id = video.get_id()
    logger.info("Video uploaded: %s -> %s", video_path, video_id)
    time.sleep(3)
    return video_id


INTEREST_IDS = {
    "Israel": "6003149907149",
    "Real estate investing": "6003446239080",
    "Real estate": "6003578086487",
    "Real estate development": "6003332796032",
    "Investment": "6003388314512",
    "Real property": "6003693537583",
    "El Al Airlines": "6003376937196",
}


def build_targeting(ad_set_data: dict) -> dict:
    """Build the Meta targeting spec from ad set data."""
    geo_locations = {
        "countries": [
            COUNTRY_CODES[loc]
            for loc in ad_set_data["locations"]
            if loc in COUNTRY_CODES
        ],
    }

    interests = []
    for name in ad_set_data.get("interests", []):
        if name in INTEREST_IDS:
            interests.append({"id": INTEREST_IDS[name], "name": name})
        else:
            logger.warning("Skipping interest without known ID: %s", name)

    targeting = {
        "geo_locations": geo_locations,
        "age_min": ad_set_data.get("age_min", 25),
        "age_max": ad_set_data.get("age_max", 65),
    }

    if interests:
        targeting["flexible_spec"] = [{"interests": interests}]

    return targeting


def build_placements(ad_set_data: dict) -> dict:
    """Build publisher_platforms and position specs."""
    fb_positions = []
    ig_positions = []

    placements = ad_set_data.get("placements", {})
    for name in placements.get("facebook", []):
        mapped = PLACEMENT_MAP["facebook"].get(name)
        if mapped:
            fb_positions.append(mapped)

    for name in placements.get("instagram", []):
        mapped = PLACEMENT_MAP["instagram"].get(name)
        if mapped:
            ig_positions.append(mapped)

    result = {"publisher_platforms": ["facebook", "instagram"]}
    if fb_positions:
        result["facebook_positions"] = fb_positions
    if ig_positions:
        result["instagram_positions"] = ig_positions

    return result


# ---------------------------------------------------------------------------
# Creation logic
# ---------------------------------------------------------------------------
def create_campaign(
    account: AdAccount,
    campaign_data: dict,
    dry_run: bool,
) -> str | None:
    """Create a campaign and return its ID."""
    special_cats = campaign_data.get("special_ad_categories", [])

    params = {
        Campaign.Field.name: campaign_data["name"],
        Campaign.Field.objective: "OUTCOME_LEADS",
        Campaign.Field.status: Campaign.Status.paused,
        Campaign.Field.special_ad_categories: special_cats,
        "is_adset_budget_sharing_enabled": False,
    }

    if "HOUSING" in special_cats:
        params["special_ad_category_country"] = ["US", "CA", "GB"]

    if dry_run:
        logger.info(
            "[DRY-RUN] Would create campaign: %s (special_ad_categories=%s)",
            params[Campaign.Field.name],
            special_cats,
        )
        return f"dry_run_{campaign_data['id']}"

    logger.info("Creating campaign: %s", params[Campaign.Field.name])
    campaign = account.create_campaign(params=params)
    campaign_id = campaign.get_id()
    logger.info("Campaign created: %s", campaign_id)
    return campaign_id


def create_lead_form(
    account: AdAccount,
    form_data: dict,
    page_id: str,
    dry_run: bool,
) -> str | None:
    """Create an Instant Form (lead form) and return its ID."""
    if dry_run:
        logger.info("[DRY-RUN] Would create lead form: %s", form_data["name"])
        return f"dry_run_form_{form_data['id']}"

    logger.info("Creating lead form: %s", form_data["name"])
    params = {
        LeadgenForm.Field.name: form_data["name"],
        LeadgenForm.Field.locale: form_data.get("locale", "en_US"),
        "questions": form_data["questions"],
        "privacy_policy": form_data["privacy_policy"],
        "thank_you_page": form_data["thank_you_screen"],
    }

    form = account.create_lead_gen_form(params=params)
    form_id = form.get_id()
    logger.info("Lead form created: %s -> %s", form_data["name"], form_id)
    return form_id


def create_ad_set(
    account: AdAccount,
    campaign_id: str,
    ad_set_data: dict,
    page_id: str,
    lead_form_id: str | None,
    is_housing: bool,
    dry_run: bool,
) -> str | None:
    """Create an ad set and return its ID."""
    targeting = build_targeting(ad_set_data)
    targeting.update(build_placements(ad_set_data))

    # Housing campaigns: Meta restricts detailed targeting
    if is_housing:
        targeting.pop("flexible_spec", None)
        targeting.pop("age_min", None)
        targeting.pop("age_max", None)

    budget_cents = int(ad_set_data["budget_daily"] * 100)

    promoted_object = {"page_id": page_id}
    if lead_form_id:
        promoted_object["lead_gen_form_id"] = lead_form_id

    params = {
        AdSet.Field.name: ad_set_data["name"],
        AdSet.Field.campaign_id: campaign_id,
        AdSet.Field.daily_budget: budget_cents,
        AdSet.Field.billing_event: AdSet.BillingEvent.impressions,
        AdSet.Field.optimization_goal: AdSet.OptimizationGoal.lead_generation,
        AdSet.Field.bid_strategy: "LOWEST_COST_WITHOUT_CAP",
        AdSet.Field.targeting: targeting,
        AdSet.Field.status: AdSet.Status.paused,
        AdSet.Field.promoted_object: promoted_object,
    }

    if dry_run:
        logger.info("[DRY-RUN] Would create ad set: %s", params[AdSet.Field.name])
        return f"dry_run_adset_{ad_set_data['id']}"

    logger.info("Creating ad set: %s", params[AdSet.Field.name])
    ad_set = account.create_ad_set(params=params)
    ad_set_id = ad_set.get_id()
    logger.info("Ad set created: %s -> %s", ad_set_data["name"], ad_set_id)
    return ad_set_id


def create_ad(
    account: AdAccount,
    ad_set_id: str,
    ad_data: dict,
    video_id: str | None,
    page_id: str,
    dry_run: bool,
) -> str | None:
    """Create an ad with video creative and return its ID."""
    cta_type = ad_data.get("cta", "LEARN_MORE")

    video_data = {
        "call_to_action": {
            "type": cta_type,
            "value": {"link": ad_data["url"]},
        },
        "title": ad_data["headline"],
        "message": ad_data["primary_text"],
        "link_description": ad_data["description"],
    }

    if video_id:
        video_data["video_id"] = video_id
    else:
        video_data["video_id"] = "__PLACEHOLDER__"

    creative_params = {
        AdCreative.Field.name: f"Creative - {ad_data['name']}",
        AdCreative.Field.object_story_spec: {
            "page_id": page_id,
            "video_data": video_data,
        },
    }

    if dry_run:
        logger.info("[DRY-RUN] Would create ad: %s", ad_data["name"])
        return f"dry_run_ad_{ad_data['name']}"

    # Fetch video thumbnail for the creative
    if video_id:
        try:
            from facebook_business.adobjects.advideo import AdVideo as AdVid
            vid = AdVid(video_id)
            thumbs = vid.get_thumbnails(fields=["uri", "is_preferred"])
            preferred = next((t for t in thumbs if t.get("is_preferred")), None)
            thumb_url = preferred["uri"] if preferred else thumbs[0]["uri"]
            video_data["image_url"] = thumb_url
            logger.info("Using thumbnail for %s", ad_data["name"])
        except Exception as e:
            logger.warning("Could not fetch thumbnail for %s: %s", ad_data["name"], e)

    logger.info("Creating creative for: %s", ad_data["name"])
    creative = account.create_ad_creative(params=creative_params)
    creative_id = creative.get_id()

    ad_params = {
        Ad.Field.name: ad_data["name"],
        Ad.Field.adset_id: ad_set_id,
        Ad.Field.creative: {"creative_id": creative_id},
        Ad.Field.status: Ad.Status.paused,
    }

    logger.info("Creating ad: %s", ad_data["name"])
    ad = account.create_ad(params=ad_params)
    ad_id = ad.get_id()
    logger.info("Ad created: %s -> %s", ad_data["name"], ad_id)
    return ad_id


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------
def run(dry_run: bool = False):
    """Main orchestration: load data, create all objects, print summary."""
    config = load_config()
    ads_json = load_ads_json()

    if not dry_run:
        FacebookAdsApi.init(
            config.get("APP_ID", ""),
            config.get("APP_SECRET", ""),
            config["ACCESS_TOKEN"],
        )

    account = AdAccount(config["AD_ACCOUNT_ID"])

    results = {
        "campaigns": [],
        "ad_sets": [],
        "ads": [],
        "lead_forms": [],
    }

    # Load cached video IDs or upload
    cache_path = Path(__file__).resolve().parent / "uploaded_videos.json"
    if cache_path.exists():
        with open(cache_path, "r") as f:
            video_ids = json.load(f)
        logger.info("Loaded %d cached video IDs from uploaded_videos.json", len(video_ids))
    else:
        video_ids = {}
        for asset in ads_json.get("video_assets", []):
            vid_id = upload_video(account, asset["file"], dry_run)
            video_ids[asset["file"]] = vid_id

    # Load lead forms config for Israel Instant Form
    lead_forms_path = Path(__file__).resolve().parent / "lead_forms.json"
    lead_forms_data = {}
    if lead_forms_path.exists():
        with open(lead_forms_path, "r", encoding="utf-8") as f:
            lf_json = json.load(f)
            for form in lf_json.get("lead_forms", []):
                lead_forms_data[form["id"]] = form

    # Process each campaign
    for campaign_data in ads_json["campaigns"]:
        if campaign_data.get("created_id") and not dry_run:
            campaign_id = campaign_data["created_id"]
            logger.info("Using existing campaign: %s -> %s", campaign_data["name"], campaign_id)
        else:
            campaign_id = create_campaign(account, campaign_data, dry_run)
        results["campaigns"].append({
            "name": campaign_data["name"],
            "id": campaign_id,
            "special_ad_categories": campaign_data.get("special_ad_categories", []),
        })

        for ad_set_data in campaign_data["ad_sets"]:
            # Handle Instant Form for Israel
            lead_form_id = None
            if ad_set_data.get("requires_instant_form"):
                form_key = ad_set_data.get("instant_form_id", "")
                form_config = lead_forms_data.get(form_key)
                if form_config:
                    lead_form_id = create_lead_form(
                        account, form_config, config["PAGE_ID"], dry_run
                    )
                    results["lead_forms"].append({
                        "name": form_config["name"],
                        "id": lead_form_id,
                        "language": form_config["language"],
                    })

            is_housing = "HOUSING" in campaign_data.get("special_ad_categories", [])
            ad_set_id = create_ad_set(
                account, campaign_id, ad_set_data, config["PAGE_ID"],
                lead_form_id, is_housing, dry_run,
            )
            results["ad_sets"].append({
                "name": ad_set_data["name"],
                "id": ad_set_id,
                "campaign": campaign_data["name"],
                "budget": f"${ad_set_data['budget_daily']}/day",
                "locations": ", ".join(ad_set_data["locations"]),
                "age": f"{ad_set_data.get('age_min', 25)}-{ad_set_data.get('age_max', 65)}",
            })

            for ad_data in ad_set_data["ads"]:
                vid_id = video_ids.get(ad_data["video"])
                ad_id = create_ad(
                    account, ad_set_id, ad_data, vid_id, config["PAGE_ID"], dry_run
                )
                results["ads"].append({
                    "name": ad_data["name"],
                    "id": ad_id,
                    "ad_set": ad_set_data["name"],
                    "video": ad_data["video"],
                })

    print_summary(results, dry_run)


def print_summary(results: dict, dry_run: bool):
    """Print a rich summary table of all created objects."""
    mode = "[DRY-RUN] " if dry_run else ""
    console.print()
    console.rule(f"[bold green]{mode}QUANTUM Meta Ads -- Creation Summary")

    # Campaigns table
    t_camp = Table(title="Campaigns", show_lines=True)
    t_camp.add_column("Name", style="bold")
    t_camp.add_column("ID", style="cyan")
    t_camp.add_column("Special Category")
    for c in results["campaigns"]:
        cats = ", ".join(c["special_ad_categories"]) if c["special_ad_categories"] else "NONE"
        t_camp.add_row(c["name"], str(c["id"]), cats)
    console.print(t_camp)

    # Lead Forms table
    if results["lead_forms"]:
        t_forms = Table(title="Lead Forms (Instant Forms)", show_lines=True)
        t_forms.add_column("Name", style="bold")
        t_forms.add_column("ID", style="cyan")
        t_forms.add_column("Language")
        for f in results["lead_forms"]:
            t_forms.add_row(f["name"], str(f["id"]), f["language"])
        console.print(t_forms)

    # Ad Sets table
    t_sets = Table(title="Ad Sets", show_lines=True)
    t_sets.add_column("Name", style="bold")
    t_sets.add_column("ID", style="cyan")
    t_sets.add_column("Campaign")
    t_sets.add_column("Budget", style="green")
    t_sets.add_column("Locations")
    t_sets.add_column("Age")
    for s in results["ad_sets"]:
        t_sets.add_row(s["name"], str(s["id"]), s["campaign"], s["budget"], s["locations"], s["age"])
    console.print(t_sets)

    # Ads table
    t_ads = Table(title="Ads", show_lines=True)
    t_ads.add_column("Name", style="bold")
    t_ads.add_column("ID", style="cyan")
    t_ads.add_column("Ad Set")
    t_ads.add_column("Video")
    for a in results["ads"]:
        t_ads.add_row(a["name"], str(a["id"]), a["ad_set"], a["video"])
    console.print(t_ads)

    console.print()
    total = len(results["campaigns"]) + len(results["ad_sets"]) + len(results["ads"])
    console.print(
        f"[bold]{mode}Total: {total} objects "
        f"({len(results['campaigns'])} campaigns, {len(results['ad_sets'])} ad sets, "
        f"{len(results['ads'])} ads)[/bold]"
    )
    console.print("[bold yellow]All objects created as PAUSED -- not running.[/bold yellow]")
    console.print()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="QUANTUM Meta Ads Campaign Creator")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview all API calls without executing them",
    )
    args = parser.parse_args()

    if args.dry_run:
        console.print("[bold yellow]Running in DRY-RUN mode -- no API calls will be made.[/bold yellow]\n")

    try:
        run(dry_run=args.dry_run)
    except Exception:
        logger.exception("Campaign creation failed")
        sys.exit(1)


if __name__ == "__main__":
    main()
