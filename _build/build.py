#!/usr/bin/env python3
"""Generate service pages, repair-case pages and sitemap.xml.

Run from the repo root:  python3 _build/build.py
Cases live in _build/cases.json; photos go in assets/cases/<slug>/.
Folders starting with "_" are not published by GitHub Pages.
"""
import json
import html
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://miraeauto.github.io"
PHONE, PHONE_TEL = "010-8735-8131", "01087358131"
ADDRESS = "서울시 도봉구 방학로 25 (방학동 725-3)"
TODAY = date.today().isoformat()

SERVICES = [
    {
        "slug": "pangeum", "name": "판금", "h1": "판금 · 찌그러짐 복원",
        "title": "도봉구 방학동 판금 · 찌그러짐 복원",
        "desc": "도봉구 방학동 미래자동차공업사 판금 수리. 문콕, 주차 중 눌림, 접촉사고로 찌그러진 도어·휀다·트렁크를 원래 라인대로 복원합니다.",
        "lead": "찌그러지고 눌린 패널을 원래 라인대로 펴고 맞춰, 차체 본래의 형태를 되살립니다. 교환이 꼭 필요한 경우가 아니라면 복원을 먼저 검토합니다.",
        "when": ["문콕이나 주차 중 생긴 눌림", "접촉사고로 찌그러진 도어·휀다·트렁크", "라인이 틀어진 패널", "범퍼 파손·변형"],
        "body": [
            ("교환보다 복원을 먼저", "패널을 새 부품으로 바꾸면 비용이 커지고 순정 패널을 잃게 됩니다. 미래자동차공업사는 손상 정도를 먼저 확인하고, 복원으로 충분한 경우에는 판금으로 원래 형태를 되살립니다. 교환이 필요한 경우에는 그 이유를 먼저 설명드립니다."),
            ("판금 뒤에는 도장까지", "판금으로 형태를 잡은 뒤에는 퍼티와 서페이서로 바탕면을 만들고, 차량 색상에 맞춰 조색한 수용성 도료로 도장합니다. 마지막으로 특수 열처리와 광택으로 마감해 수리한 자리가 드러나지 않도록 합니다."),
        ],
    },
    {
        "slug": "dosaek", "name": "도색", "h1": "자동차 도색 · 수용성 도장",
        "title": "도봉구 방학동 자동차 도색 · 부분도색 · 수용성 도장",
        "desc": "도봉구 방학동 미래자동차공업사 자동차 도색. 긁힘·까짐·변색 부위를 차량 색상에 맞춰 조색하고 수용성 도료로 부분 도장부터 전체 도장까지 진행합니다.",
        "lead": "차량 고유 색상에 맞춰 조색하고, 냄새와 유해 물질 부담이 적은 수용성 도료로 도장 부스에서 균일하게 칠합니다.",
        "when": ["긁힘·까짐으로 도장면이 벗겨진 경우", "색이 바래거나 변색된 부위", "판금 수리 후 도장이 필요한 패널", "부분 도장부터 전체 도장까지"],
        "body": [
            ("원래 색 그대로", "같은 색상 코드라도 차량마다 색이 조금씩 다릅니다. 차량 색상을 기준으로 조색해 주변 패널과 색 차이가 나지 않도록 맞춥니다."),
            ("수용성 도료 사용", "수용성 도료는 기존 유성 도료보다 냄새와 유해 물질 부담이 적은 친환경 도료입니다. 도장 부스에서 균일하게 칠한 뒤 특수 열처리로 도막을 단단하게 경화시킵니다."),
        ],
    },
    {
        "slug": "oehyeong", "name": "외형복원", "h1": "외형복원",
        "title": "도봉구 방학동 자동차 외형복원",
        "desc": "도봉구 방학동 미래자동차공업사 외형복원. 긁힘, 찍힘, 사고 흔적까지 차량 외형 전반을 처음 상태에 가깝게 되돌립니다.",
        "lead": "긁힘, 찍힘, 사고 흔적까지 차량 외형 전반을 처음 상태에 가깝게 되돌립니다. 판금과 도장을 한 곳에서 하기 때문에 작업 흐름이 끊기지 않습니다.",
        "when": ["여러 부위에 긁힘·찍힘이 생긴 차량", "사고 후 외관을 깔끔하게 되돌리고 싶을 때", "중고차 판매·반납 전 외관 정리", "오래된 차량의 외관 손상"],
        "body": [
            ("판금부터 광택까지 한 곳에서", "손상 진단, 판금, 퍼티·서페이서, 조색·수용성 도장, 특수 열처리·광택까지 모든 과정을 한 곳에서 진행합니다."),
            ("사진으로 먼저 상담", "손상 부위가 여러 곳이라면 차 전체, 옆면, 손상 부위 사진을 문자로 보내주세요. 확인 후 수리 방법을 안내해 드립니다."),
        ],
    },
    {
        "slug": "import-car", "name": "수입차 사고수리", "h1": "수입차 · 국산차 사고수리",
        "title": "도봉구 방학동 수입차 사고수리 · 벤츠 BMW 아우디 판금도색",
        "desc": "도봉구 방학동 미래자동차공업사 수입차 사고수리. 현대·기아부터 벤츠, BMW, 아우디, 렉서스, 캐딜락, 포드 등 수입 전 차종 판금·도색을 합니다.",
        "lead": "현대·기아는 물론 메르세데스-벤츠, BMW, 아우디, 렉서스, 캐딜락, 포드 등 수입 전 차종의 사고 수리를 전문으로 합니다.",
        "when": ["수입차 접촉사고·주차 사고", "수입차 도어·휀다·범퍼 판금도색", "수입차 긁힘·찍힘 외형복원", "국산차 사고 수리"],
        "body": [
            ("국산부터 수입차까지 전 차종", "현대, 기아, 쉐보레, 르노삼성과 메르세데스-벤츠, BMW, 아우디, 캐딜락, 렉서스, 포드 등 수입 전 차종을 수리합니다."),
            ("보험 수리도 함께", "보험 지정 업체로, 수입차 사고도 접수부터 수리·출고까지 함께 처리해 드립니다."),
        ],
    },
    {
        "slug": "insurance", "name": "보험 수리", "h1": "보험 수리",
        "title": "도봉구 방학동 자동차 보험 수리 · 보험 지정 업체",
        "desc": "도봉구 방학동 미래자동차공업사는 보험 지정 업체입니다. 사고 접수부터 판금·도색 수리, 출고까지 함께 처리해 드립니다.",
        "lead": "보험 지정 업체로, 사고 접수부터 수리·출고까지 번거로운 과정을 함께 처리해 드립니다.",
        "when": ["접촉사고 후 보험으로 수리하려는 경우", "보험 처리 여부가 고민될 때", "수입차·국산차 사고 수리", "사고 부위 판금·도색"],
        "body": [
            ("보험 처리, 먼저 물어보세요", "보험으로 처리할지, 자비로 수리할지는 손상 정도와 상황에 따라 달라집니다. 전화나 사진으로 상담해 주시면 차량을 확인한 뒤 안내해 드립니다."),
            ("사고 접수부터 출고까지", "보험사에 수리 업체를 알릴 때 (주)미래자동차공업사로 말씀해 주시면 됩니다. 입고 후 수리 과정과 출고까지 함께 챙겨 드립니다."),
        ],
    },
    {
        "slug": "heat-treatment", "name": "특수 열처리", "h1": "특수 열처리 · 광택",
        "title": "도봉구 방학동 도장 특수 열처리 · 광택",
        "desc": "도봉구 방학동 미래자동차공업사 특수 열처리. 도장 후 열처리로 도막을 단단하게 경화시켜 광택과 내구성을 오래 유지합니다.",
        "lead": "도장 후 특수 열처리로 도막을 단단하게 경화시키고, 광택 작업으로 마무리해 광택과 내구성을 오래 유지합니다.",
        "when": ["판금·도색 수리 후 마감", "도장면을 단단하게 굳혀야 할 때", "수리 부위 광택을 주변과 맞출 때"],
        "body": [
            ("도막을 단단하게", "도료는 칠한 뒤 충분히 경화되어야 단단하고 오래갑니다. 특수 열처리로 도막을 경화시켜 수리 부위가 쉽게 상하지 않도록 합니다."),
            ("광택으로 마무리", "열처리 후 광택 작업으로 수리 부위의 광택을 주변 패널과 맞춰 수리한 자리가 드러나지 않도록 마감합니다."),
        ],
    },
]

PROCESS = ["손상 진단", "판금 복원", "퍼티 · 서페이서", "조색 · 수용성 도장", "특수 열처리 · 광택"]

E = html.escape


def head(title, desc, path, extra_ld=None, og_image=None):
    url = SITE + path
    ld = [{
        "@context": "https://schema.org", "@type": "AutoBodyShop", "name": "(주)미래자동차공업사",
        "url": SITE + "/", "telephone": "+82-10-8735-8131",
        "address": {"@type": "PostalAddress", "streetAddress": "방학로 25 (방학동 725-3)", "addressLocality": "도봉구", "addressRegion": "서울특별시", "addressCountry": "KR"},
    }]
    if extra_ld:
        ld.append(extra_ld)
    img = og_image or SITE + "/assets/og.jpg"
    return f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{E(title)} | 미래자동차공업사</title>
<meta name="description" content="{E(desc)}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:locale" content="ko_KR">
<meta property="og:site_name" content="미래자동차공업사">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{E(title)} | 미래자동차공업사">
<meta property="og:description" content="{E(desc)}">
<meta property="og:image" content="{img}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0a0c0f">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&family=Oswald:wght@500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/sub.css">
<script type="application/ld+json">{json.dumps(ld if len(ld) > 1 else ld[0], ensure_ascii=False)}</script>
</head>
<body>
<header class="top">
  <a class="brand" href="/"><span class="mark">M</span><span>미래자동차공업사</span></a>
  <nav aria-label="주요 메뉴">
    <a href="/#services">서비스</a>
    <a href="/cases/">작업 사례</a>
    <a href="/#consult">수리 상담</a>
    <a href="/#contact">오시는 길</a>
  </nav>
  <a class="call" href="tel:{PHONE_TEL}">전화 상담</a>
</header>
<main>
"""


def cta():
    return f"""<section class="cta-box">
  <h2>사진 보내주시면 바로 안내해 드려요</h2>
  <p>차 전체, 손상된 쪽 옆면, 손상 부위 가까이. 사진 3장을 문자로 보내주시면 확인 후 수리 방법을 알려드립니다.</p>
  <div class="cta-row">
    <a class="btn primary" href="tel:{PHONE_TEL}">전화 상담 {PHONE}</a>
    <a class="btn ghost" href="sms:{PHONE_TEL}">문자로 사진 보내기</a>
  </div>
</section>
"""


def foot():
    links = "".join(f'<a href="/{s["slug"]}/">{E(s["name"])}</a>' for s in SERVICES)
    return f"""</main>
<footer>
  <nav class="flinks" aria-label="서비스">{links}<a href="/cases/">작업 사례</a></nav>
  <b>(주)미래자동차공업사</b>
  <span>{ADDRESS} · H.P {PHONE} · FAX 02-3494-6046</span>
</footer>
<a class="fab" href="tel:{PHONE_TEL}" aria-label="전화 상담">전화</a>
</body>
</html>
"""


def crumbs(items):
    ld = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": n, "item": SITE + p} for i, (n, p) in enumerate(items)]}
    trail = " › ".join(f'<a href="{p}">{E(n)}</a>' if i < len(items) - 1 else f"<span>{E(n)}</span>" for i, (n, p) in enumerate(items))
    return f'<nav class="crumbs" aria-label="현재 위치">{trail}</nav>\n', ld


def service_page(s, cases):
    path = f"/{s['slug']}/"
    trail, crumb_ld = crumbs([("홈", "/"), (s["name"], path)])
    service_ld = {"@context": "https://schema.org", "@type": "Service", "name": s["h1"], "serviceType": s["name"],
                  "areaServed": "서울 도봉구", "provider": {"@type": "AutoBodyShop", "name": "(주)미래자동차공업사", "url": SITE + "/"},
                  "description": s["desc"]}
    out = head(s["title"], s["desc"], path, {"@context": "https://schema.org", "@graph": [service_ld, crumb_ld]})
    out += f'<article class="wrap">\n{trail}<p class="eyebrow">SERVICE</p>\n<h1>{E(s["h1"])}</h1>\n<p class="lead">{E(s["lead"])}</p>\n'
    out += '<section><h2>이럴 때 맡겨 주세요</h2><ul class="checks">' + "".join(f"<li>{E(w)}</li>" for w in s["when"]) + "</ul></section>\n"
    for h, p in s["body"]:
        out += f"<section><h2>{E(h)}</h2><p>{E(p)}</p></section>\n"
    out += '<section><h2>작업 순서</h2><ol class="steps">' + "".join(f"<li><b>{i + 1:02d}</b>{E(t)}</li>" for i, t in enumerate(PROCESS)) + "</ol></section>\n"
    related = [c for c in cases if s["slug"] in c.get("services", [])][:3]
    if related:
        out += '<section><h2>작업 사례</h2><div class="cards">' + "".join(case_card(c) for c in related) + "</div></section>\n"
    out += cta()
    others = "".join(f'<a class="chip" href="/{o["slug"]}/">{E(o["name"])}</a>' for o in SERVICES if o is not s)
    out += f'<section><h2>다른 서비스</h2><div class="chips">{others}</div></section>\n</article>\n'
    return out + foot()


def case_card(c):
    cover = c["photos"][0] if c.get("photos") else None
    img = f'<img src="/assets/cases/{c["slug"]}/{cover["file"]}" alt="{E(cover.get("alt", c["title"]))}" loading="lazy">' if cover else ""
    return f'<a class="card" href="/cases/{c["slug"]}/"><div class="thumb">{img}</div><b>{E(c["title"])}</b><span>{E(c.get("date", ""))}</span></a>'


def case_page(c):
    path = f"/cases/{c['slug']}/"
    trail, crumb_ld = crumbs([("홈", "/"), ("작업 사례", "/cases/"), (c["title"], path)])
    desc = c.get("summary") or f"{c['title']} - 도봉구 방학동 미래자동차공업사 작업 사례"
    cover = SITE + f"/assets/cases/{c['slug']}/{c['photos'][0]['file']}" if c.get("photos") else None
    out = head(c["title"], desc, path, crumb_ld, cover)
    out += f'<article class="wrap">\n{trail}<p class="eyebrow">CASE</p>\n<h1>{E(c["title"])}</h1>\n'
    meta = [("차종", c.get("car")), ("부위", c.get("part")), ("작업", c.get("work")), ("날짜", c.get("date"))]
    out += '<dl class="facts">' + "".join(f"<dt>{k}</dt><dd>{E(v)}</dd>" for k, v in meta if v) + "</dl>\n"
    if c.get("summary"):
        out += f'<p class="lead">{E(c["summary"])}</p>\n'
    figs = []
    for p in c.get("photos", []):
        cap = f"<figcaption>{E(p['caption'])}</figcaption>" if p.get("caption") else ""
        figs.append(f'<figure><img src="/assets/cases/{c["slug"]}/{p["file"]}" alt="{E(p.get("alt", c["title"]))}" loading="lazy">{cap}</figure>')
    out += '<div class="gallery">' + "".join(figs) + "</div>\n"
    links = "".join(f'<a class="chip" href="/{s["slug"]}/">{E(s["name"])}</a>' for s in SERVICES if s["slug"] in c.get("services", []))
    if links:
        out += f'<section><h2>관련 서비스</h2><div class="chips">{links}</div></section>\n'
    out += cta() + "</article>\n"
    return out + foot()


def cases_index(cases):
    trail, crumb_ld = crumbs([("홈", "/"), ("작업 사례", "/cases/")])
    out = head("작업 사례 · 판금 도색 전후 사진", "도봉구 방학동 미래자동차공업사의 판금·도색·외형복원 작업 사례와 전후 사진입니다.", "/cases/", crumb_ld)
    out += f'<article class="wrap">\n{trail}<p class="eyebrow">CASES</p>\n<h1>작업 사례</h1>\n<p class="lead">미래자동차공업사에서 직접 수리한 차량의 전후 사진입니다.</p>\n'
    if cases:
        out += '<div class="cards">' + "".join(case_card(c) for c in cases) + "</div>\n"
    else:
        out += '<p class="empty">작업 사례를 준비하고 있어요. 곧 실제 수리 전후 사진으로 채워집니다.</p>\n'
    out += cta() + "</article>\n"
    return out + foot()


def sitemap(paths):
    urls = "".join(f"  <url>\n    <loc>{SITE}{p}</loc>\n    <lastmod>{TODAY}</lastmod>\n  </url>\n" for p in paths)
    return f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n'


def main():
    cases = json.loads((ROOT / "_build" / "cases.json").read_text(encoding="utf-8"))
    cases = [c for c in cases if not c.get("draft")]
    cases.sort(key=lambda c: c.get("date", ""), reverse=True)
    paths = ["/"]
    for s in SERVICES:
        d = ROOT / s["slug"]
        d.mkdir(exist_ok=True)
        (d / "index.html").write_text(service_page(s, cases), encoding="utf-8")
        paths.append(f"/{s['slug']}/")
    (ROOT / "cases").mkdir(exist_ok=True)
    (ROOT / "cases" / "index.html").write_text(cases_index(cases), encoding="utf-8")
    paths.append("/cases/")
    for c in cases:
        d = ROOT / "cases" / c["slug"]
        d.mkdir(exist_ok=True)
        (d / "index.html").write_text(case_page(c), encoding="utf-8")
        paths.append(f"/cases/{c['slug']}/")
    (ROOT / "sitemap.xml").write_text(sitemap(paths), encoding="utf-8")
    print(f"built {len(SERVICES)} service pages, {len(cases)} case pages, sitemap with {len(paths)} urls")


if __name__ == "__main__":
    main()
