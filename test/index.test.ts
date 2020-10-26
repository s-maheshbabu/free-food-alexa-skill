
const expect = require("chai").expect;
const assert = require("chai").assert;
const importFresh = require('import-fresh');


const AlexaTest = require('ask-sdk-test').AlexaTest;
const IntentRequestBuilder = require('ask-sdk-test').IntentRequestBuilder;
const LaunchRequestBuilder = require('ask-sdk-test').LaunchRequestBuilder;
const SkillSettings = require('ask-sdk-test').SkillSettings;

const skillHandler = require("../src/index").handler;

const skillSettings: typeof SkillSettings = {
  appId: 'amzn1.ask.skill.00000000-0000-0000-0000-000000000000',
  userId: 'amzn1.ask.account.VOID',
  deviceId: 'amzn1.ask.device.VOID',
  locale: 'en-US',
};

const alexaTest = new AlexaTest(skillHandler, skillSettings);

describe("Starting the skill", function () {
  before(async () => {
  });

  describe('should be able to launch the skill and offer the list of supported trivia categories.', () => {
    alexaTest.test([
      {
        request: new LaunchRequestBuilder(skillSettings).build(),
        says: 'Welcome to Trivia Challenge. Choose a category to play. Animals, General, Science, Sustainability or Technology?',
        reprompts: 'Welcome to Trivia Challenge. Choose a category to play. Animals, General, Science, Sustainability or Technology?',
        shouldEndSession: false,
      },
    ]);
  });

  describe('should be able to start over the game.', () => {
    alexaTest.test([
      {
        request: new IntentRequestBuilder(skillSettings, 'AMAZON.StartOverIntent').build(),
        says: 'Welcome to Trivia Challenge. Choose a category to play. Animals, General, Science, Sustainability or Technology?',
        reprompts: 'Welcome to Trivia Challenge. Choose a category to play. Animals, General, Science, Sustainability or Technology?',
        shouldEndSession: false,
      },
    ]);
  });
});
