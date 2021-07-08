const Mam = require('@iota/mam')
const mysql2 = require(`mysql-await`);
const { asciiToTrytes, trytesToAscii } = require('@iota/converter')



const mode = 'public'
const provider = 'https://nodes.devnet.iota.org'

//defining seed of the sender
const farmerSeed = 'CPUWTJYWPQLGQM9GYQFWTDCXBANQVHGNZIBEYANAFGPVPDZLUHIYXUYWTXUVNBFVYLURHNXAQCPQGZKUM'
const farmerSideKey = 'VERYSECRETKEY'
const producerSeed = 'NDVZYJWTUHAYQVBWBUBRCEGFVIENDZWCAODWMINFXWNIWSGZSLSNOWKJKTRYVMSCYONRZAYBUMBXBYFEP';
const storeSeed = 'BAHJ99VMSBDPRNDRKUZPJZHPHYIPUXRZFWPIASQMV9LPI9ADXCMSCBUCZZABVSVLMF9THO9WIWGTBOGWC'

// Initialise MAM State
var mamStateFarmerPublic = Mam.init(provider);
var mamStateFarmerPrivate = Mam.init(provider);
mamStateFarmerPrivate = Mam.changeMode(mamStateFarmerPrivate, 'restricted', farmerSideKey)
var mamStateProducer = Mam.init(provider);
var mamStateStore = Mam.init(provider);

var mysql = require('mysql');
var con = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "11111111"

});

const pool2 = mysql2.createPool({
  host: "localhost",
  user: "root",
  password: "11111111"

})


con.getConnection((err, connection) => {
  if (err) throw err;
  console.log("Connected!");
  con.query("CREATE DATABASE IF NOT EXISTS diplomski", function (err, result) {
    if (err) throw err;
    console.log("Database created");
  });

  var sql = "CREATE TABLE IF NOT EXISTS diplomski.farmer (id int NOT NULL, tx1 VARCHAR(255), tx2 VARCHAR(255), tx3 VARCHAR(255), tx4 VARCHAR(255), tx5 VARCHAR(255), tx6 VARCHAR(255), tx7 VARCHAR(255),PRIMARY KEY (id))";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Table created");
  });

  sql = "CREATE TABLE IF NOT EXISTS diplomski.producer (id int NOT NULL, tx1 VARCHAR(255), tx2 VARCHAR(255), tx3 VARCHAR(255), PRIMARY KEY (id))";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Table created");
  });

  sql = "CREATE TABLE IF NOT EXISTS diplomski.store (id int NOT NULL, tx1 VARCHAR(255), tx2 VARCHAR(255), tx3 VARCHAR(255), PRIMARY KEY (id))";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Table created");
  });
});

async function farmerTransactionPublic(packet) {
    
    const trytes = asciiToTrytes(JSON.stringify(packet))
    const message = Mam.create(mamStateFarmerPublic, trytes)
    
    mamStateFarmerPublic = message.state
    
    const txHash = await sendTransaction(message);
    insertIntoFarmerDatabase(packet, txHash.transactionHash)
    return txHash;

}

async function farmerTransactionPrivate(packet) {
    const trytes = asciiToTrytes(JSON.stringify(packet))
    const message = Mam.create(mamStateFarmerPrivate, trytes)
    mamStateFarmerPrivate = message.state
    const txHash = await sendTransaction(message);
    insertIntoFarmerDatabase(packet, txHash.transactionHash)
    return txHash;
}

async function producerTransactionPublic(packet) {
    const trytes = asciiToTrytes(JSON.stringify(packet))
    const message = Mam.create(mamStateProducer, trytes)
    mamStateProducer = message.state
    const txHash = await sendTransaction(message)
    insertIntoProducerDatabase(packet, txHash.transactionHash)
    return txHash;
}


async function storeTransactionPublic(packet) {
    const trytes = asciiToTrytes(JSON.stringify(packet))
    const message = Mam.create(mamStateStore, trytes)
    mamStateStore = message.state
    const txHash = await sendTransaction(message)
    insertIntoStoreDatabase(packet, txHash.transactionHash)
    return txHash;
}


async function publicInformation(roots) {


  const rootsArray = roots.trim().split("|")
  var resultsArray = []
  console.log("1")
  for(var i = 0; i  < rootsArray.length; i++){
    resultsArray[i] = Mam.fetchSingle(rootsArray[i], mode)
  }
  console.log("3")
  for(var i = 0; i  < rootsArray.length; i++){
    try{
      resultsArray[i] = await resultsArray[i]
      resultsArray[i] = JSON.parse(trytesToAscii(resultsArray[i].payload))
    }catch(err){
      console.log(err.toString)
      return {error: err.toString()}
    }

      
  }
  console.log("2")
  var jsonFinal = {farmer : {pesticides:[], fertilizers:[]}, store: {}, producer: {}}
  resultsArray.forEach(element => {
    switch (element.transactionOwner) {
      case 'farmer':
        jsonFinal = parseFarmer(element, jsonFinal)
        break;
      case 'producer':
        jsonFinal = parseProducer(element, jsonFinal)
        break;
      case 'store':
        jsonFinal = parseStore(element, jsonFinal)
        break;
      default:
        console.log("Error!");
    }
  });

  return jsonFinal
}

async function sendTransaction(message) {
  await Mam.attach(message.payload, message.address, 3, 9)
  console.log('Published: ' + message.root);
  return {transactionHash: message.root}
}
async function privateInformation(roots, sideKey) {
  const rootsArray = roots.trim().split("|")
  var resultsArray = []

  try{
    for(var i = 0; i  < rootsArray.length; i++){
      resultsArray[i] = Mam.fetchSingle(rootsArray[i], 'private', sideKey)
    }
    for(var i = 0; i  < rootsArray.length; i++){
        resultsArray[i] = await resultsArray[i]
        resultsArray[i] = JSON.parse(trytesToAscii(resultsArray[i].payload))
        
    }
  }catch(err){
    console.log(err.toString())
    return {error: err.toString()}
    
  }

  var jsonFinal = {farmer : {pesticides:[], fertilizers:[]}, store: {}, producer: {}}
  resultsArray.forEach(element => {
    switch (element.transactionOwner) {
      case 'farmer':
        jsonFinal = parseFarmer(element, jsonFinal)
        break;
      case 'producer':
        jsonFinal = parseProducer(element, jsonFinal)
        break;
      case 'store':
        jsonFinal = parseStore(element, jsonFinal)
        break;
      default:
        console.log("Error!");
    }
  });
  return jsonFinal
}

async function insertIntoFarmerDatabase(packet, txHash) {
    var query = "INSERT INTO diplomski.farmer (id, tx" + packet.txInLine + ") VALUES (" + packet.id + ", \'" + txHash + "\') ON DUPLICATE KEY UPDATE tx" + packet.txInLine + "=\'" + txHash + "\'";
    try {
      const connection = await pool2.awaitGetConnection();
      let result = await connection.awaitQuery(query);
      connection.release();
      return {response: result[0]}
    } catch (e) {
      console.error(e);
      return {response: e.toString()}
    } 
}


async function insertIntoProducerDatabase(packet, txHash) {
  var query = "INSERT INTO diplomski.producer (id, tx" + packet.txInLine + ") VALUES (" + packet.id + ", \'" + txHash + "\') ON DUPLICATE KEY UPDATE tx" + packet.txInLine + "=\'" + txHash + "\'";
  try {
    const connection = await pool2.awaitGetConnection();
    let result = await connection.awaitQuery(query);
    connection.release();
    return {response: result[0]}
  } catch (e) {
    console.error(e);
    return {response: e.toString()}
  } 

}

async function insertIntoStoreDatabase(packet, txHash) {
  var query = "INSERT INTO diplomski.store (id, tx" + packet.txInLine + ") VALUES (" + packet.id + ", \'" + txHash + "\') ON DUPLICATE KEY UPDATE tx" + packet.txInLine + "=\'" + txHash + "\'";
  try {
    const connection = await pool2.awaitGetConnection();
    let result = await connection.awaitQuery(query);
    connection.release();
    return {response: result[0]}
  } catch (e) {
    console.error(e);
    return {response: e.toString()}
  } 

}

function parseStore (jsonStore, jsonFinal) {

console.log(jsonStore)
  switch (jsonStore.txInLine) {
    case '1':
      jsonFinal.store.companyName = jsonStore.companyName
      jsonFinal.store.countryOfSale = jsonStore.countryOfSale
      break;
    case '3':
      jsonFinal.store.price = jsonStore.price
      break;
    case '2':
      jsonFinal.store.dateOfDelivery = jsonStore.dateOfDelivery
      break;
    default:
      console.log("Error!");
  }
  console.log(jsonFinal)
  return jsonFinal
}

function parseProducer (jsonStore, jsonFinal) {
  switch (jsonStore.txInLine) {
    case '1':
      jsonFinal.producer.companyName = jsonStore.companyName
      jsonFinal.producer.countryOfProcessing = jsonStore.countryOfProcessing
      break;
    case '2':
      jsonFinal.producer.productName = jsonStore.productName
      jsonFinal.producer.expirationDate = jsonStore.expirationDate
      jsonFinal.producer.processingDate = jsonStore.processingDate
      break;
    default:
      console.log("Error!");
  }
  return jsonFinal
}

function parseFarmer (jsonStore, jsonFinal) {
  switch (jsonStore.txInLine) {
    case '1':
      jsonFinal.farmer.companyName = jsonStore.companyName
      jsonFinal.farmer.countryOfCultivation = jsonStore.countryOfCultivation
      break;
    case '2':
      jsonFinal.farmer.fieldId = jsonStore.fieldId
      jsonFinal.farmer.dateOfPlanting = jsonStore.dateOfPlanting
      jsonFinal.farmer.sortOfSeed = jsonStore.sortOfSeed
      break;
    default:
      if(jsonStore.hasOwnProperty('dateOfHarvest')){
        jsonFinal.farmer.dateOfHarvest = jsonStore.dateOfHarvest
        jsonFinal.farmer.harvestedAmount = jsonStore.harvestedAmount
      }
      else if (jsonStore.hasOwnProperty('typeOfPesticide')){
        delete jsonStore.transactionOwner;
        delete jsonStore.txInLine;
        delete jsonStore.id;
        jsonFinal.farmer.pesticides.push(jsonStore)
      }
      else {
        delete jsonStore.transactionOwner;
        delete jsonStore.txInLine;
        delete jsonStore.id;
        jsonFinal.farmer.fertilizers.push(jsonStore)
      }
  }
  return jsonFinal
}


async function fetchFromFarmerDatabase(id) {
  var query = "SELECT * FROM diplomski.farmer where id='"+id+"';";
  try {
    const connection = await pool2.awaitGetConnection();
    let result = await connection.awaitQuery(query);
    connection.release();
    console.log(result)
    return {response: result[0]}
  } catch (e) {
      console.error(e);
      return {response: e.toString()}
  } 

}

async function fetchFromProducerDatabase(id) {
  var query = "SELECT * FROM diplomski.producer where id='"+id+"';";
  try {
    const connection = await pool2.awaitGetConnection();
    let result = await connection.awaitQuery(query);
    connection.release();
    console.log(result)
    return {response: result[0]}
  } catch (e) {
    console.error(e);
    return {response: e.toString()}
  } 
}

async function fetchFromStoreDatabase(id) {
  var query = "SELECT * FROM diplomski.store where id='"+id+"';";
  try {
    const connection = await pool2.awaitGetConnection();
    let result = await connection.awaitQuery(query);
    connection.release();
    console.log(result)
    return {response: result[0]}
  } catch (e) {
    console.error(e);
    return {response: e.toString()}
  } 
}


module.exports = {
    farmerTransactionPublic: farmerTransactionPublic,
    farmerTransactionPrivate: farmerTransactionPrivate,
    producerTransactionPublic: producerTransactionPublic,
    storeTransactionPublic: storeTransactionPublic,
    publicInformation: publicInformation,
    privateInformation: privateInformation,
    fetchFromStoreDatabase: fetchFromStoreDatabase,
    fetchFromProducerDatabase: fetchFromProducerDatabase,
    fetchFromFarmerDatabase: fetchFromFarmerDatabase
}
