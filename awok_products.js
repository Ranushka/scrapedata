'use strict';

var fs = require('fs');
var fetch = require('node-fetch');

var nextExists = true;

const baseUrl = `https://safe-dusk-29222.herokuapp.com`;

const Nightmare = require('nightmare')
const nightmare = Nightmare({
  show: true
})

var vo = require('vo');

var siteName = "awok";

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

  var nightmare = Nightmare(),
    gotoUrl = catLists,
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
          productList = document.querySelectorAll('.productslist_item_link'),
          tags = document.querySelectorAll('.heading_section')[0].innerText.trim();
          nextExists = document.querySelectorAll('.modern-page-next').length > 0;

        // going through each product
        productList.forEach(function (item) {
          links.push({
            "name": item.getElementsByClassName('productslist_item_title')[0].innerText.trim(),
            "url": item.href,
            "price": item.getElementsByClassName('productslist_item_pricenew')[0].innerText.replace(' AED', ''),
            "brand": tags,
            "site": "awok",
          });
        });

        // return all the values
        return {
          'links': links,
          'nextExists': nextExists
        };

      }).then(function (resalt) {
        nextExists = resalt.nextExists;

        vo(saveToDb)(resalt.links, function(err, result) {
          if (err) throw err;
        });

        // await saveToDb(resalt.links);
      })

    if (nextExists) {
      yield nightmare
        .evaluate(function () {
          document.querySelectorAll('.modern-page-next')[0].click();
        })
        .wait(4000);
    }
  }

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
      console.log('data saved')
    });
}
