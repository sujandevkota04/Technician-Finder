"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSentiment = void 0;
var natural_1 = require("natural");
var stopword_1 = require("stopword");
function getSentiment(text) {
    /**
     * Removing non alphabetical and special characters
     * Converting to lowercase
     */
    var alphaOnlyReview = text.replace(/[^a-zA-Z\s]+/g, '');
    /**
     * Tokenization
     */
    var tokenizer = new natural_1.WordTokenizer();
    var tokenizedText = tokenizer.tokenize(alphaOnlyReview);
    /** Remove stop words */
    var filteredText = (0, stopword_1.removeStopwords)(tokenizedText);
    var analyzer = new natural_1.SentimentAnalyzer('English', natural_1.PorterStemmer, 'afinn');
    return analyzer.getSentiment(filteredText);
}
exports.getSentiment = getSentiment;
