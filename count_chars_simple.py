import re

articles = ['blogs/article-1.html', 'blogs/article-2.html', 'blogs/article-3.html']
for article in articles:
    with open('/home/dreamofdreams/website_offline/lorenzostrother.cloudtrek360.com/' + article, 'r') as f:
        content = f.read()
        # Extract content between <div class="parchment-writing">...</div>
        match = re.search(r'<div class="parchment-writing">(.*?)</div>', content, re.DOTALL)
        if match:
            text = match.group(1)
            # Remove html tags
            text = re.sub(r'<[^>]+>', '', text)
            # Remove extra whitespace
            text = ' '.join(text.split())
            print(f"{article}: {len(text)} characters")
