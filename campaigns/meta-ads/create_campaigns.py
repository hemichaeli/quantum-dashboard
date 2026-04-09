#!/usr/bin/env python3
"""
QUANTUM Meta Ads Campaign Creator

Creates campaigns, ad sets, and ads via the Meta Marketing API
based on the campaign definition in ads.json.

Usage:
    python create_campaigns.py              # Execute campaign creation
    python create_campaigns.py --dry-run    # Preview without creating
"""

import argparse
import json
import logging
import os
import sys
import time
from pathlib import Path

from dotenv import load_dotenv
from facebook_business.api import FacebookAdsApi
from facebook_business.adobjects.adaccount import AdAccount
from facebook_business.adobjects.campaign import Campaign
from facebook_business.adobjects.adset import AdSet
from facebook_business.adobjects.ad import Ad
from facebook_business.adobjects.adcreative import AdCreative
from facebook_business.adobjects.advideo import AdVideo
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
console = Console()

# ---------------------------------------------------------------------------
# Constants – placement mapping
# ---------------------------------------------------------------------------
PLACEMENT_MAP = {
    "facebook": {
        "Feed": "feed",
        "Video feeds": "video_feeds",
        "Stories": "story",
        "Reels": "reels",
    },
    "instagram": {
        "Feed": "stream",
        "Stories": "story",
        "Reels": "reels",
        "Explore": "explore",
    },
}

# Country name → ISO-2 code mapping used by Meta targeting
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
    "Russia": "RU",
    "Ukraine": "UA",
    "Belarus": "BY",
    "Kazakhstan": "KZ",
    "Israel": "IL",
}

CTA_MAP = {
    "Learn More": "LEARN_MORE",
    "En savoir plus": "LEARN_MORE",
    "Mas informacion": "LEARN_MORE",
    "Mehr erfahren": "LEARN_MORE",
    "Подробнее": "LEARN_MORE",
    "מידע נוסף": "LEARN_MORE",
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def load_config():
    """Load environment variables and return config dict."""
    script_dir = Path(__file__).resolve().parent
    env_path = script_dir / ".env"
    load_dotenv(env_path)

    required = ["APP_ID", "APP_SECRET", "ACCESS_TOKEN", "AD_ACCOUNT_ID", "PAGE_ID", "PIXEL_ID"]
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
    """Upload a video file and return its ID. Returns None in dry-run mode."""
    if dry_run:
        logger.info("[DRY-RUN] Would upload video: %s", video_path)
        return None

    full_path = Path(__file__).resolve().parent / "videos" / video_path
    if not full_path.exists():
        logger.warning("Video file not found: %s — skipping upload", full_path)
        return None

    logger.info("Uploading video: %s", video_path)
    video = AdVideo(parent_id=account.get_id())
    video[AdVideo.Field.filepath] = str(full_path)
    video.remote_create()
    video_id = video.get_id()
    logger.info("Video uploaded: %s → %s", video_path, video_id)

    # Allow time for processing
    time.sleep(3)
    return video_id


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
    for interest_name in ad_set_data.get("interests", []):
        interests.append({"name": interest_name})

    targeting = {
        "geo_locations": geo_locations,
        "age_min": 25,
        "age_max": 65,
    }

    if interests:
        targeting["flexible_spec"] = [{"interests": interests}]

    return targeting


def build_placements(ad_set_data: dict) -> dict:
    """Build publisher_platforms and position specs from placement data."""
    fb_positions = []
    ig_positions = []

    placements = ad_set_data.get("placements", {})
    for placement_name in placements.get("facebook", []):
        mapped = PLACEMENT_MAP["facebook"].get(placement_name)
        if mapped:
            fb_positions.append(mapped)

    for placement_name in placements.get("instagram", []):
        mapped = PLACEMENT_MAP["instagram"].get(placement_name)
        if mapped:
            ig_positions.append(mapped)

    result = {
        "publisher_platforms": ["facebook", "instagram"],
    }
    if fb_positions:
        result["facebook_positions"] = fb_positions
    if ig_positions:
        result["instagram_positions"] = ig_positions

    return result


# ---------------------------------------------------------------------------
# Main creation logic
# ---------------------------------------------------------------------------
def create_campaign(account: AdAccount, campaign_data: dict, dry_run: bool) -> str | None:
    """Create the campaign and return its ID."""
    params = {
        Campaign.Field.name: campaign_data["name"],
        Campaign.Field.objective: "OUTCOME_LEADS",
        Campaign.Field.status: Campaign.Status.paused,
        Campaign.Field.special_ad_categories: ["HOUSING"],
    }

    if dry_run:
        logger.info("[DRY-RUN] Would create campaign: %s", params[Campaign.Field.name])
        return "dry_run_campaign_id"

    logger.info("Creating campaign: %s", params[Campaign.Field.name])
    campaign = account.create_campaign(params=params)
    campaign_id = campaign.get_id()
    logger.info("Campaign created: %s", campaign_id)
    return campaign_id


def create_ad_set(
    account: AdAccount,
    campaign_id: str,
    ad_set_data: dict,
    pixel_id: str,
    dry_run: bool,
) -> str | None:
    """Create an ad set and return its ID."""
    targeting = build_targeting(ad_set_data)
    targeting.update(build_placements(ad_set_data))

    budget_cents = int(ad_set_data["budget_daily"] * 100)

    params = {
        AdSet.Field.name: ad_set_data["name"],
        AdSet.Field.campaign_id: campaign_id,
        AdSet.Field.daily_budget: budget_cents,
        AdSet.Field.billing_event: AdSet.BillingEvent.impressions,
        AdSet.Field.optimization_goal: AdSet.OptimizationGoal.lead_generation,
        AdSet.Field.bid_strategy: "LOWEST_COST_WITHOUT_CAP",
        AdSet.Field.targeting: targeting,
        AdSet.Field.status: AdSet.Status.paused,
        AdSet.Field.promoted_object: {"pixel_id": pixel_id},
    }

    if dry_run:
        logger.info("[DRY-RUN] Would create ad set: %s", params[AdSet.Field.name])
        return f"dry_run_adset_{ad_set_data['id']}"

    logger.info("Creating ad set: %s", params[AdSet.Field.name])
    ad_set = account.create_ad_set(params=params)
    ad_set_id = ad_set.get_id()
    logger.info("Ad set created: %s → %s", ad_set_data["name"], ad_set_id)
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
    cta_type = CTA_MAP.get(ad_data.get("cta", ""), "LEARN_MORE")

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

    logger.info("Creating creative for: %s", ad_data["name"])
    creative = account.create_ad_creative(params=creative_params)
    creative_id = creative.get_id()
    logger.info("Creative created: %s", creative_id)

    ad_params = {
        Ad.Field.name: ad_data["name"],
        Ad.Field.adset_id: ad_set_id,
        Ad.Field.creative: {"creative_id": creative_id},
        Ad.Field.status: Ad.Status.paused,
    }

    logger.info("Creating ad: %s", ad_data["name"])
    ad = account.create_ad(params=ad_params)
    ad_id = ad.get_id()
    logger.info("Ad created: %s → %s", ad_data["name"], ad_id)
    return ad_id


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------
def run(dry_run: bool = False):
    """Main orchestration: load data, create all objects, print summary."""
    config = load_config()
    ads_json = load_ads_json()

    if not dry_run:
        FacebookAdsApi.init(config["APP_ID"], config["APP_SECRET"], config["ACCESS_TOKEN"])

    account = AdAccount(config["AD_ACCOUNT_ID"])

    # Track all created objects for summary
    results = {
        "campaign": None,
        "ad_sets": [],
        "ads": [],
    }

    # 1. Create campaign
    campaign_id = create_campaign(account, ads_json["campaign"], dry_run)
    results["campaign"] = {
        "name": ads_json["campaign"]["name"],
        "id": campaign_id,
    }

    # 2. Upload videos and build a lookup
    video_ids = {}
    for asset in ads_json.get("video_assets", []):
        vid_id = upload_video(account, asset["file"], dry_run)
        video_ids[asset["file"]] = vid_id

    # 3. Create ad sets and ads
    for ad_set_data in ads_json["ad_sets"]:
        ad_set_id = create_ad_set(
            account, campaign_id, ad_set_data, config["PIXEL_ID"], dry_run
        )
        results["ad_sets"].append({
            "name": ad_set_data["name"],
            "id": ad_set_id,
            "budget": f"${ad_set_data['budget_daily']}/day",
            "locations": ", ".join(ad_set_data["locations"]),
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

    # 4. Print summary
    print_summary(results, dry_run)


def print_summary(results: dict, dry_run: bool):
    """Print a rich summary table of all created objects."""
    mode = "[DRY-RUN] " if dry_run else ""
    console.print()
    console.rule(f"[bold green]{mode}QUANTUM Meta Ads — Creation Summary")

    # Campaign table
    t_camp = Table(title="Campaign", show_lines=True)
    t_camp.add_column("Name", style="bold")
    t_camp.add_column("ID", style="cyan")
    if results["campaign"]:
        t_camp.add_row(results["campaign"]["name"], str(results["campaign"]["id"]))
    console.print(t_camp)

    # Ad Sets table
    t_sets = Table(title="Ad Sets", show_lines=True)
    t_sets.add_column("Name", style="bold")
    t_sets.add_column("ID", style="cyan")
    t_sets.add_column("Budget", style="green")
    t_sets.add_column("Locations")
    for s in results["ad_sets"]:
        t_sets.add_row(s["name"], str(s["id"]), s["budget"], s["locations"])
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
    total = 1 + len(results["ad_sets"]) + len(results["ads"])
    console.print(
        f"[bold]{mode}Total objects: {total} "
        f"(1 campaign, {len(results['ad_sets'])} ad sets, {len(results['ads'])} ads)[/bold]"
    )
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
        console.print("[bold yellow]Running in DRY-RUN mode — no API calls will be made.[/bold yellow]\n")

    try:
        run(dry_run=args.dry_run)
    except Exception:
        logger.exception("Campaign creation failed")
        sys.exit(1)


if __name__ == "__main__":
    main()
