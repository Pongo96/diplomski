var express = require('express');
var router = express.Router();
var functionsHandler = require('../functions/functions');
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

//projekt
router.post('/farmerTransactionPublic', async function(req, res, next) {
  const dataJSON = req.body
  const response = await functionsHandler.farmerTransactionPublic(dataJSON)
  res.status(200).json(response).send();
});
router.post('/farmerTransactionPrivate', async function(req, res, next) {
  const dataJSON = req.body
  const response = await functionsHandler.farmerTransactionPrivate(dataJSON)
  res.status(200).json(response).send();
});

//projekt
router.post('/producerTransactionPublic', async function(req, res, next) {
  const dataJSON = req.body
  const response = await functionsHandler.producerTransactionPublic(dataJSON)
  res.status(200).json(response).send();
});
router.post('/producerTransactionPrivate', async function(req, res, next) {
  const dataJSON = req.body
  const response = await functionsHandler.producerTransactionPrivate(dataJSON)
  res.status(200).json(response).send();
});

//projekt
router.post('/storeTransactionPublic', async function(req, res, next) {
  const dataJSON = req.body
  const response = await functionsHandler.storeTransactionPublic(dataJSON)
  res.status(200).json(response).send();
});
router.post('/storeTransactionPrivate', async function(req, res, next) {
  const dataJSON = req.body
  const response = await functionsHandler.storeTransactionPrivate(dataJSON)
  res.status(200).send();
});

// /publicInformation?txsHash={productHash}
router.get('/publicInformation', async function(req, res, next){
  const roots = req.param('roots');
  const response = await functionsHandler.publicInformation(roots)
  res.status(200).json(response).send();
});

// /publicInformation?txsHash={productHash}
router.get('/fetchFromFarmerDatabase', async function(req, res, next){
  const id = req.param('id');
  const response = await functionsHandler.fetchFromFarmerDatabase(id)
  res.status(200).json(response).send();
});



// /publicInformation?txsHash={productHash}
router.get('/fetchFromProducerDatabase', async function(req, res, next){
  const id = req.param('id');
  const response = await functionsHandler.fetchFromProducerDatabase(id)
  res.status(200).json(response).send();
});

// /products?productHash={productHash}
router.get('/fetchFromStoreDatabase', async function(req, res, next){
  const id = req.param('id');
  const response = await functionsHandler.fetchFromStoreDatabase(id)
  res.status(200).json(response).send();
});
module.exports = router;
