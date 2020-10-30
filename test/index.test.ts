const assert = require("chai").assert;
import { mockRandomForEach, resetMockRandom } from 'jest-mock-random';

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
  debug: true,
};

const alexaTest = new AlexaTest(skillHandler, skillSettings);

const questionBank = require("../src/questionBank");

const GAME_CATEGORY_SLOT = "game_category";
const ANSWER_SLOT = "Answer";
const GAME_CATEGORY_SLOT_TYPE = "GAME_CATEGORY";
const ANSWER_SLOT_TYPE = "AMAZON.NUMBER";

const SCIENCE_CATEGORY = "SCIENCE";

const GAME_LENGTH = 5;

describe("Starting the skill", () => {
  describe('should be able to launch the skill and offer the list of supported trivia categories.', () => {
    alexaTest.test([
      {
        request: new LaunchRequestBuilder(skillSettings).build(),
        says: 'Welcome to Trivia Challenge. Choose a category to play. ANIMALS, GENERAL, SCIENCE, SUSTAINABILITY or TECHNOLOGY?',
        reprompts: 'Welcome to Trivia Challenge. Choose a category to play. ANIMALS, GENERAL, SCIENCE, SUSTAINABILITY or TECHNOLOGY?',
        shouldEndSession: false,
      },
    ]);
  });

  describe('should be able to start over the game.', () => {
    alexaTest.test([
      {
        request: new IntentRequestBuilder(skillSettings, 'AMAZON.StartOverIntent').build(),
        says: 'Welcome to Trivia Challenge. Choose a category to play. ANIMALS, GENERAL, SCIENCE, SUSTAINABILITY or TECHNOLOGY?',
        reprompts: 'Welcome to Trivia Challenge. Choose a category to play. ANIMALS, GENERAL, SCIENCE, SUSTAINABILITY or TECHNOLOGY?',
        shouldEndSession: false,
      },
    ]);
  });
});

describe("Playing a game", () => {
  before(async () => {
    mockRandomForEach([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.99]);
    await questionBank.init('en_US', 'test-data/questions/{{lng}}/{{ns}}.json');
  });

  after(function () {
    resetMockRandom();
  });

  describe('should be able to track the score and play a game that the user wins.', () => {
    alexaTest.test(buildGameSequence(getQuestionIndices(), getCorrectAnswerIndices(), [true, true, true, false, false]));
  });

  describe('should be able to track the score and play a game where user answers all questions right.', () => {
    alexaTest.test(buildGameSequence(getQuestionIndices(), getCorrectAnswerIndices(), [true, true, true, true, true]));
  });

  describe('should be able to track the score and play a game that the user loses.', () => {
    alexaTest.test(buildGameSequence(getQuestionIndices(), getCorrectAnswerIndices(), [false, false, true, false, false]));
  });

  describe('should be able to track the score and play a game where user answers all questions wrong.', () => {
    alexaTest.test(buildGameSequence(getQuestionIndices(), getCorrectAnswerIndices(), [false, false, false, false, false]));
  });
});

function buildStartGameIntent() {
  const startGameIntent = new IntentRequestBuilder(skillSettings, 'StartGameIntent').
    withSlotResolution(GAME_CATEGORY_SLOT, 'science related', GAME_CATEGORY_SLOT_TYPE, SCIENCE_CATEGORY).build();
  startGameIntent.request.dialogState = 'COMPLETED';

  return startGameIntent;
}

function buildAnswerIntent(answer) {
  return new IntentRequestBuilder(skillSettings, 'AnswerIntent').
    withSlotResolution(ANSWER_SLOT, answer.toString(), ANSWER_SLOT_TYPE, answer).build();
}

function getQuestionIndices() {
  return [80, 99, 118, 137, 156];
}

function getCorrectAnswerIndices() {
  return [4, 3, 2, 4, 3];
}

function buildGameSequence(questions, correctAnswers, customerAnswers) {
  assert(questions.length == GAME_LENGTH && correctAnswers.length == GAME_LENGTH && customerAnswers.length == GAME_LENGTH);
  let score = 0;

  const gameSequence = [];
  gameSequence.push({
    request: buildStartGameIntent(),
    saysLike: `Okay. I will ask you ${GAME_LENGTH} questions. Try to get as many right as you can. Just say the number of the answer. Let's begin. Question 1. ${SCIENCE_CATEGORY} Question `,
    repromptsLike: `Question 1. ${SCIENCE_CATEGORY} Question `,
    shouldEndSession: false,
    ignoreQuestionCheck: true,
    hasAttributes: {
      category: SCIENCE_CATEGORY,
      correctAnswerIndex: correctAnswers[0],
      correctAnswerText: `${SCIENCE_CATEGORY} Question Number ${questions[0] + 1} / Correct Answer`,
      currentQuestionIndex: 0,
      questions: questions,
      score: score,
    },
  });

  for (let index = 0; index < customerAnswers.length - 1; index++) {
    if (customerAnswers[index])
      gameSequence.push({
        request: buildAnswerIntent(correctAnswers[index]),
        saysLike: `That answer is correct. Your score is ${++score}. Question ${index + 2}. ${SCIENCE_CATEGORY} Question `,
        repromptsLike: `Question ${index + 2}. ${SCIENCE_CATEGORY} Question `,
        shouldEndSession: false,
        ignoreQuestionCheck: true,
        hasAttributes: {
          category: SCIENCE_CATEGORY,
          correctAnswerIndex: correctAnswers[index + 1],
          correctAnswerText: `${SCIENCE_CATEGORY} Question Number ${questions[index + 1] + 1} / Correct Answer`,
          currentQuestionIndex: index + 1,
          questions: questions,
          score: score,
        },
      });
    else
      gameSequence.push({
        request: buildAnswerIntent(correctAnswers[index] + 1),
        saysLike: `That answer is wrong. The correct answer is ${correctAnswers[index]}: ${SCIENCE_CATEGORY} Question Number ${questions[index] + 1} / Correct Answer. Your score is ${score}. Question ${index + 2}. ${SCIENCE_CATEGORY} Question `,
        repromptsLike: `Question ${index + 2}. ${SCIENCE_CATEGORY} Question `,
        shouldEndSession: false,
        ignoreQuestionCheck: true,
        hasAttributes: {
          category: SCIENCE_CATEGORY,
          correctAnswerIndex: correctAnswers[index + 1],
          correctAnswerText: `${SCIENCE_CATEGORY} Question Number ${questions[index + 1] + 1} / Correct Answer`,
          currentQuestionIndex: index + 1,
          questions: questions,
          score: score,
        },
      });
  }

  const isWinning = isWinningGame(customerAnswers);
  if (isWinning)
    gameSequence.push(
      {
        request: buildAnswerIntent(correctAnswers[correctAnswers.length - 1]),
        says: `That answer is correct. You got ${++score} out of ${GAME_LENGTH} questions correct. You won the game. Thank you for playing!`,
        repromptsNothing: true,
        shouldEndSession: true,
        ignoreQuestionCheck: true,
      });
  else {
    gameSequence.push(
      {
        request: buildAnswerIntent(correctAnswers[correctAnswers.length - 1] + 1),
        says: `That answer is wrong. The correct answer is ${correctAnswers[correctAnswers.length - 1]}: ${SCIENCE_CATEGORY} Question Number ${questions[correctAnswers.length - 1] + 1} / Correct Answer. You got ${score} out of ${GAME_LENGTH} questions correct. Unfortunately, you did not win this game. Thank you for playing!`,
        repromptsNothing: true,
        shouldEndSession: true,
        ignoreQuestionCheck: true,
      });
  }

  console.log(`This is a ${isWinning ? 'Winning' : 'Losing'} game`);
  console.log(`Score is ${score} out of ${GAME_LENGTH}`);
  return gameSequence;
}

function isWinningGame(customerAnswers) {
  let correctAnswers = 0;
  customerAnswers.forEach(customerAnswer => { if (customerAnswer) correctAnswers++; })

  return correctAnswers / customerAnswers.length >= 0.3
}