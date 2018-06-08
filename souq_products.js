'use strict';


/* var Xvfb = require('xvfb');
var Nightmare = require('nightmare');

var xvfb = new Xvfb({
  silent: true
});
xvfb.startSync(); */


var fs = require('fs');
var fetch = require('node-fetch');

var nextExists = true;

const baseUrl = `https://safe-dusk-29222.herokuapp.com`;

const Nightmare = require('nightmare')
const nightmare = Nightmare({
  show: true
})

var vo = require('vo');

var siteName = "souq";

vo(start)(function (err, result) {
  if (err) throw err;
});

function* start() {


  let i = 0;
  console.log('kicking off')
  while (nextExists) {
    let link, urlToScrap, doneSavedata;
    urlToScrap = yield getNewScrapURL();
    if (urlToScrap.greeting) {
      yield getProductLinks(urlToScrap.greeting.url);
    } else {
      console.log("All links are DONE")
      nextExists = false;
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

  var pageNum = 1;
  var gotoUrl = catLists;
  var nightmare = Nightmare(),
    allLinks = [];

  while (nextExists) {

    let scrapedData = yield nightmare
      .goto(gotoUrl)
      .wait(3000)

    // loging scraping site url
    var url = yield nightmare.url();
    console.log(url);

    yield nightmare
      .evaluate(function () {

        var links = [],
          nextExists = window.location.search != "",
          productList = document.querySelectorAll('.block-grid-large');

        // going through each product
        productList.forEach(function (item) {
          links.push({
            "name": item.querySelectorAll('.itemTitle a')[0].innerText.trim(),
            "url": item.querySelectorAll('.itemTitle a')[0].href,
            "price": item.querySelectorAll('h5.price')[0].innerText.replace(' AED', '').trim(),
            "brand": item.querySelectorAll('[data-subcategory]')[0].getAttribute('data-subcategory'),
            "site": "souq",
          });
        });

        // return all the values
        return {
          'links': links,
          'nextExists': nextExists
        };

      }).then(async function (resalt) {
        nextExists = resalt.nextExists;
        if (nextExists) {
          await saveToDb(resalt.links);
        }

      })

    if (nextExists) {

      var url = yield nightmare.url();
      pageNum++;
      gotoUrl = `${catLists}?section=2&page=${pageNum}`;
      yield nightmare
        .goto(gotoUrl)
        .wait(3000)

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




