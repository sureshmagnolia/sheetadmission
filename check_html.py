from html.parser import HTMLParser

class P(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = []
        self.errors = []
        
    def handle_starttag(self, tag, attrs):
        if tag not in ['br', 'img', 'meta', 'link', 'input', 'hr', 'source']:
            self.tags.append(tag)
            
    def handle_endtag(self, tag):
        if tag in ['br', 'img', 'meta', 'link', 'input', 'hr', 'source']:
            return
            
        if self.tags and self.tags[-1] == tag:
            self.tags.pop()
        else:
            self.errors.append(f'Mismatched end tag: {tag}, expected: {self.tags[-1] if self.tags else "None"}')

p = P()
p.feed(open('index.html', encoding='utf-8').read())
if p.errors:
    print("Errors found:", p.errors)
if p.tags:
    print('Unclosed tags left over:', p.tags)
if not p.errors and not p.tags:
    print("HTML Structure is PERFECT.")
