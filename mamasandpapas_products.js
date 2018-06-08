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
    doneSavedata = yield getProductLinks(urlToScrap.greeting.url);
    console.log("done save data")

    i++;
  }

  console.log("all Done")
}


function* getNewScrapURL() {
  // console.log(`getNewScrapURL`);
  return yield fetch(`https://sitedata-mum.herokuapp.com/api/links/nextScrapLink?site=mamasandpapas`, {
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

  while (nextExists) {
    console.log('nextExists ', nextExists);
    yield nightmare
      .evaluate(function () {
        var flag = true;

        try {
          var element = document.querySelectorAll('.load-more');

          if (element.length && element[0].style.display == "") {
            return true
          } else {
            return false
          }

        } catch (error) {
          console.log(error)
        }
      }).then(function (resalt) {
        nextExists = resalt;
      });

    if (nextExists) {
      yield nightmare
        .click('.load-more')
        .wait(2000)
    }

  }

  yield nightmare
    .evaluate(function () {
      var links = [];
      var productList = "";
      productList = document.querySelectorAll('a.product-item');

      productList.forEach(function (item) {
        links.push({
          "name": item.getElementsByClassName('ellipsis-inner')[0].innerText.trim(),
          "url": item.href,
          "price": item.getElementsByClassName('w-product-price')[0].innerText.replace(' AED', ''),
          "brand": document.getElementsByClassName('title')[0].innerText,
          "site": "mamasandpapas",
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
      headers: { 'Content-Type': 'application/json' },
      body: jsonData
    })
    .then(res => res.json())
    .then(json => {
      console.log(json)
    });
}




