// Randomness in the system is eliminated while running tests.
process.env.EXEC_ENV = 'DEVO';

const assert = require("chai").assert;
const expect = require("chai").expect;

const deepEqual = require('deep-equal');

const AlexaTest = require('ask-sdk-test').AlexaTest;
const IntentRequestBuilder = require('ask-sdk-test').IntentRequestBuilder;
const LaunchRequestBuilder = require('ask-sdk-test').LaunchRequestBuilder;
const AplUserEventRequestBuilder = require('ask-sdk-test').AplUserEventRequestBuilder;
const SkillSettings = require('ask-sdk-test').SkillSettings;

const {
  APL_DOCUMENT_VERSION,
  NEXT_QUESTION_AUTO_GENERATED_EVENT,
  QUESTION_VIEW_TOKEN: QUESTION_AND_ANSWERS_VIEW_TOKEN,
  RESULTS_VIEW_TOKEN,
  USER_INITIATED_CLICK_EVENT } = require("../src/constants/APL");

const resultsDocument = require("../src/apl/document/ResultsDocument");
const questionAndAnswersDocument = require("../src/apl/document/QuestionAndAnswersDocument");

const skillHandler = require("../src/index").handler;
const Random = require("../src/Random");

const skillSettings: typeof SkillSettings = {
  appId: 'amzn1.ask.skill.00000000-0000-0000-0000-000000000000',
  userId: 'amzn1.ask.account.VOID',
  deviceId: 'amzn1.ask.device.VOID',
  locale: 'en-US',
  debug: true,
};

const alexaTest = new AlexaTest(skillHandler, skillSettings);

const GAME_CATEGORY_SLOT = "game_category";
const ANSWER_SLOT = "Answer";
const GAME_CATEGORY_SLOT_TYPE = "GAME_CATEGORY";
const ANSWER_SLOT_TYPE = "AMAZON.NUMBER";

const SCIENCE_CATEGORY = "SCIENCE";

const questionBank = require("../src/questionBank");
let allQuestions;

const GAME_LENGTH = 5;

before(async () => {
  await questionBank.init('en_US', 'test-data/questions/{{lng}}/{{ns}}.json');
  allQuestions = questionBank.getQuestions(SCIENCE_CATEGORY, 'en-US');
});

afterEach(async () => {
  Random.resetMockRandom();
});

after(function () {
  delete process.env.EXEC_ENV;
});

describe("Starting a game", () => {
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

  describe('should be able to start a game and then half way through, start over a new game.', () => {
    alexaTest.test(
      [
        {
          request: new LaunchRequestBuilder(skillSettings).build(),
          says: 'Welcome to Trivia Challenge. Choose a category to play. ANIMALS, GENERAL, SCIENCE, SUSTAINABILITY or TECHNOLOGY?',
          reprompts: 'Welcome to Trivia Challenge. Choose a category to play. ANIMALS, GENERAL, SCIENCE, SUSTAINABILITY or TECHNOLOGY?',
          shouldEndSession: false,
          ignoreQuestionCheck: true,
        },
        {
          request: buildAnswerIntent(3),
          shouldEndSession: false,
          ignoreQuestionCheck: true,
        },
        {
          request: new IntentRequestBuilder(skillSettings, 'AMAZON.StartOverIntent').build(),
          says: 'Welcome to Trivia Challenge. Choose a category to play. ANIMALS, GENERAL, SCIENCE, SUSTAINABILITY or TECHNOLOGY?',
          reprompts: 'Welcome to Trivia Challenge. Choose a category to play. ANIMALS, GENERAL, SCIENCE, SUSTAINABILITY or TECHNOLOGY?',
          shouldEndSession: false,
          ignoreQuestionCheck: true,
        },
      ]
    );
  });
});

describe("Playing a game completely.", () => {
  describe('should be able to track the score and play a game that the user wins.', () => {
    alexaTest.test(buildGameSequence(getGameQuestionsIndices(), getCorrectAnswerIndices(), [true, true, true, false, false]));
  });

  describe('should be able to track the score and play a game where user answers all questions right.', () => {
    alexaTest.test(buildGameSequence(getGameQuestionsIndices(), getCorrectAnswerIndices(), [true, true, true, true, true]));
  });

  describe('should be able to track the score and play a game that the user loses.', () => {
    alexaTest.test(buildGameSequence(getGameQuestionsIndices(), getCorrectAnswerIndices(), [false, false, true, false, false]));
  });

  describe('should be able to track the score and play a game where user answers all questions wrong.', () => {
    alexaTest.test(buildGameSequence(getGameQuestionsIndices(), getCorrectAnswerIndices(), [false, false, false, false, false]));
  });

  describe('should be able to handle the case where user gives up on some questions but wins the game.', () => {
    alexaTest.test(buildGameSequence(getGameQuestionsIndices(), getCorrectAnswerIndices(), [true, false, false, true, null]));
  });

  describe('should be able to handle the case where user gives up on the last question and also loses the game.', () => {
    alexaTest.test(buildGameSequence(getGameQuestionsIndices(), getCorrectAnswerIndices(), [true, null, true, false, null]));
  });
});

describe("Interactions through touch / APL", () => {
  describe('should be able to play a winning game completely through APL based touch interactions', () => {
    alexaTest.test(buildGameSequenceWithUIInteraction(getGameQuestionsIndices(), getCorrectAnswerIndices(), [true, true, true, false, false]));
  });

  describe('should be able to play a losing game completely through APL based touch interactions', () => {
    alexaTest.test(buildGameSequenceWithUIInteraction(getGameQuestionsIndices(), getCorrectAnswerIndices(), [false, true, true, false, false]));
  });
});

function buildStartGameIntent(isAplEnabled = false) {
  const startGameIntent = new IntentRequestBuilder(skillSettings, 'StartGameIntent')
    .withInterfaces({ apl: isAplEnabled })
    .withSlotResolution(GAME_CATEGORY_SLOT, 'science related', GAME_CATEGORY_SLOT_TYPE, SCIENCE_CATEGORY).build();
  startGameIntent.request.dialogState = 'COMPLETED';

  return startGameIntent;
}

function buildAnswerIntent(answer) {
  return new IntentRequestBuilder(skillSettings, 'AnswerIntent').
    withSlotResolution(ANSWER_SLOT, answer.toString(), ANSWER_SLOT_TYPE, answer).build();
}

function buildDontKnowIntent() {
  return new IntentRequestBuilder(skillSettings, 'DontKnowIntent').build();
}

function getGameQuestionsIndices() {
  return [162, 33, 122, 37, 86];
}

function getCorrectAnswerIndices() {
  return [1, 3, 4, 2, 2];
}

function verifyResultsDataSource(datasource, isCorrect, score) {
  expect(datasource.isCorrect).to.equal(isCorrect);
  expect(datasource.score).to.equal(score);

  return true;
}

function verifyQuestionAndAnswersDataSource(datasource, questionIndex, sessionAttributes) {
  const question = allQuestions[questionIndex];
  const questionText = Object.keys(question)[0];
  const answers = question[Object.keys(question)[0]].slice();
  expect(datasource.textListData.title).to.equal(questionText);

  const displayedAnswers = datasource.textListData.listItems;
  for (let index = 0; index < displayedAnswers.length; index++) {
    const displayedAnswer = displayedAnswers[index];

    assert(answers.includes(displayedAnswer.primaryText));

    const firstPrimaryAction = displayedAnswer.primaryAction[0];
    assert(firstPrimaryAction.type === "SendEvent");

    assert(firstPrimaryAction.arguments.length === 2);

    const answerObject = firstPrimaryAction.arguments[0];
    assert(answerObject.index === index + 1);
    assert(answerObject.type === USER_INITIATED_CLICK_EVENT);
    assert(answerObject.answerText === displayedAnswer.primaryText);

    const sessionAttributesInEvent = firstPrimaryAction.arguments[1];
    assert(deepEqual(sessionAttributesInEvent, sessionAttributes));

    assert(deepEqual(displayedAnswer.primaryAction[1], { type: 'SetValue', property: 'disabled', value: true }));
  }

  return true;
}

function buildGameSequenceWithUIInteraction(gameQuestionsIndices, correctAnswers, customerAnswers) {
  assert(gameQuestionsIndices.length == GAME_LENGTH && correctAnswers.length == GAME_LENGTH && customerAnswers.length == GAME_LENGTH);
  let score = 0;

  const gameSequence = [];
  gameSequence.push({
    request: buildStartGameIntent(true),
    saysLike: `Okay. I will ask you ${GAME_LENGTH} questions. Try to get as many right as you can. Just say the number of the answer. Let's begin. Question 1. ${SCIENCE_CATEGORY} Question `,
    repromptsLike: `Question 1. ${SCIENCE_CATEGORY} Question `,
    shouldEndSession: false,
    ignoreQuestionCheck: true,
    hasAttributes: {
      category: SCIENCE_CATEGORY,
      correctAnswerIndex: correctAnswers[0],
      correctAnswerText: `${SCIENCE_CATEGORY} Question Number ${gameQuestionsIndices[0] + 1} / Correct Answer`,
      questionIndex: 0,
      gameQuestionsIndices: gameQuestionsIndices,
      score: score,
    },
    get renderDocument() {
      const attributes = this.hasAttributes;
      return {
        token: QUESTION_AND_ANSWERS_VIEW_TOKEN,
        document: (doc: any) => {
          return deepEqual(doc, questionAndAnswersDocument);
        },
        hasDataSources: {
          questionAndAnswersDataSource: (ds: any) => {
            return verifyQuestionAndAnswersDataSource(ds, gameQuestionsIndices[0], attributes);
          },
        },
      }
    },
  });

  for (let index = 0; index < customerAnswers.length - 1; index++) {
    if (customerAnswers[index])
      gameSequence.push({
        request: new AplUserEventRequestBuilder(skillSettings)
          .withInterfaces({ apl: true })
          .withToken(RESULTS_VIEW_TOKEN)
          .withArguments(
            {
              index: correctAnswers[index],
              type: USER_INITIATED_CLICK_EVENT,
              answerText: `${SCIENCE_CATEGORY} Question Number ${gameQuestionsIndices[index] + 1} / Correct Answer`,
            },
            {
              category: SCIENCE_CATEGORY,
              correctAnswerIndex: correctAnswers[index],
              correctAnswerText: `${SCIENCE_CATEGORY} Question Number ${gameQuestionsIndices[index] + 1} / Correct Answer`,
              questionIndex: index,
              gameQuestionsIndices: gameQuestionsIndices,
              score: score,
            }).build(),
        says: `That answer is correct. Your score is ${++score}.`,
        repromptsNothing: true,
        shouldEndSession: false,
        ignoreQuestionCheck: true,
        hasAttributes: {
          category: SCIENCE_CATEGORY,
          correctAnswerIndex: correctAnswers[index],
          correctAnswerText: `${SCIENCE_CATEGORY} Question Number ${gameQuestionsIndices[index] + 1} / Correct Answer`,
          questionIndex: index,
          gameQuestionsIndices: gameQuestionsIndices,
          score: score,
        },
        get renderDocument() {
          return {
            token: RESULTS_VIEW_TOKEN,
            document: (doc: any) => {
              return deepEqual(doc, resultsDocument);
            },
            hasDataSources: {
              resultsDataSource: (ds: any) => {
                return verifyResultsDataSource(ds, true, this.hasAttributes.score);
              },
            },
          }
        },
      });
    else
      gameSequence.push({
        request: new AplUserEventRequestBuilder(skillSettings)
          .withInterfaces({ apl: true })
          .withToken(RESULTS_VIEW_TOKEN)
          .withArguments(
            {
              userAnswer: correctAnswers[index] + 1, // +1 to simulate a wrong answer.
              type: USER_INITIATED_CLICK_EVENT,
              answerText: `${SCIENCE_CATEGORY} Question Number ${gameQuestionsIndices[index] + 1} / Correct Answer`,
            },
            {
              category: SCIENCE_CATEGORY,
              correctAnswerIndex: correctAnswers[index],
              correctAnswerText: `${SCIENCE_CATEGORY} Question Number ${gameQuestionsIndices[index] + 1} / Correct Answer`,
              questionIndex: index,
              gameQuestionsIndices: gameQuestionsIndices,
              score: score,
            }).build(),
        says: `${customerAnswers[index] === null ? `` : `That answer is wrong. `}The correct answer is ${correctAnswers[index]}: ${SCIENCE_CATEGORY} Question Number ${gameQuestionsIndices[index] + 1} / Correct Answer. Your score is ${score}.`,
        repromptsNothing: true,
        shouldEndSession: false,
        ignoreQuestionCheck: true,
        hasAttributes: {
          category: SCIENCE_CATEGORY,
          correctAnswerIndex: correctAnswers[index],
          correctAnswerText: `${SCIENCE_CATEGORY} Question Number ${gameQuestionsIndices[index] + 1} / Correct Answer`,
          questionIndex: index,
          gameQuestionsIndices: gameQuestionsIndices,
          score: score,
        },
        get renderDocument() {
          return {
            token: RESULTS_VIEW_TOKEN,
            document: (doc: any) => {
              return deepEqual(doc, resultsDocument);
            },
            hasDataSources: {
              resultsDataSource: (ds: any) => {
                return verifyResultsDataSource(ds, false, this.hasAttributes.score);
              },
            },
          }
        },
      });

    gameSequence.push({
      request: new AplUserEventRequestBuilder(skillSettings)
        .withInterfaces({ apl: true })
        .withToken(QUESTION_AND_ANSWERS_VIEW_TOKEN)
        .withArguments(
          NEXT_QUESTION_AUTO_GENERATED_EVENT,
          {
            category: SCIENCE_CATEGORY,
            correctAnswerIndex: correctAnswers[index],
            correctAnswerText: `${SCIENCE_CATEGORY} Question Number ${gameQuestionsIndices[index] + 1} / Correct Answer`,
            questionIndex: index,
            gameQuestionsIndices: gameQuestionsIndices,
            score: score,
          }).build(),
      saysLike: `Question ${index + 2}. ${SCIENCE_CATEGORY} Question `,
      repromptsLike: `Question ${index + 2}. ${SCIENCE_CATEGORY} Question `,
      shouldEndSession: false,
      ignoreQuestionCheck: true,
      hasAttributes: {
        category: SCIENCE_CATEGORY,
        correctAnswerIndex: correctAnswers[index + 1],
        correctAnswerText: `${SCIENCE_CATEGORY} Question Number ${gameQuestionsIndices[index + 1] + 1} / Correct Answer`,
        questionIndex: index + 1,
        gameQuestionsIndices: gameQuestionsIndices,
        score: score,
      },
    });
  }

  const customersLastAnswer = customerAnswers[correctAnswers.length - 1];
  const isWinning = isWinningGame(customerAnswers);
  if (customersLastAnswer) {
    gameSequence.push(
      {
        request: new AplUserEventRequestBuilder(skillSettings)
          .withInterfaces({ apl: true })
          .withToken(RESULTS_VIEW_TOKEN)
          .withArguments(
            {
              index: correctAnswers[GAME_LENGTH - 1],
              type: USER_INITIATED_CLICK_EVENT,
              answerText: `${SCIENCE_CATEGORY} Question Number ${gameQuestionsIndices[GAME_LENGTH - 1] + 1} / Correct Answer`,
            },
            {
              category: SCIENCE_CATEGORY,
              correctAnswerIndex: correctAnswers[GAME_LENGTH - 2],
              correctAnswerText: `${SCIENCE_CATEGORY} Question Number ${gameQuestionsIndices[GAME_LENGTH - 1] + 1} / Correct Answer`,
              questionIndex: GAME_LENGTH - 1,
              gameQuestionsIndices: gameQuestionsIndices,
              score: score,
            }).build(),
        says: `That answer is correct. You got ${++score} out of ${GAME_LENGTH} questions correct. ${isWinning ? `You won the game. Thank you for playing!` : `Unfortunately, you did not win this game. Thank you for playing!`}`,
        repromptsNothing: true,
        shouldEndSession: true,
        get renderDocument() {
          return {
            token: RESULTS_VIEW_TOKEN,
            document: (doc: any) => {
              return deepEqual(doc, resultsDocument);
            },
            hasDataSources: {
              resultsDataSource: (ds: any) => {
                return verifyResultsDataSource(ds, true, score);
              },
            },
          }
        },
      });
  }
  else {
    gameSequence.push(
      {
        request: new AplUserEventRequestBuilder(skillSettings)
          .withInterfaces({ apl: true })
          .withToken(RESULTS_VIEW_TOKEN)
          .withArguments(
            {
              index: correctAnswers[GAME_LENGTH - 1] + 1, // +1 to simulate a wrong answer
              type: USER_INITIATED_CLICK_EVENT,
              answerText: `${SCIENCE_CATEGORY} Question Number ${gameQuestionsIndices[GAME_LENGTH - 1] + 1} / Correct Answer`,
            },
            {
              category: SCIENCE_CATEGORY,
              correctAnswerIndex: correctAnswers[GAME_LENGTH - 1],
              correctAnswerText: `${SCIENCE_CATEGORY} Question Number ${gameQuestionsIndices[GAME_LENGTH - 1] + 1} / Correct Answer`,
              questionIndex: GAME_LENGTH - 1,
              gameQuestionsIndices: gameQuestionsIndices,
              score: score,
            }).build(),
        says: `That answer is wrong. The correct answer is ${correctAnswers[correctAnswers.length - 1]}: ${SCIENCE_CATEGORY} Question Number ${gameQuestionsIndices[correctAnswers.length - 1] + 1} / Correct Answer. You got ${score} out of ${GAME_LENGTH} questions correct. ${isWinning ? `You won the game. Thank you for playing!` : `Unfortunately, you did not win this game. Thank you for playing!`}`,
        repromptsNothing: true,
        shouldEndSession: true,
        get renderDocument() {
          return {
            token: RESULTS_VIEW_TOKEN,
            document: (doc: any) => {
              return deepEqual(doc, resultsDocument);
            },
            hasDataSources: {
              resultsDataSource: (ds: any) => {
                return verifyResultsDataSource(ds, false, score);
              },
            },
          }
        },
      });
  }

  console.log(`This is a ${isWinning ? 'Winning' : 'Losing'} game`);
  console.log(`Score is ${score} out of ${GAME_LENGTH}`);
  return gameSequence;
}

function buildGameSequence(gameQuestionsIndices, correctAnswers, customerAnswers) {
  assert(gameQuestionsIndices.length == GAME_LENGTH && correctAnswers.length == GAME_LENGTH && customerAnswers.length == GAME_LENGTH);
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
      correctAnswerText: `${SCIENCE_CATEGORY} Question Number ${gameQuestionsIndices[0] + 1} / Correct Answer`,
      questionIndex: 0,
      gameQuestionsIndices: gameQuestionsIndices,
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
          correctAnswerText: `${SCIENCE_CATEGORY} Question Number ${gameQuestionsIndices[index + 1] + 1} / Correct Answer`,
          questionIndex: index + 1,
          gameQuestionsIndices: gameQuestionsIndices,
          score: score,
        },
      });
    else
      gameSequence.push({
        request: customerAnswers[index] === null ? buildDontKnowIntent() : buildAnswerIntent(correctAnswers[index] + 1), //+1 to simulate a wrong answer
        saysLike: `${customerAnswers[index] === null ? `` : `That answer is wrong. `}The correct answer is ${correctAnswers[index]}: ${SCIENCE_CATEGORY} Question Number ${gameQuestionsIndices[index] + 1} / Correct Answer. Your score is ${score}. Question ${index + 2}. ${SCIENCE_CATEGORY} Question `,
        repromptsLike: `Question ${index + 2}. ${SCIENCE_CATEGORY} Question `,
        shouldEndSession: false,
        ignoreQuestionCheck: true,
        hasAttributes: {
          category: SCIENCE_CATEGORY,
          correctAnswerIndex: correctAnswers[index + 1],
          correctAnswerText: `${SCIENCE_CATEGORY} Question Number ${gameQuestionsIndices[index + 1] + 1} / Correct Answer`,
          questionIndex: index + 1,
          gameQuestionsIndices: gameQuestionsIndices,
          score: score,
        },
      });
  }

  const customersLastAnswer = customerAnswers[correctAnswers.length - 1];
  const isWinning = isWinningGame(customerAnswers);
  if (customersLastAnswer) {
    // TODO: Why no session attributes for the following two?
    gameSequence.push(
      {
        request: buildAnswerIntent(correctAnswers[correctAnswers.length - 1]),
        says: `That answer is correct. You got ${++score} out of ${GAME_LENGTH} questions correct. ${isWinning ? `You won the game. Thank you for playing!` : `Unfortunately, you did not win this game. Thank you for playing!`}`,
        repromptsNothing: true,
        shouldEndSession: true,
        ignoreQuestionCheck: true,
      });
  }
  else {
    gameSequence.push(
      {
        request: customersLastAnswer === null ? buildDontKnowIntent() : buildAnswerIntent(correctAnswers[correctAnswers.length - 1] + 1), //+1 to simulate a wrong answer
        says: `${customersLastAnswer === null ? `` : `That answer is wrong. `}The correct answer is ${correctAnswers[correctAnswers.length - 1]}: ${SCIENCE_CATEGORY} Question Number ${gameQuestionsIndices[correctAnswers.length - 1] + 1} / Correct Answer. You got ${score} out of ${GAME_LENGTH} questions correct. ${isWinning ? `You won the game. Thank you for playing!` : `Unfortunately, you did not win this game. Thank you for playing!`}`,
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

  return correctAnswers / customerAnswers.length >= 0.5
}