from requests_html import HTMLSession

session = HTMLSession()

r = session.get("https://gimmethedog.com/MLB?q=H%20and%20game%20number%20%3D%20162%20and%20season%3D2025")

r.html.render() 

print(r.text)