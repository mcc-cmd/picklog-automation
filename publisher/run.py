"""PICKLOG publisher — applies the repository's content/ folder to the WordPress site.

Runs as a Render cron job. Every run is idempotent:
  1. plugin self-update (when dist/plugin.json is newer than the site's plugin)
  2. pages        content/pages/*.json (+ .html)  — created/updated immediately
  3. site config  content/site.json               — categories, menus, plugin options, hidden old posts
  4. posts        content/posts/*.json (+ .html)  — updated immediately; NEW posts limited per KST day
  5. prints a compact state snapshot (read back through Render logs)

Environment: WP_URL, WP_USER, WP_APP_PASSWORD, DAILY_POST_LIMIT (default 2), DRY_RUN (0/1)
"""
import datetime as dt
import glob
import hashlib
import json
import os
import re
import sys
import time

import requests

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WP_URL = os.environ.get("WP_URL", "https://picklog.kr").rstrip("/")
AUTH = (os.environ.get("WP_USER", ""), os.environ.get("WP_APP_PASSWORD", "").replace(" ", ""))
LIMIT = int(os.environ.get("DAILY_POST_LIMIT", "2"))
HOURS = os.environ.get("PUBLISH_HOURS", "8-21")  # KST hours in which NEW posts may go out
DRY = os.environ.get("DRY_RUN", "0") == "1"
KST = dt.timezone(dt.timedelta(hours=9))
S = requests.Session()
S.headers.update({"User-Agent": "picklog-publisher/1.0", "Accept": "application/json"})


def log(*a):
    print(*a, flush=True)


def api(method, route, body=None, retries=3):
    url = f"{WP_URL}/?rest_route=/picklog/v1/{route}"
    for i in range(retries):
        try:
            r = S.request(method, url, json=body, auth=AUTH, timeout=60)
            if r.status_code >= 500 and i < retries - 1:
                time.sleep(3 * (i + 1)); continue
            return r
        except requests.RequestException as e:
            if i == retries - 1: raise
            log("network retry:", e); time.sleep(3 * (i + 1))


def load_items(folder):
    items = []
    for jf in sorted(glob.glob(os.path.join(ROOT, "content", folder, "*.json"))):
        with open(jf, encoding="utf-8") as f:
            meta = json.load(f)
        hf = jf[:-5] + ".html"
        meta["_raw"] = open(hf, encoding="utf-8").read() if os.path.exists(hf) else meta.pop("content", "")
        meta.setdefault("type", "page" if folder == "pages" else "post")
        meta["_file"] = os.path.basename(jf)
        items.append(meta)
    return items


LINK_RE = re.compile(r'<a\s+[^>]*href="/([a-z0-9\-]+)/"[^>]*>(.*?)</a>', re.S)


def resolve(item, live, managed_slugs):
    """Unlink internal links to managed posts that are not published yet (avoids 404s while drip-publishing)."""
    def sub(m):
        slug = m.group(1)
        return m.group(0) if (slug in live or slug not in managed_slugs) else m.group(2)
    item["content"] = LINK_RE.sub(sub, item["_raw"])
    raw = json.dumps({k: v for k, v in item.items() if not k.startswith("_") and k != "hash"}, ensure_ascii=False, sort_keys=True)
    item["hash"] = hashlib.sha256(raw.encode()).hexdigest()[:16]
    return item


def upsert(item):
    body = {k: v for k, v in item.items() if not k.startswith("_") and k not in ("order", "not_before")}
    if DRY:
        log("DRY upsert", item["key"]); return {"id": 0, "action": "dry"}
    r = api("POST", "upsert", body)
    if r.status_code != 200:
        log("ERROR upsert", item["key"], r.status_code, r.text[:300]); return None
    res = r.json()
    log(f"{res['action']:8} {item['type']:4} {item['key']} -> {res['link']}")
    return res


def main():
    if not AUTH[0] or not AUTH[1]:
        log("ERROR: WP_USER / WP_APP_PASSWORD are not set in the Render environment."); return 1
    r = api("GET", "state")
    if r.status_code == 404 or (r.status_code == 200 and "plugin" not in r.text):
        log("WAITING: PICKLOG plugin v2.1+ is not active on the site yet (route /picklog/v1/state missing)."); return 0
    if r.status_code in (401, 403):
        log("ERROR: authentication failed — check WP_USER and WP_APP_PASSWORD (application password)."); return 1
    r.raise_for_status()
    state = r.json()
    log(f"site plugin={state['plugin']} wp={state['wp']} theme={state['theme']} items={len(state['items'])}")

    # 1. plugin self-update
    manifest = json.load(open(os.path.join(ROOT, "dist", "plugin.json"), encoding="utf-8"))
    def vt(v): return tuple(int(x) for x in v.split("."))
    if vt(manifest["version"]) > vt(state["plugin"]) and not DRY:
        u = api("POST", "self-update")
        log("self-update:", u.status_code, u.text[:400])
        state = api("GET", "state").json()

    by_key = {i["key"]: i for i in state["items"] if i["key"]}
    pages, posts = load_items("pages"), load_items("posts")
    managed_slugs = {i["slug"] for i in pages + posts}
    live = {i["slug"] for i in state["items"] if i["status"] == "publish"} | {i["slug"] for i in pages if i.get("status", "publish") == "publish"}
    recorded = {k: v["hash"] for k, v in by_key.items()}

    # 2. pages — always kept in sync
    for item in pages:
        resolve(item, live, managed_slugs)
        if recorded.get(item["key"]) != item["hash"] and upsert(item):
            recorded[item["key"]] = item["hash"]

    # 3. site configuration (runs only when content/site.json changes)
    site_path = os.path.join(ROOT, "content", "site.json")
    if os.path.exists(site_path):
        site = json.load(open(site_path, encoding="utf-8"))
        h = hashlib.sha256(json.dumps(site, ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:16]
        if h != state.get("site_hash") and not DRY:
            if site.get("hide_ids"):
                res = api("POST", "status", {"ids": site["hide_ids"], "status": "private"})
                log("hide old posts:", res.status_code, res.text[:300])
            opt = {k: site[k] for k in ("categories", "plugin", "site") if k in site}
            res = api("POST", "options", opt)
            log("options:", res.status_code, res.text[:300])
            if site.get("menus"):
                res = api("POST", "menu", {"menus": site["menus"]})
                log("menus:", res.status_code, res.text[:600])
            api("POST", "options", {"hash": h})

    # 4. posts — new ones are drip-published (DAILY_POST_LIMIT per KST day)
    today = dt.datetime.now(KST).date()
    published_today = sum(1 for i in state["items"] if i["key"] and i["type"] == "post" and i["status"] == "publish" and i["date"][:10] == today.isoformat())
    budget = max(0, LIMIT - published_today)
    h0, h1 = (int(x) for x in HOURS.split("-"))
    if not (h0 <= dt.datetime.now(KST).hour <= h1):
        budget = 0
    waiting = 0
    for item in sorted(posts, key=lambda x: (x.get("order", 9999), x["key"])):
        if item["key"] in recorded:
            continue
        nb = item.get("not_before")
        if (nb and dt.date.fromisoformat(nb) > today) or budget <= 0:
            waiting += 1; continue
        live.add(item["slug"])
        resolve(item, live, managed_slugs)
        if upsert(item):
            recorded[item["key"]] = item["hash"]; budget -= 1
    log(f"posts: published_today={published_today} remaining_budget={budget} waiting_in_queue={waiting}")

    # 5. re-sync anything whose content or resolved links changed
    for item in pages + posts:
        if item["key"] not in recorded:
            continue
        resolve(item, live, managed_slugs)
        if recorded[item["key"]] != item["hash"] and upsert(item):
            recorded[item["key"]] = item["hash"]

    # 6. snapshot for monitoring
    state = api("GET", "state").json()
    snap = {"plugin": state["plugin"], "blog_public": state["blog_public"], "show_on_front": state["show_on_front"], "menu_locations": list(state["menu_locations"] or {}),
            "managed": [[i["id"], i["status"], i["key"], i["chars"]] for i in state["items"] if i["key"]],
            "unmanaged_public": [[i["id"], i["type"], i["title"][:24]] for i in state["items"] if not i["key"] and i["status"] == "publish"],
            "options": state["options"], "categories": [[c["slug"], c["count"]] for c in state["categories"]]}
    log("PICKLOG_STATE " + json.dumps(snap, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
