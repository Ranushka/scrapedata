'use strict';


/* var Xvfb = require('xvfb');
var Nightmare = require('nightmare');

var xvfb = new Xvfb({
  silent: true
});
xvfb.startSync(); */


var fs = require('fs');
var fetch = require('node-fetch');

const baseUrl = `https://safe-dusk-29222.herokuapp.com`;

const Nightmare = require('nightmare')
const nightmare = Nightmare({
  show: true
})

var vo = require('vo');

var siteName = "carrefouruae";

vo(start)(function (err, result) {
  if (err) throw err;
});

function* start() {

  let exit = true;
  var i = 0;
  console.log('kicking off')
  while (exit) {
    let link, urlToScrap, doneSavedata;
    urlToScrap = yield getNewScrapURL();
    if (urlToScrap.greeting) {
      yield getProductLinks(urlToScrap.greeting.url);
    } else {
      console.log("All links are DONE")
      exit = false;
    }
    i++;
  }
  console.log(`${siteName} done save data ${i}`);

}

function* getNewScrapURL() {
  return yield fetch(`https://sitedata-mum.herokuapp.com/api/links/nextScrapLink?site=${siteName}`, {
      method: 'GET'
    }).then(res => res.json())
    .then(json => {
      return json;
    });
}

function* getProductLinks(catLists) {

  var nightmare = Nightmare(),
    gotoUrl = catLists,
    nextExists = true,
    allLinks = [];

  let scrapedData = yield nightmare
    .goto(gotoUrl)


  while (nextExists) {

    // loging scraping site url
    var url = yield nightmare
      .wait(4000)
      .url();
    console.log(url);

    yield nightmare
      .evaluate(function () {

        var links = [],
          productList = document.querySelectorAll('.plp-list__item'),
          nextExists = document.querySelectorAll('.plp-pagination__nav:last-child')[0].classList.length == 1,
          tagsElemnts = document.querySelectorAll('.breadcrumb > li > a'),
          // tags = [],
          tags = document.querySelectorAll('.comp-breadcrumb__item:last-child')[0].innerText.trim();

        // going through each product
        productList.forEach(function (item) {
          links.push({
            "name": item.querySelectorAll('.comp-productcard__img')[0].title.trim(),
            "url": item.querySelectorAll(".comp-productcard__wrap > a")[0].href,
            "price": item.querySelectorAll('.comp-productcard__price')[0].innerText.trim(),
            "brand": tags,
            "site": "carrefouruae",
          });
        });

        // return all the values
        return {
          'links': links,
          'nextExists': nextExists
        };

      }).then(async function (resalt) {
        nextExists = resalt.nextExists;
        await saveToDb(resalt.links);
      })

    if (nextExists) {
      yield nightmare
      .click('.plp-pagination__nav:last-child a');

      var nextPageUrl = yield nightmare
      .evaluate(function () {
              return document.querySelectorAll('.plp-pagination__nav:last-child a')[0].href
            })

            yield nightmare.goto(nextPageUrl)
        // .wait(4000);
                // .evaluate(function () {
                //   document.querySelectorAll('.plp-pagination__nav:last-child')[0].click()
                // })
    }
  }

  yield nightmare.end();

}

function saveToDb(params) {
  console.log(params.length);
  var jsonData = JSON.stringify(params);

  fetch('https://sitedata-mum.herokuapp.com/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: jsonData
    })
    .then(res => res.json())
    .then(json => {
      console.log('data saved')
    });
}
