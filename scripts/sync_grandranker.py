"""Build crawlable main-domain pages from the public GrandRanker receiver.
No webhook or Google credentials are used by this build.
"""
import hashlib
import html
import json
import os
from pathlib import Path
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from html.parser import HTMLParser

SOURCE = 'https://dreamofdreams-articles-97975815838.us-central1.run.app'
SITE = 'https://dreamofdreams.com'
NS = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
ROOT = Path(__file__).resolve().parents[1]


def fetch(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'DreamOfDreams-Publisher/1.0'})
    with urllib.request.urlopen(request, timeout=90) as response:
        return response.read().decode('utf-8')


class Metadata(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.meta = {}
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'meta':
            self.meta[a.get('property', a.get('name', ''))] = a.get('content', '')


def rewrite(text):
    # Only rewrite our service's own routes; unrelated article links stay intact.
    text = text.replace(SOURCE + '/blog/', SITE + '/blogs/')
    text = text.replace(SOURCE + '/blog', SITE + '/blogs/')
    text = text.replace('href="/blog"', 'href="/blogs/"')
    return text


def card(page, url):
    m = Metadata(page).meta
    esc = lambda v: html.escape(v, quote=True)
    title = esc(m.get('og:title', 'Read article'))
    description = esc(m.get('description', ''))
    image = m.get('og:image', '')
    thumb = ''
    if urllib.parse.urlparse(image).scheme in ('http', 'https'):
        thumb = f'<a class="elementor-post__thumbnail__link" href="{esc(url)}"><div class="elementor-post__thumbnail"><img loading="lazy" src="{esc(image)}" alt=""></div></a>'
    return f'<article class="elementor-post elementor-grid-item entry has-media" role="listitem">{thumb}<div class="elementor-post__text"><h3 class="elementor-post__title"><a href="{esc(url)}">{title}</a></h3><div class="elementor-post__excerpt"><p>{description}</p></div><a class="elementor-post__read-more" href="{esc(url)}">Read Article</a></div></article>'


def inventory(xml):
    rows = []
    seen = set()
    for item in ET.fromstring(xml).findall('s:url', NS):
        url = item.findtext('s:loc', '', NS)
        parsed = urllib.parse.urlsplit(url)
        if parsed.scheme != 'https' or parsed.netloc != urllib.parse.urlsplit(SOURCE).netloc:
            raise ValueError('Unexpected sitemap origin')
        if parsed.path in ('/blog', '/blog/'):
            continue
        if not parsed.path.startswith('/blog/') or parsed.query or parsed.fragment:
            raise ValueError('Unexpected article URL')
        slug = urllib.parse.unquote(parsed.path[len('/blog/'):])
        if not re.fullmatch(r'[\w-]+', slug, flags=re.UNICODE) or slug in seen:
            raise ValueError('Unsafe or duplicate article slug')
        # Protect manually authored files and index routes from upstream collisions.
        if slug in ('index', 'article-1', 'article-2', 'article-3'):
            raise ValueError('Article slug conflicts with a legacy page')
        seen.add(slug)
        rows.append({'slug': slug, 'source_url': url, 'updated_at': item.findtext('s:lastmod', '', NS)})
    return sorted(rows, key=lambda r: r['source_url'])


def build(root=ROOT, force=False):
    rows = inventory(fetch(SOURCE + '/sitemap.xml'))
    fingerprint = hashlib.sha256(json.dumps(rows, sort_keys=True).encode()).hexdigest()
    manifest = {'version': 1, 'fingerprint': fingerprint, 'articles': rows}
    # Fetch everything before mutating the artifact; failures never publish a partial blog.
    pages = {r['slug']: rewrite(fetch(r['source_url'])) for r in rows}
    source_index = fetch(SOURCE + '/blog')
    # Source order is published_at descending, which differs from sitemap order.
    ordered = re.findall(r'<h2><a href="' + re.escape(SOURCE) + r'/blog/([^"<>]+)">', source_index)
    by_slug = {r['slug']: r for r in rows}
    ordered = [urllib.parse.unquote(s) for s in ordered]
    if set(ordered) != set(by_slug) or len(ordered) != len(rows):
        raise ValueError('Article inventory changed during build; retry on next sync')
    cards = ''.join(card(pages[s], SITE + '/blogs/' + urllib.parse.quote(s) + '/') for s in ordered)
    for slug, page in pages.items():
        # Canonical URLs use the same trailing slash GitHub Pages serves.
        url = SITE + '/blogs/' + urllib.parse.quote(slug)
        page = page.replace(url + '"', url + '/"')
        target = root / 'blogs' / slug / 'index.html'
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(page)
    template = (root / 'blogs.html').read_text()
    marker = '<!-- GRANDRANKER ARTICLES -->'
    template = re.sub(re.escape(marker) + r'.*?<!-- /GRANDRANKER ARTICLES -->', '', template, flags=re.S)
    template, count = re.subn(r'(<div class="elementor-posts-container[^>]+role="list">)', lambda m: m[1] + marker + cards + '<!-- /GRANDRANKER ARTICLES -->', template, count=1)
    if count != 1:
        raise ValueError('Existing blog grid not found')
    template = re.sub(r'<link rel="canonical"[^>]*>', '', template)
    template = template.replace('</head>', '<link rel="canonical" href="https://dreamofdreams.com/blogs/">\n</head>')
    (root / 'blogs.html').write_text(template)
    # The directory version must resolve assets against the root, just like blogs.html.
    directory = re.sub(r'((?:href|src|srcset|action)=[\'"])(?!https?:|//|/|#|data:|mailto:|tel:)([^\'"]+)', lambda m: m[1] + '/' + m[2], template)
    directory = re.sub(r'(srcset=[\'\"])([^\'\"]+)', lambda m: m[1] + ', '.join(part.strip() if part.strip().startswith(('https:', 'http:', '/', 'data:')) else '/' + part.strip() for part in m[2].split(',')), directory)
    (root / 'blogs' / 'index.html').write_text(directory)
    urls = [(SITE + '/', ''), (SITE + '/blogs/', '')]
    urls += [(SITE + '/' + p, '') for p in ('books.html', 'about.html', 'contact.html')]
    urls += [(SITE + '/blogs/article-' + str(i) + '.html', '') for i in range(1, 4)]
    urls += [(SITE + '/blogs/' + urllib.parse.quote(r['slug']) + '/', r['updated_at']) for r in rows]
    sitemap = ET.Element('urlset', xmlns=NS['s'])
    for url, modified in urls:
        node = ET.SubElement(sitemap, 'url')
        ET.SubElement(node, 'loc').text = url
        if modified:
            ET.SubElement(node, 'lastmod').text = modified
    (root / 'sitemap.xml').write_bytes(ET.tostring(sitemap, encoding='utf-8', xml_declaration=True))
    (root / 'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: https://dreamofdreams.com/sitemap.xml\n')
    (root / 'data').mkdir(exist_ok=True)
    (root / 'data' / 'grandranker-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(f'Built {len(rows)} GrandRanker articles and preserved 3 existing articles.')
    return True


if __name__ == '__main__':
    changed = build(force=True)
    if os.environ.get('GITHUB_OUTPUT'):
        with open(os.environ['GITHUB_OUTPUT'], 'a') as output:
            output.write('changed=' + str(changed).lower() + '\n')
