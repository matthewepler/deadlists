// Scraper for www.deadlists.com
// Matthew Epler, 2015
// Deadlists data specifications: http://www.deadlists.com/dlsite/dataspec.html


var request = require('request'),
	cheerio = require('cheerio');

var verbose = false,
	JSONoutput = false;	

var parseSet = function(element, showObj, setNum) {
	var thisSet = {};
	thisSet.number = setNum;
	thisSet.songs = [];
	var rawText = element.text().trim();
	var songs = rawText.split(/(;|>|~|;;|%)/);
	songs.forEach(function(element, index, array) {
		var song = {};
		if(index%2 == 0) {
			var temp = element.trim();
			var leftBracket = temp.indexOf('[');
			var rightBracket = temp.indexOf(']');
			if(leftBracket > 0 && rightBracket > 0){
				song.duration = temp.slice(leftBracket+1, rightBracket);
				song.title = temp.slice(0, leftBracket-1);
			} else {
				song.duration = undefined;
				song.title = element.trim();
			}
			
			if(index < songs.length) {
				song.transition = songs[index+1];
			} else {
				song.transition = undefined;
			}

			var leftParen = temp.indexOf('(');
			var rightParen = temp.indexOf(')');
			if(leftParen > 0 && rightParen > 0) {
				var parenContent = temp.slice(leftParen+1, rightParen);
				if(parenContent != undefined && typeof(parenContent == "number")) {
					song.commentRef = parenContent;
				}
			}
			
			if(verbose) console.log("song " + thisSet.songs.length + ": " + song.title 
						+ "{" + song.duration + "}" + " (" + song.transition + ") "
						+ "commentRef=" + song.commentRef);

			thisSet.songs.push(song);
		}
	});
	showObj.sets.push(thisSet);
};

var fetchTicketLinks = function(url) {
	var linksObject = {};
	linksObject.ticketsList = [];
	linksObject.passesList  = [];
	var rootURL     = "http://psilo.com/dead/";

	var thisRequest = request(url, function(err2, respon2, body2) {
		if(!err2 && respon2.statusCode == 200) {
			var page = cheerio.load(body2);
			page('img').each(function(i, element) {
				var searchString = page(this).attr('src');
				if(searchString.search("ticket") > 0) {
					linksObject.ticketsList.push(rootURL + searchString);
				} else if(searchString.search("passes") > 0){
					linksObject.passesList.push(rootURL + searchString);
				}
			});
			if(verbose) console.log("ticketsList: " + linksObject.ticketsList);
			if(verbose) console.log("passesList: " + linksObject.passesList);
		} else {
			console.log("ERROR: something went wrong with an image fetch at: " + url);
			return "Error";
		}
	});
	return linksObject;
};

var thisRequest = function(y) {
	var root = "http://www.deadlists.com/deadlists/yearresults.asp?KEY=";
	var url = root + y;
	request(url, function(err, respon, body) {
		if(!err && respon.statusCode == 200) {
			var $ = cheerio.load(body);
			var tables = $('table');
			var allShows = [];

			for(var i=0; i<tables.length; i+=1) {
				var show = {};
				show.sets = [];
				if(verbose) console.log(">> show #" + allShows.length + " >>");

				var thisTable = $(tables[i]).find('font');
				thisTable.each(function(i, elem) {

					var rawText = $(this).text().trim();
					if(rawText === "Band")
					{

						show.band = $(thisTable[i+1]).text();
						if(verbose) console.log("band: " + show.band);
					} 
					else if(rawText === "Venue")
					{
						show.venue = $(thisTable[i+1]).text();
						if(verbose) console.log("venue: " + show.venue);
					} 
					else if(rawText === "Location")
					{
						var location = $(thisTable[i+1]).text().trim().split(",");
						show.city = location[0];
						show.state = location[1].trim();
						if(verbose) console.log("city: " + show.city);
						if(verbose) console.log("state: " + show.state);
					} 
					else if(rawText === "Date") 
					{
						var dateArray = $(thisTable[i+1]).text().trim().split("-");
							var dateString = dateArray[0].split("/");
							var newDate = new Date(dateString[2].substring(0,2), dateString[0]-1, dateString[1]);
							show.date = newDate;
							if(verbose) console.log("date: " + newDate);
					} 
					else if(rawText === "posters") 
					{
						var posterURL = $(this).find('a').attr('href');
						var rootURL = posterURL.split('.');
						rootURL.pop();
						rootURL = rootURL.join('.');
						show.posterLink = rootURL + '.jpg';
						if(verbose) console.log("posterLink: " + show.posterLink);
					} 
					else if(rawText ==="tickets, passes & laminates")
					{
						show.ticketLinks = fetchTicketLinks($(this).find('a').attr('href'));
						if(verbose) console.log("ticketLinks: " + show.ticketLinks);
					}
					else if(rawText === "One")
					{
						if(verbose) console.log("SET ONE");
						parseSet($(thisTable[i+1]), show, 1);
					}
					else if(rawText === "Two")
					{
						if(verbose) console.log("SET TWO");
						parseSet($(thisTable[i+1]), show, 2);
					}
					else if(rawText === "Three")
					{
						if(verbose) console.log("SET THREE");
						parseSet($(thisTable[i+1]), show, 3);
					}
					else if(rawText === "Encore")
					{
						if(verbose) console.log("ENCORE");
						parseSet($(thisTable[i+1]), show, "encore");
					}
					else if(rawText === "Comments")
					{
						// many diff formats, so user will have to 
						// make connection between commentRef field in song object
						// and (#) in comment string
						if(verbose) console.log("COMMENTS");
						show.comments = $(thisTable[i+1]).text();
						if(verbose) console.log(show.comments);
					}
					else if(rawText === "Download Sources")
					{
						if(verbose) console.log("DOWNLOADS");
						show.downloadSources = [];
						$(thisTable[i+1]).find('a').each(function(index, element) {
							if( element.children != undefined) {
								var thisLink = {};
								try {
									thisLink.name = element.children[0].data;
									thisLink.href = element.attribs.href;
								} catch (err) {
									console.log(err)
								}
								
								if(verbose) console.log(thisLink.name + " - " + thisLink.href);
								show.downloadSources.push(thisLink);
							}
						});
					}
					else if(rawText === "Recordings")
					{
						// no set format despite descrip. in data specs. 
						// not sure how to format this data so it's saved as a string for now
						if(verbose) console.log("RECORDINGS");
						show.recordings = $(thisTable[i+1]).text().trim();
						if(verbose) console.log(show.recordings);
					} 
					else if(rawText === "Contributors")
					{
						if(verbose) console.log("CONTRIBUTORS");
						show.contributors = [];
						$(thisTable[i+1]).text().split(/;|,/).map(function(s){
							if(verbose) console.log(s.trim());
								show.contributors.push(s);
						});
					}
					else if(rawText === "Caretaker")
					{
						if(verbose) console.log("CARETAKER");
						show.caretaker = {};
						var text = $(thisTable[i+1]).text().split("email update");
						show.caretaker.name = text[0].trim();
						var mailto = $(thisTable[i+1]).find('a').attr('href').split(":");
						var mailSplit = mailto[1].split(";");
						var subjectMark = mailSplit[1].indexOf("?");
						show.caretaker.email = mailSplit[1].slice(0, subjectMark);

						if(verbose) console.log(show.caretaker.name + " - " + show.caretaker.email);
					}
				});
				
				allShows.push(show);
				if(verbose) console.log(allShows.length + " shows scraped");
			}
			writeToFile(y, allShows);
		}
	})
};

var writeToFile = function(y, s) {
	var file = JSON.stringify(s);
	if(JSONoutput) console.log(file);
	var fs = require('fs');
	fs.writeFile("/Users/matthewepler/Desktop/" + y + ".JSON", file, function(err) {
	    if(err) {
	        return console.log("WRITE ERROR: " + err);
	    }
    console.log(y + " saved");
	}); 
};

var main = function() {
	// for(var i=1965; i<=1995; i++) {
	// 	thisRequest(i);
	// }
	/* for single year request */
	var thisYear = parseInt(process.argv[2]);
	if(Number.isInteger(thisYear) && thisYear >= 1965 && thisYear <= 1995) {
		thisRequest(thisYear);	
	} else {
		console.log("Check year argument (1965-1995): node <file>.js <year>");
	}
};

main();
