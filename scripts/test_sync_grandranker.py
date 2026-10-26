import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import sync_grandranker as sync

class PublishingTests(unittest.TestCase):
    def test_publish_rename_delete_preserves_legacy_and_canonical(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            (root/'blogs').mkdir()
            (root/'blogs.html').write_text('<html><head></head><body><img src="images/logo.png"><div class="elementor-posts-container elementor-grid" role="list"><a href="blogs/article-1.html">Existing article</a></div></body></html>')
            def fixtures(slug):
                xml=f'<urlset xmlns="{sync.NS["s"]}"><url><loc>{sync.SOURCE}/blog</loc></url>'
                if slug:xml+=f'<url><loc>{sync.SOURCE}/blog/{slug}</loc><lastmod>2026-10-25T00:00:00Z</lastmod></url>'
                xml+='</urlset>'
                return {sync.SOURCE+'/sitemap.xml':xml,sync.SOURCE+'/blog':f'<h2><a href="{sync.SOURCE}/blog/{slug}">Test</a></h2>' if slug else '',sync.SOURCE+'/blog/'+str(slug):f'<html><head><meta property="og:title" content="Test &amp; Hope"><meta name="description" content="Description"><link rel="canonical" href="{sync.SOURCE}/blog/{slug}"><meta property="og:url" content="{sync.SOURCE}/blog/{slug}"></head><body><p>Initial content</p><a href="/blog">Journal</a></body></html>'}
            for slug in ('first','renamed',None):
                # Each deployment starts from a clean checkout, so omitted articles disappear.
                import shutil
                for p in (root/'blogs').iterdir():
                    if p.is_dir():shutil.rmtree(p)
                data=fixtures(slug)
                with patch.object(sync,'fetch',side_effect=lambda url:data[url]):sync.build(root,force=True)
                index=(root/'blogs/index.html').read_text()
                self.assertIn('Existing article',index)
                self.assertIn('src="/images/logo.png"',index)
                self.assertIn('href="/blogs/article-1.html"',index)
                if slug:
                    page=(root/'blogs'/slug/'index.html').read_text()
                    self.assertIn('href="https://dreamofdreams.com/blogs/'+slug+'/"',page)
                    self.assertNotIn(sync.SOURCE,page)
                    self.assertIn('Initial content',page)
                self.assertEqual(len(list((root/'blogs').glob('*/index.html'))),int(slug is not None))
                self.assertNotIn('first/',(root/'sitemap.xml').read_text() if slug!='first' else '')
    def test_unsafe_origin_slug_and_source_failure_do_not_publish(self):
        for url in ('https://attacker.invalid/blog/x',sync.SOURCE+'/blog/../x',sync.SOURCE+'/blog/article-1'):
            with self.assertRaises(ValueError):sync.inventory(f'<urlset xmlns="{sync.NS["s"]}"><url><loc>{url}</loc></url></urlset>')
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            with patch.object(sync,'fetch',side_effect=RuntimeError('source unavailable')):
                with self.assertRaises(RuntimeError):sync.build(root,force=True)
            self.assertEqual(list(root.iterdir()),[])

if __name__=='__main__':unittest.main()
