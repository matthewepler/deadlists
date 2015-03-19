var request = require('request'),
	cheerio = require('cheerio');

var parseSet = function(element, showObj) {
	showObj.setOne = [];
	var rawText = element.text().trim();
	var songs = rawText.split(/(;|>|~|;;|%)/);
	songs.forEach(function(element, index, array) {
		var song = {};
		if(index%2 == 0) {
			song.title = element.trim();
			if(index < songs.length) {
				song.transition = songs[index+1];
			} else {
				song.transition = undefined;
			}
			
			console.log("song " + showObj.setOne.length + ": " + song.title + "(" + song.transition + ")");
			showObj.setOne.push(song);
		}
		
	});
	console.log("show.setOne.length = " + showObj.setOne.length);
};

var shows = [];

var thisRequest = function() {
	request('http://www.deadlists.com/deadlists/yearresults.asp?KEY=1986', function(err, respon, body) {
		if(!err && respon.statusCode == 200) {
			var $ = cheerio.load(body);
			var tables = $('table');
			
			var show = {};
			console.log(">> show #" + shows.length + " >>");
			$(tables[0]).find('font').each(function(i, elem) {
				switch(i) {
					case 1:
						show.band = $(this).text().trim();
						console.log("band: " + show.band);
						break;
					case 3: 
						show.venue = $(this).text().trim();
						console.log("venue: " + show.venue);
						break;
					case 5:
						var location = $(this).text().trim().split(",");
						show.city = location[0];
						show.state = location[1].trim();
						console.log("city: " + show.city);
						console.log("state: " + show.state);
						break;
					case 7: // add in methods for flags as noted in deadlists spec 
						var dateArray = $(this).text().trim().split("-");
						var dateString = dateArray[0].split("/");
						var newDate = new Date(dateString[2].substring(0,2), dateString[0]-1, dateString[1]);
						show.date = newDate;
						console.log("date: " + newDate);
						break;
					case 8:
						show.posterLink = $(this).find('a').attr('href');
						console.log("posterLink: " + show.posterLink);
						break;
					case 9: 
						show.ticketsLink = $(this).find('a').attr('href');
						console.log("ticketsLink: " + show.ticketsLink);
						// search() functions are working but the array push assignments aren't.
						// var rootURL  = "http://psilo.com/dead/";
						// var imageRequest = request(imageURL, function(err2, respon2, body2) {
						// 	show.tickets = [];
						//     show.passes  = [];
						// 	if(!err2 && respon2.statusCode == 200) {
						// 		var page = cheerio.load(body2);
						// 		page('img').each( function(i, element) {
						// 			var searchString = page(this).attr('src');
						// 			if(searchString.search("ticket") > 0) {
						// 				console.log("ticket image: " + rootURL + searchString);
						// 				show.tickets.push(rootURL + searchString);
						// 			} else if(searchString.search("passes") > 0) {
						// 				console.log("pass image: " + rootURL + searchString);
						// 				show.passes.push(rootURL + searchString);
						// 			}
						// 		});
						// 	}
						// });
						// console.log("tickets: " + show.tickets);
						// console.log("passes: "  + show.passes);
						break;
					case 11: // SetOne - refer to deadlists spec for song seperation characters
							 // add rules for finding bracketed times and extracting just in case
							 // data struction should be one object per song, includeing title, time, transition, and flags
						console.log("SET ONE");	 
						parseSet($(this), show);
						break;
					default:
				}
			});
			shows.push(show);
			console.log("shows.length = " + shows.length);
		}
	})
};

thisRequest();

// Deadlists spec: http://www.deadlists.com/dlsite/dataspec.html

// BAND
// VENUE
// CITY
// STATE
// DATE
// SET1
// SET2
// SET3
// ENCORE
// COMMENTS
// RECORDING
// CONTRIBUTORS

// RETURNED <font> elements within a single <table> element
//0 Band
// ;;
//1 Grateful Dead
// ;;
//2 Venue
// ;;
//3 Henry J. Kaiser Convention Center
// ;;
//4 Location
// ;;
//5 Oakland, 
// 		CA
// ;;
//6 Date
// ;;
//7 2/8/86 - Saturday
// ;;
//8 posters
// ;;
//9 tickets, passes & laminates
// ;;
//10 One
// ;;
//11 Iko Iko ; Little Red Rooster ; Peggy-O ; Beat It On Down The Line ; Stagger Lee ; It's All Over Now ; Bertha ; One More Saturday Night
// ;;
//12 Two
// ;;
//13 Mississippi Half-Step Uptown Toodeloo [6:04] > Franklin's Tower [7:58] > Playing In The Band [9:16] > China Doll [6:14] > Playing In The Band Jam [4:33] > Drums [5:59] > Space [8:08] > Gimme Some Lovin' [4:33] > Black Peter [7:23] > Sugar Magnolia [8:43] (1)
// ;;
//14 Encore
// ;;
//15 Keep Your Day Job [3:55]
// ;;
//16 Comments
// ;;
//17 (1) { Sugar Magnolia [5:53] pause [0:13] Sunshine Daydream [2:37] }
// ;;
//18 Download Sources
// ;;
//19 Soundboard
		
// 		Soundboard
		
// 		Audience
		
// 		Audience
		
// 		Soundboard
// ;;
// Recordings
// ;;
// AUD 90; Show 180 FM-SBD.
// ;;
// Contributors
// ;;
// johno@paul.rutgers.edu (John Oleynick); chimpowl@well.com (Jim Powell)
// ;;
// Caretaker
// ;;
// Jim Van Houten email update
// ;;
