import re
from bs4 import BeautifulSoup

articles = ['blogs/article-1.html', 'blogs/article-2.html', 'blogs/article-3.html']
for article in articles:
    with open('/home/dreamofdreams/website_offline/lorenzostrother.cloudtrek360.com/' + article, 'r') as f:
        soup = BeautifulSoup(f, 'html.parser')
        writing_div = soup.find('div', class_='parchment-writing')
        if writing_div:
            text = writing_div.get_text(strip=True)
            print(f"{article}: {len(text)} characters")
