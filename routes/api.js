'use strict';
const StockModel = require('../models/stock');  // Ensure the correct path to the model

async function createStock(stock, like, ip) {
  const newStock = new StockModel({
    symbol: stock,
    likes: like ? [ip] : [],
  });
  const savedNew = await newStock.save();
  return savedNew;
}

async function findStock(stock) {
  return await StockModel.findOne({ symbol: stock }).exec();
}

async function saveStock(stock, like, ip) {
  let saved = {};
  const foundStock = await findStock(stock);
  if (!foundStock) {
    const createsaved = await createStock(stock, like, ip);
    saved = createsaved;
    return saved;
  } else {
    if (like && foundStock.likes.indexOf(ip) === -1) {
      foundStock.likes.push(ip);
    }
    saved = await foundStock.save();
    return saved;
  }
}

async function getStock(stock) {
  const response = await fetch(
    `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`
  );
  const { symbol, latestPrice } = await response.json();
  return { symbol, latestPrice };
}

module.exports = function (app) {
  app.route("/api/stock-prices").get(async function (req, res) {
    const { stock, like } = req.query;

    // Convert 'like' to a boolean, since it's a string in query params
    const likeBoolean = like === "true";

    // Handle comparison of two stocks
    if (Array.isArray(stock)) {
      console.log("stocks", stock);

      const { symbol: symbol1, latestPrice: latestPrice1 } = await getStock(stock[0]);
      const { symbol: symbol2, latestPrice: latestPrice2 } = await getStock(stock[1]);

      const firstStock = await saveStock(stock[0], likeBoolean, req.ip);
      const secondStock = await saveStock(stock[1], likeBoolean, req.ip);

      const stockData = [
        {
          stock: symbol1,
          price: latestPrice1,
          rel_likes: firstStock.likes.length - secondStock.likes.length,
        },
        {
          stock: symbol2,
          price: latestPrice2,
          rel_likes: secondStock.likes.length - firstStock.likes.length,
        },
      ];

      res.json({ stockData });
      return;
    }

    // Handle a single stock
    const { symbol, latestPrice } = await getStock(stock);

    if (!symbol) {
      res.json({ stockData: { likes: likeBoolean ? 1 : 0 } });
      return;
    }

    const oneStockData = await saveStock(symbol, likeBoolean, req.ip);
    console.log("One Stock Data", oneStockData);

    res.json({
      stockData: {
        stock: symbol,
        price: latestPrice,
        likes: oneStockData.likes.length,
      },
    });
  });
};