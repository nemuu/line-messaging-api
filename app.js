var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');
var crypto = require("crypto");
var async = require('async');

var sendMessage = require('./sendMessage.js');
var messageTemplate = require('./messageTemplate.js');

// var pgManager = require('./postgresManager.js'); // データベースを使う時に必要
// var weather_api = require('./openWeatherMap.js'); // 天気APIを使う時に必要
// var visualRecognition = require('./IBMImageRecognition.js'); // 画像認識AIを使う時に必要

// utilモジュールを使います。
var util = require('util');

app.set('port', (process.env.PORT || 8000));
// JSONの送信を許可
app.use(bodyParser.urlencoded({
  extended: true
}));
// JSONパーサー
app.use(bodyParser.json());

app.get('/', function(req, res) {
  res.send('<h1>hello world</h1>');
});

// async.waterfall([function(){}], function(){})
app.post('/callback', function(req, res) {
  console.log("リクエストログ開始");
  console.log(req);
  console.log("リクエストログ終了");
  async.waterfall([
      function(callback) {
        // リクエストがLINE Platformから送られてきたか確認する
        if (!validate_signature(req.headers['x-line-signature'], req.body)) {
          return;
        }
        // テキストか画像が送られてきた場合のみ返事をする
        if (
          (req.body['events'][0]['type'] != 'message') ||
          ((req.body['events'][0]['message']['type'] != 'text') &&
          (req.body['events'][0]['message']['type'] != 'image'))
        ) {
          return;
        }

        // 特定の単語に反応させたい場合
        //if (req.body['events'][0]['message']['text'].indexOf('please input some word') == -1) {
        //    return;
        //}

        // ユーザIDを取得する
        var user_id = req.body['events'][0]['source']['userId'];
        var message_id = req.body['events'][0]['message']['id'];
        // 'text', 'image' ...
        var message_type = req.body['events'][0]['message']['type'];
        var message_text = req.body['events'][0]['message']['text'];
        request.get(getProfileOption(user_id), function(error, response, body) {
          if (!error && response.statusCode == 200) {
            callback(req, body['displayName'], message_id, message_type, message_text);
          }
       });    
      },
    ],

    function(req, displayName, message_id, message_type, message_text) {

      let message = "やあ, " + displayName + "。これから色々返せるようにするからちょっと待ってね"; 
      const NO_SPACE_INDEX = -1;
      const CORRECT_SPACE_INDEX = 4; // これは要らない。指定ワードが何かによって可変で処理できるべき。

      // 半角も全角も判定できるようにしておく。
      if (isOperation(message_text, CORRECT_SPACE_INDEX)) {
        let param_text = message_text.substr(CORRECT_SPACE_INDEX).trim();
        sendMessage.send(req, [ messageTemplate.textMessage(message) ]);
      } else if (message_text === 'がーすー' ){
        // がーすーのプロファイルを残す
      }
      

      ///////////////////
      // 画像で返事をする //
      ///////////////////
      /*
      var messages = ["左上を押した", "右上を押した", "左下を押した", "右下を押した"];
      if (message_text == "猫") {
         sendMessage.send(req, [ messageTemplate.imagemapMessage(messages, 'https://i.imgur.com/8cbL5dl.jpg') ]);
         return;
      } else if (message_text == "犬") {
         sendMessage.send(req, [ messageTemplate.imagemapMessage(messages, 'https://i.imgur.com/ph82KWH.jpg') ]);
         return;
      } else if (message_text == "鹿") {
         sendMessage.send(req, [ messageTemplate.imagemapMessage(messages, 'https://i.imgur.com/Z6ilhSI.jpg') ]);
         return;
      }
      */
      //////////////∏/////
      // 画像で返事をする //
      ///////////////////

      //////////////////
      // 天気APIパート //
      /////////////////
      /*
      // 天気ときたら東京の天気が返ってくる
      // APIキーの設定と、ライブラリの読み込みが必要
      if (message_text === "天気") {
        weather_api.weather(function (result) {
          sendMessage.send(req, [ messageTemplate.textMessage(result) ]);
          return;
        });
      // 天気　半角スペース　地名（ローマ字のみ　例：tokyo）でそこの天気が返ってくる
      } else if (message_text.includes('天気')) {
        const words = message_text.split(' ')
        weather_api.weatherWithPlace(words[1], function (result) {
          sendMessage.send(req, [ messageTemplate.textMessage(result) ]);
          return;
        });
      } else {
        sendMessage.send(req, [ messageTemplate.textMessage(message) ]);
        return;
      }
      */
      //////////////////
      // 天気APIパート //
      /////////////////

        // const client = new line.Client({
        //   channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
        // });

        // client.getMessageContent(message_id)
        //   .then((stream) => {
        //     stream.on('data', (chunk) => {
        //       // console.log(typeof chunk)
        //       message = visualRecognition.classify(chunk, message_id)
        //       sendMessage.send(req, [ messageTemplate.textMessage(message) ]);
        //     });
        //     stream.on('error', (err) => {
        //       // error handling
        //       console.log('error on image')
        //     });
        //   });

      //////////////////
      // 画像認識パート //
      /////////////////
      // if (message_type === 'image') {

      //   // 上のLINE Developersドキュメントのコードだとうまくいかない。
      //   // chunkにresponseとbodyが一緒に入っている？
      //   // encoding: nullが設定されてないから？
      //   const options = {
      //     url: `https://api.line.me/v2/bot/message/${message_id}/content`,
      //     method: 'get',
      //     headers: {
      //         'Authorization': 'Bearer ' + process.env.LINE_CHANNEL_ACCESS_TOKEN,
      //     },
      //     encoding: null
      //   };

      //   request(options, function(error, response, body) {
      //     if (!error && response.statusCode == 200) {
      //       console.log('Got responce');
      //       visualRecognition.classify(body, function (result) {
      //         sendMessage.send(req, [ messageTemplate.textMessage(result) ]);
      //         return;
      //       })
      //     } else {
      //       // @todo handle error
      //     }
      //   });
      // }
      ////////////////////////
      // 画像認識パートここまで //
      ////////////////////////

      return;
    }
  );
});

app.listen(app.get('port'), function() {
  console.log('Node app is running');
});

// メッセージの長さを返す
function textcount(body) {
  return body.length;
}

// ランダムな数値を取得する
function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function getProfileOption(user_id) {
  return {
    url: 'https://api.line.me/v2/bot/profile/' + user_id,
    proxy: process.env.FIXIE_URL,
    json: true,
    headers: {
      'Authorization': 'Bearer {' + process.env.LINE_CHANNEL_ACCESS_TOKEN + '}'
    }
  };
}

// 署名検証
function validate_signature(signature, body) {
  return signature == crypto.createHmac('sha256', process.env.LINE_CHANNEL_SECRET).update(new Buffer(JSON.stringify(body), 'utf8')).digest('base64');
}

function isOperation(messageText, correctIndex){
  if (message_type !== 'text' || message_text.indexOf('がーすー') !== 0) {
    return false;
  }
  if (messageText.indexOf(' ') === correctIndex){
    return true;
  }
  if (messageText.indexOf('　') === correctIndex){
    return true;
  }
  return false;
}


