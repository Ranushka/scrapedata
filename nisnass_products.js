'use strict';

var fs = require('fs');
var fetch = require('node-fetch');

const baseUrl = `https://safe-dusk-29222.herokuapp.com`;

var Nightmare = require('nightmare');
var nightmare = Nightmare({
  show: true
});

var vo = require('vo');

vo(start)(function (err, result) {
  if (err) throw err;
});

function* start() {

  let exit = true;
  var i = 0;

  console.log('kicking off')

  while (i < 4) {
    let link, urlToScrap, doneSavedata;

    urlToScrap = yield getNewScrapURL();

    if (urlToScrap.greeting.url){
      doneSavedata = yield getProductLinks(urlToScrap.greeting.url);
    }
    

    console.log("done save data")
  }

}

function* getNewScrapURL(urlToScrap) {

  return yield fetch(`https://sitedata-mum.herokuapp.com/api/links/nextScrapLink?site=nisnass`, {
      method: 'GET'
    }).then(res => res.json())
    .then(json => {
      return json;
    });

}

function* getProductLinks(catLists) {

  console.log(catLists);
  var nightmare = Nightmare(),
    gotoUrl = catLists,
    nextExists = true,
    allLinks = [];

  let scrapedData = yield nightmare
    .goto(gotoUrl)
    .wait(3000)

  var previousHeight, currentHeight = 0;
  while (previousHeight !== currentHeight) {
    previousHeight = currentHeight;
    var currentHeight = yield nightmare.evaluate(function () {
      return document.body.scrollHeight;
    });
    yield nightmare.scrollTo(currentHeight, 0)
      .wait(2000);
  }

  yield nightmare
    .evaluate(function () {
      var links = [];
      var productList = "";
      productList = document.querySelectorAll('.PLP-productList .Product');

      productList.forEach(function (item) {
        links.push({
          "name": item.getElementsByClassName("Product-name")[0].innerText.trim(),
          "url": item.getElementsByClassName("Product-details")[0].href,
          "price": item.getElementsByClassName("Product-minPrice")[0].innerText.replace(' AED', ''),
          "brand": item.getElementsByClassName("Product-brand")[0].innerText.trim(),
          "site": "nisnass",
        });
      });

      return {
        'links': links
      };

    })
    .then(function (resalt) {
      allLinks = resalt.links;
    });

  yield saveToDb(allLinks);
  yield nightmare.end();

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
      console.log(json)
    });
}
