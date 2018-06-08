const Nightmare = require('nightmare')
const nightmare = Nightmare({
  show: true
})
nightmare
  .goto(`https://www.noon.com/en-ae/baby-products/feeding-16153`)
  .wait(4000)
  .evaluate(function () {

    var links = [],
    var productList = document.querySelectorAll('.product-item'),
    var nextExists = document.querySelectorAll('[class="next"]').length ? true : false,
    var tagsElemnts = document.querySelectorAll('.breadcrumb > li > a'),
    var tags = [];

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

  })
  .end()
  .then(function (result) {

    console.log(result)

  })
  .catch(error => {
    console.error('Search failed:', error)
  })