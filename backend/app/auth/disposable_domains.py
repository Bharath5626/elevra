"""
Blocklist of known disposable / temporary email domain providers.
Add new domains here as they are discovered.
"""
import logging
import urllib.parse
import httpx

log = logging.getLogger(__name__)

DISPOSABLE_DOMAINS: frozenset[str] = frozenset({
    # ── Duoley / temp-inbox family (user-reported) ────────────
    "duoley.com", "kzccv.com", "qiott.com", "rbias.com",
    "snapatt.com", "tlsrp.com", "vjuum.com", "laafd.com",
    "txcct.com", "yevme.com", "biyac.com", "cuvox.de",
    "dayrep.com", "fleckens.hu", "guam.net", "superrito.com",
    "teleworm.us", "armyspy.com", "jourrapide.com", "rhyta.com",
    "einrot.com", "einrot.de", "delikkt.de",

    # ── Mailinator family ──────────────────────────────────────
    "mailinator.com", "mailinator2.com", "trashinator.com",
    "suremail.info", "safetymail.info",

    # ── Guerrilla Mail family ──────────────────────────────────
    "guerrillamail.com", "guerrillamail.net", "guerrillamail.org",
    "guerrillamail.biz", "guerrillamail.de", "guerrillamail.info",
    "guerrillamailblock.com", "grr.la", "sharklasers.com",
    "spam4.me", "ggmail.guru", "yopmail.com", "yopmail.fr",
    "cool.fr.nf", "jetable.fr.nf", "nospam.ze.tc",
    "nomail.xl.cx", "mega.zik.dj", "speed.1s.fr",
    "courriel.fr.nf", "moncourrier.fr.nf", "monemail.fr.nf",
    "monmail.fr.nf",

    # ── 10 Minute Mail family ──────────────────────────────────
    "10minutemail.com", "10minutemail.net", "10minutemail.org",
    "10minutemail.co.uk", "10minutemail.de", "10minutemail.ru",
    "10minutemail.be", "10minutemail.cf", "10minutemail.ga",
    "10minutemail.gq", "10minutemail.ml", "10minutemail.us",
    "10minutemail.pro",

    # ── Temp-Mail / similar ────────────────────────────────────
    "temp-mail.org", "temp-mail.com", "tempmail.com",
    "tempmail.net", "tmpmail.net", "tmpmail.org",
    "tempr.email", "tempmail.ninja", "temporary-mail.net",
    "temporaryemail.net", "temporaryemail.us", "temporaryinbox.com",
    "throwam.com", "throwaway.email", "throwam.com",
    "trashmail.com", "trashmail.at", "trashmail.io",
    "trashmail.me", "trashmail.net", "trashmail.xyz",
    "trashdevil.com", "trashdevil.de",

    # ── Maildrop / Mailnull ────────────────────────────────────
    "maildrop.cc", "mailnull.com", "mailnesia.com",
    "mailexpire.com", "fakeinbox.com", "objectmail.com",

    # ── Dispostable ────────────────────────────────────────────
    "dispostable.com", "discard.email",

    # ── Spam-oriented ─────────────────────────────────────────
    "spamgourmet.com", "spamgourmet.net", "spamgourmet.org",
    "spamspot.com", "spamtroll.net", "spamoff.de",
    "spaml.com", "spaml.de", "spamevader.com",
    "spamcowboy.com", "spamcowboy.net", "spamcowboy.org",
    "spamhole.com", "spamkill.info",

    # ── Nada / Getnada ────────────────────────────────────────
    "getnada.com", "nada.email",

    # ── Others (popular) ──────────────────────────────────────
    "filzmail.com", "sneakemail.com", "mailmoat.com",
    "inboxclean.org", "inboxclean.com", "pookmail.com",
    "owlymail.com", "umail.net", "trbvm.com",
    "tmailinator.com", "tilien.com", "turual.com",
    "tyldd.com", "twinmail.de", "trayna.com",
    "spamthis.co.uk", "spamthisplease.com",
    "thisisnotmyrealemail.com", "thankyou2010.com",
    "wegwerfmail.de", "wegwerfmail.net", "wegwerfmail.org",
    "sofimail.com", "spam.la", "spamoff.de",
    "mailnull.com", "mailnesia.com",
    "jetable.com", "jetable.net", "jetable.org", "jetable.fr",
    "nomail.pw", "nomail.xl.cx", "nwldx.com",
    "e4ward.com", "mailme.lv", "koszmail.pl",
    "hushmail.com",
    "yomail.info", "yomail.com",
    "mail-temporaire.fr", "mail-temporaire.com",
    "dispostable.com", "discard.email",
    "getonemail.com", "getonemail.net",
    "anonymbox.com", "anonymizedemail.com",
    "crazymailing.com", "cuvox.de",
    "dayrep.com", "delikkt.de",
    "einrot.com", "einrot.de",
    "fleckens.hu", "fluxinbox.com",
    "guam.net",
    "haltospam.com", "hartbot.de",
    "ieh-mail.de", "imails.info",
    "inboxbear.com",
    "jnxjn.com",
    "kasmail.com", "kingsq.ga",
    "klzlk.com",
    "lhsdv.com", "lifebyfood.com",
    "lroid.com",
    "m4ilweb.info", "maileater.com",
    "mailforspam.com",
    "mailguard.me",
    "mailme24.com",
    "mailnew.com",
    "mailscrap.com",
    "mailseal.de",
    "mailslapping.com",
    "mailslite.com",
    "malahov.de",
    "mbx.cc",
    "mfsa.ru",
    "mierdamail.com",
    "ministry-of-silly-walks.de",
    "moncourrier.fr.nf",
    "myalias.pw",
    "myspamless.com",
    "mzicons.com",
    "netzidiot.de",
    "nnot.net",
    "noblepioneer.com",
    "nonspam.eu",
    "nonspammer.de",
    "noref.in",
    "nowhere.org",
    "nospamfor.us",
    "nospamthanks.info",
    "nowmymail.com",
    "nullbox.info",
    "nut.cc",
    "objectmail.com",
    "odaymail.com",
    "one-time.email",
    "oneoffemail.com",
    "onewaymail.com",
    "opayq.com",
    "ordinaryamerican.net",
    "otherinbox.com",
    "ourklips.com",
    "outlawspam.com",
    "ovpn.to",
    "owlpic.com",
    "pancakemail.com",
    "paplease.com",
    "pcusers.otherinbox.com",
    "pepbot.com",
    "pfui.ru",
    "photo-impact.eu",
    "pickupmail.de",
    "pjjkp.com",
    "plexolan.de",
    "pookmail.com",
    "pop3.xyz",
    "proxymail.eu",
    "prtnx.com",
    "prtz.eu",
    "punkass.com",
    "put2.net",
    "randomail.net",
    "rcpt.at",
    "reallymymail.com",
    "recode.me",
    "recursor.net",
    "regbypass.comsafe-mail.net",
    "rejectmail.com",
    "reliable-mail.com",
    "rklips.com",
    "rppkn.com",
    "rtrtr.com",
    "s0ny.net",
    "safe-mail.net",
    "safetypost.de",
    "sandelf.de",
    "saynotospams.com",
    "selfdestructingmail.org",
    "sendspamhere.com",
    "sevendigits.nl",
    "sharedmailbox.org",
    "shitaway.cf",
    "shitmail.de",
    "shitmail.ga",
    "shitmail.gq",
    "shitmail.me",
    "shitmail.ml",
    "shitmail.org",
    "shitware.nl",
    "shortmail.net",
    "sibmail.com",
    "slopsbox.com",
    "slushmail.com",
    "smashmail.de",
    "smellfear.com",
    "snakemail.com",
    "sneakemail.com",
    "sofort-mail.de",
    "soisz.com",
    "spam.care",
    "spam.su",
    "spam4.me",
    "spambob.com",
    "spambob.net",
    "spambob.org",
    "spambox.info",
    "spambox.irishspringrealty.com",
    "spambox.us",
    "spamcannon.com",
    "spamcannon.net",
    "spamcero.com",
    "spamcon.org",
    "spamcorptastic.com",
    "spamdecoy.com",
    "spamfree.eu",
    "spamfree24.com",
    "spamfree24.de",
    "spamfree24.eu",
    "spamfree24.info",
    "spamfree24.net",
    "spamfree24.org",
    "spamgoes.in",
    "spamherelots.com",
    "spamhereplease.com",
    "spamify.com",
    "spaminator.de",
    "spaminmotion.com",
    "spamloving.org",
    "spammotel.com",
    "spammy.host",
    "spamnot.com",
    "spamrecycle.com",
    "spamslicer.com",
    "spamstack.net",
    "spamthisplease.com",
    "spamtrail.com",
    "spamtree.ru",
    "spamzz.com",
    "super-auswahl.de",
    "supergreatmail.com",
    "supermailer.jp",
    "suremail.info",
    "svk.jp",
    "sweetxxx.de",
    "tafmail.com",
    "tafoi.gr",
    "techemail.com",
    "telecomix.pl",
    "tempalias.com",
    "tempe-mail.com",
    "tempemail.biz",
    "tempemail.com",
    "tempemail.net",
    "tempinbox.co.uk",
    "tempinbox.com",
    "tempmail.eu",
    "tempmail2.com",
    "temporaryemail.net",
    "temporizemail.com",
    "tempsky.com",
    "tempthe.net",
    "thankyou2010.com",
    "thecloudindex.com",
    "thisisnotmyrealemail.com",
    "throam.com",
    "throwam.com",
    "throwaway.email",
    "tilien.com",
    "tmailinator.com",
    "toiea.com",
    "tpwi.net",
    "tradermail.info",
    "trash-amor.com",
    "trash-mail.at",
    "trash-mail.cf",
    "trash-mail.de",
    "trash-mail.ga",
    "trash-mail.gq",
    "trash-mail.io",
    "trash-mail.ml",
    "trash-mail.tk",
    "trash2009.com",
    "trash2010.com",
    "trash2011.com",
    "trashmail.at",
    "trashmail.com",
    "trashmail.io",
    "trashmail.me",
    "trashmail.net",
    "trashmail.org",
    "trashmail.xyz",
    "trashmailer.com",
    "trillianpro.com",
    "trmailbox.com",
    "trommlerbilder.de",
    "ttt.mefound.com",
    "ttttt.pl",
    "turual.com",
    "twinmail.de",
    "tyldd.com",
    "uggsrock.com",
    "umail.net",
    "uroid.com",
    "veryrealemail.com",
    "viditag.com",
    "viewcastmedia.com",
    "viewcastmedia.net",
    "viewcastmedia.org",
    "webm4il.info",
    "wegwerfmail.de",
    "wegwerfmail.net",
    "wegwerfmail.org",
    "wh4f.org",
    "whyspam.me",
    "willhackforfood.biz",
    "willselfdestruct.com",
    "wronghead.com",
    "wuzupmail.net",
    "xoxy.net",
    "xyzfree.net",
    "yamed.se",
    "ypmail.webarnak.fr.eu.org",
    "yuurok.com",
    "z1p.biz",
    "zebins.com",
    "zebins.eu",
    "zehnminuten.de",
    "zehnminutenmail.de",
    "zoemail.com",
    "zoemail.net",
    "zoemail.org",
    "zomg.info",
    # ── Free domains often abused ──────────────────────────────
    # (uncomment if your user base doesn't legitimately use these)
    # "mailnull.com",
})


def is_disposable_email(email: str) -> bool:
    """Return True if the email's domain is in the static blocklist."""
    try:
        domain = email.strip().lower().split("@", 1)[1]
    except IndexError:
        return False
    return domain in DISPOSABLE_DOMAINS


async def is_disposable_email_live(email: str) -> bool:
    """Check email against IPQualityScore API with static list as fast pre-filter.

    Returns True if the email should be blocked.
    Falls back to the static list only if the API is unreachable, so a
    network hiccup never prevents legitimate users from registering.
    """
    # Fast path: static blocklist (no network call needed)
    if is_disposable_email(email):
        return True

    # Live check via IPQualityScore
    from ..config import settings  # deferred to avoid circular import at module load

    api_key = settings.IPQS_API_KEY
    if not api_key:
        log.warning("IPQS_API_KEY not set — skipping live disposable-email check")
        return False

    encoded_email = urllib.parse.quote(email, safe="")
    url = f"https://ipqualityscore.com/api/json/email/{api_key}/{encoded_email}"

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)

        if resp.status_code != 200:
            log.warning("IPQS returned HTTP %s for %s", resp.status_code, email)
            return False

        data = resp.json()
        # Only block on disposable=True. fraud_score also rates the username
        # and causes false positives on real addresses like test@gmail.com.
        blocked = bool(data.get("disposable"))
        if blocked:
            log.info("IPQS blocked %s (disposable=True fraud=%s)", email, data.get("fraud_score"))
        return blocked

    except Exception:
        # Network error — fail open so real users are never locked out
        log.exception("IPQS check failed for %s — allowing through", email)
        return False
