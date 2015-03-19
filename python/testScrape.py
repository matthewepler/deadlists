# from lxml import html
import requests
from BeautifulSoup import BeautifulSoup
# import re


payload = {'KEY': 1986}
page = requests.get('http://www.deadlists.com/deadlists/yearresults.asp?', params=payload) #, params=payload
#print a.text
# tree = html.fromstring(page.text)

soup = BeautifulSoup(page.content)
# print soup.prettify()
# title = soup.find('title')
# print title.string

if(soup.find('title').string == "year results sub page"):
	success = True
	print "!! load successful, parsing results..."
else:
	print soup.prettify()
	print "!! ERROR - page results did not match. check results above."

if (success):
	tables = soup.findAll('tr')
	# print tables.prettify()
 	print str(len(tables)) + " table elements found."
