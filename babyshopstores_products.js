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

var siteName = "babyshopstores";

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
    var url = yield nightmare.url();
    console.log(url);

    yield nightmare
      .wait(4000)
      .evaluate(function () {

        var links = [],
          productList = document.querySelectorAll('.product-item'),
          nextExists = document.querySelectorAll('[class="next"]').length ? true : false,
          tagsElemnts = document.querySelectorAll('.breadcrumb > li > a'),
          tags = [];

        // get tags for the product
        tagsElemnts.forEach(function (a) {
          tags.push(a.innerText)
        });

        // going through each product
        productList.forEach(function (item) {
          links.push({
            "name": item.querySelectorAll('[itemprop="name"]')[0].innerText.trim(),
            "url": item.querySelectorAll(".product-link")[0].href,
            "price": item.querySelectorAll('[itemprop="price"]')[0].innerText.trim(),
            "brand": tags,
            "site": "babyshopstores",
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
        .click('.next')
        .wait(2000)
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
