(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
let scripsMeta = new Map();
const GOOGLE_META_SIZE = 6;
class GoogleFinanceDataProvider {
    static parseMeta(meta, line) {
        if (line.startsWith("EXCHANGE")) {
            meta.Exchange = (line.split("%3D")[1]);
        }
        else if (line.startsWith("MARKET_OPEN_MINUTE")) {
            meta.OpenMinute = (parseInt(line.split("=")[1]));
        }
        else if (line.startsWith("MARKET_CLOSE_MINUTE")) {
            meta.CloseMinute = (parseInt(line.split("=")[1]));
        }
        else if (line.startsWith("INTERVAL")) {
            meta.Interval = (parseInt(line.split("=")[1]));
        }
        else if (line.startsWith("COLUMNS")) {
            //TODO: Change this to accept customized columns
        }
        else if (line.startsWith("TIMEZONE_OFFSET")) {
            meta.TimeZoneOffset = (parseInt(line.split("=")[1]));
        }
    }
    sessionCreated() {
        return Promise.resolve(true);
    }
    getChartData(request) {
        return __awaiter(this, void 0, void 0, function* () {
            var parsedMeta = {};
            var lastTime = 0;
            var cumVolume = 0;
            let requiredCount = request.requiredBars;
            //assuming 7 hrs / day = 420 minutes / day = 25200 sec / day
            let requiredNoOfdays = Math.ceil((request.interval * requiredCount) / 25200);
            var result = yield fetch(`https://www.google.com/finance/getprices?q=${request.scrip}&i=${request.interval}&p=${requiredNoOfdays}d&f=d,o,h,l,c,v&ts=${request.startTime}`);
            var responseText = yield result.text();
            var lines = responseText.split('\n');
            var chartResponse = {
                scrip: request.scrip,
                interval: request.interval,
                open: new Array(),
                high: new Array(),
                low: new Array(),
                close: new Array(),
                volume: new Array(),
                timestamp: new Array()
            };
            for (var i = 0; i < lines.length - 1; i++) {
                if (i <= GOOGLE_META_SIZE) {
                    GoogleFinanceDataProvider.parseMeta(parsedMeta, lines[i]);
                }
                else {
                    let time;
                    var quotelines = lines[i].split(',');
                    if (quotelines[0].length > 10 && quotelines[0].startsWith('a')) {
                        time = lastTime = parseInt(quotelines[0].substr(1));
                        cumVolume = parseInt(quotelines[5]);
                    }
                    else {
                        time = lastTime + (parseInt(quotelines[0]) * parsedMeta.Interval);
                        cumVolume = cumVolume + parseInt(quotelines[5]);
                    }
                    chartResponse.timestamp.push(time);
                    chartResponse.open.push(parseFloat(quotelines[4]));
                    chartResponse.high.push(parseFloat(quotelines[2]));
                    chartResponse.low.push(parseFloat(quotelines[3]));
                    chartResponse.close.push(parseFloat(quotelines[1]));
                    chartResponse.volume.push(parseFloat(quotelines[5]));
                }
            }
            var meta = {
                timezoneOffset: parsedMeta.TimeZoneOffset,
                open: parsedMeta.OpenMinute,
                close: parsedMeta.CloseMinute,
                exchange: parsedMeta.Exchange
            };
            scripsMeta.set(request.scrip, meta);
            return chartResponse;
        });
    }
    getAvailableScrips(key) {
        return __awaiter(this, void 0, void 0, function* () {
            var results = new Array();
            var response = yield fetch('https://www.google.com/finance/match?matchtype=matchall&q=' + key);
            var resultJson = yield response.json();
            if (resultJson.matches && resultJson.matches.length > 0) {
                resultJson.matches.forEach(info => {
                    results.push({
                        scrip: info.t,
                        exchange: info.e,
                        name: info.n
                    });
                });
                return results;
            }
            return null;
        });
    }
    getScripMetaData(scrip) {
        return scripsMeta.get(scrip);
    }
}
exports.GoogleFinanceDataProvider = GoogleFinanceDataProvider;
global.DataProvider = new GoogleFinanceDataProvider();
//timestamp 

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1]);