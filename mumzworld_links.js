'use strict';

const Nightmare = require('nightmare');
const fetch = require('node-fetch');
const fs = require('fs');
const vo = require('vo');

const nightmare = Nightmare({
  gotoTimeout: 60000,
  show: false,
});

console.log(`get main links start`);

nightmare
  .goto('http://www.mumzworld.com/en/all-brands')
  .wait(2000)
  .evaluate(function () {
    var brandPageList = document.querySelectorAll('.brands a.box');
    var brandPageLinks = [];
    brandPageList.forEach(function (item) {

      brandPageLinks.push({
        "name": item.innerText.trim(),
        "url": item.href,
        "site": "mumzworld",
        "scrap": false
      });


    });
    return brandPageLinks;
  })
  .end()
  .then(function (result) {
    vo(prepToSave)(result, function (err) {
      console.log(err)
      if (err) throw err;
    });
  })
  .catch(function (error) {
    console.error('Error:', error);
  });

function* saveToDb(params) {
  console.log(params.length)
  return yield fetch('https://sitedata-mum.herokuapp.com/api/links', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params) 
    })
    .then(res => res.json())
    .then(json => {
      console.log(json)
    });
}

function* prepToSave(catLists) {
  var i, j, temparray = [], chunk = 100;
  for (i = 0, j = catLists.length; i < j; i += chunk) {
    yield saveToDb(catLists.slice(i, i + chunk));
  }
}








