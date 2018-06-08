
'use strict';

const Nightmare = require('nightmare');
var request = require("request");
var async = require('async');
var fs = require('fs');
var fetch = require('node-fetch');

const baseUrl = `https://safe-dusk-29222.herokuapp.com`;

const nightmare = Nightmare({
  gotoTimeout: 60000,
  show: true,
});

var vo = require('vo');


vo(start)(function (err, result) {
  if (err) throw err;
});

function* getNewScrapURL(urlToScrap) {
  return yield fetch(`https://sitedata-mum.herokuapp.com/api/links/nextScrapLink?site=mumzworld`, {
      method: 'GET'
    }).then(res => res.json())
    .then(json => {
      return json;
    });

}

function* start() {

  let exit = true;
  var i = 0;

  console.log('kicking off')

  while (i < 4) {
    let link, urlToScrap, doneSavedata;

    urlToScrap = yield getNewScrapURL();

    if (urlToScrap.greeting != null) {
      doneSavedata = yield getProductLinks(urlToScrap.greeting.url);
      exit = true;
    } else {
      exit = false;
      console.log("all links scraped")
    }
    

    console.log("done save data")

    i++;
  }

  console.log("all Done")
}

function* getProductLinks(catLists) {

  var nightmare = Nightmare(),
    nextExists = catLists,
    allLinks = [];

  while (nextExists) {
    console.log('loading page', nextExists);
    let scrapedData = yield nightmare
      .goto(nextExists)
      .wait(3000)
      .evaluate(function () {
        var links = [];
        var productList = document.querySelectorAll('.products-grid a.product-image');
        var hasPage = document.querySelectorAll('.toolbar .sprite_img.next.i-next')[0];

        if (hasPage) {
          hasPage = hasPage.href;
        } else {
          hasPage = false;
        }

        productList.forEach(function (item) {
          links.push({
            "name": item.title,
            "url": item.href,
            "price": item.dataset.pprice,
            "brand": item.dataset.pbrand,
            "site": "mumzworld",
          });
        });

        return {
          'links': links,
          'hasPage': hasPage
        };
      })
      .then(function (resalt) {
        nextExists = resalt.hasPage;
        allLinks.push(resalt.links);
        return resalt.links;
      });

    yield saveToDb(scrapedData);

  }

  yield nightmare.end();
  return allLinks;
}

function* saveToDb(params) {
  var jsonData = JSON.stringify(params);
  return yield fetch('https://sitedata-mum.herokuapp.com/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: jsonData
    })
    .then(res => res.json())
    .then(json => {
      console.log(json.length)
    });
}