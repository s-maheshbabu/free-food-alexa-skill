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
    alexaTest.test(buildGameSequence_VoiceInteraction(getGameQuestionsIndices(), getCorrectAnswerIndices(), [true, true, true, false, false]));
  });

  describe('should be able to track the score and play a game where user answers all questions right.', () => {
    alexaTest.test(buildGameSequence_VoiceInteraction(getGameQuestionsIndices(), getCorrectAnswerIndices(), [true, true, true, true, true]));
  });

  describe('should be able to track the score and play a game that the user loses.', () => {
    alexaTest.test(buildGameSequence_VoiceInteraction(getGameQuestionsIndices(), getCorrectAnswerIndices(), [false, false, true, false, false]));
  });

  describe('should be able to track the score and play a game where user answers all questions wrong.', () => {
    alexaTest.test(buildGameSequence_VoiceInteraction(getGameQuestionsIndices(), getCorrectAnswerIndices(), [false, false, false, false, false]));
  });

  describe('should be able to handle the case where user gives up on some questions but wins the game.', () => {
    alexaTest.test(buildGameSequence_VoiceInteraction(getGameQuestionsIndices(), getCorrectAnswerIndices(), [true, false, false, true, null]));
  });

  describe('should be able to handle the case where user gives up on the last question and also loses the game.', () => {
    alexaTest.test(buildGameSequence_VoiceInteraction(getGameQuestionsIndices(), getCorrectAnswerIndices(), [true, null, true, false, null]));
  });
});

describe("Interactions through touch / APL", () => {
  describe('should be able to play a winning game completely through APL based touch interactions', () => {
    alexaTest.test(buildGameSequence_UIInteraction(getGameQuestionsIndices(), getCorrectAnswerIndices(), [true, true, true, false, false]));
  });

  describe('should be able to play a game where all responses are correct', () => {
    alexaTest.test(buildGameSequence_UIInteraction(getGameQuestionsIndices(), getCorrectAnswerIndices(), [true, true, true, true, true]));
  });

  describe('should be able to play a losing game completely through APL based touch interactions', () => {
    alexaTest.test(buildGameSequence_UIInteraction(getGameQuestionsIndices(), getCorrectAnswerIndices(), [false, true, true, false, false]));
  });

  describe('should be able to play a game where all responses are incorrect', () => {
    alexaTest.test(buildGameSequence_UIInteraction(getGameQuestionsIndices(), getCorrectAnswerIndices(), [false, false, false, false, false]));
  });
});

function buildGameSequence_UIInteraction(gameQuestionsIndices, correctAnswers, customerAnswers) {
  assert(gameQuestionsIndices.length == GAME_LENGTH && correctAnswers.length == GAME_LENGTH && customerAnswers.length == GAME_LENGTH);
  let score = 0;

  const gameSequence = [];

  // User initiates the game with voice. The skill launches the game and asks the first question.
  gameSequence.push(buildStartGameSequenceItem(gameQuestionsIndices, correctAnswers, true));

  for (let index = 0; index < customerAnswers.length - 1; index++) {
    // User taps on an answer. The skill informs the user whether they are right or wrong and kicks off an auto_generated event.
    gameSequence.push(buildNthAnswerTouchEventGameSequenceItem(gameQuestionsIndices, correctAnswers, customerAnswers, customerAnswers[index], score, index));
    if (customerAnswers[index]) {
      score++;
    }

    // Auto generated event to fetch the next question. The skill fetches the next question and asks the user.
    gameSequence.push(buildFetchNextQuestionEventGameSequenceItem(gameQuestionsIndices, correctAnswers, score, index));
  }

  const customersLastAnswer = customerAnswers[GAME_LENGTH - 1];
  const isWinning = isWinningGame(customerAnswers);
  // User taps on an answer for the last question in the game. The skill informs the user their final score and whether or not they won the game.
  gameSequence.push(buildLastAnswerTouchEventGameSequenceItem(gameQuestionsIndices, correctAnswers, customersLastAnswer, score, isWinning));

  console.log(`This is a ${isWinning ? 'Winning' : 'Losing'} game`);
  console.log(`Score is ${score} out of ${GAME_LENGTH}`);
  return gameSequence;
}

function buildGameSequence_VoiceInteraction(gameQuestionsIndices, correctAnswers, customerAnswers) {
  assert(gameQuestionsIndices.length == GAME_LENGTH && correctAnswers.length == GAME_LENGTH && customerAnswers.length == GAME_LENGTH);
  let score = 0;

  const gameSequence = [];

  // User initiates the game with voice. The skill launches the game and asks the first question.
  gameSequence.push(buildStartGameSequenceItem(gameQuestionsIndices, correctAnswers, true));

  for (let index = 0; index < customerAnswers.length - 1; index++) {
    // User answers with voice. The skill informs the user whether they are right or wrong and asks the next question.
    gameSequence.push(buildNthAnswerIntentGameSequenceItem(gameQuestionsIndices, correctAnswers, customerAnswers, score, index));
    if (customerAnswers[index]) {
      score++;
    }
  }

  const customersLastAnswer = customerAnswers[GAME_LENGTH - 1];
  const isWinning = isWinningGame(customerAnswers);
  // User answers the last question in the game with voice. The skill informs the user their final score and whether or not they won the game.
  gameSequence.push(buildLastAnswerIntentGameSequenceItem(gameQuestionsIndices, correctAnswers, customersLastAnswer, score, isWinning));

  console.log(`This is a ${isWinning ? 'Winning' : 'Losing'} game`);
  console.log(`Score is ${score} out of ${GAME_LENGTH}`);
  return gameSequence;
}

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

function buildStartGameSequenceItem(gameQuestionsIndices, correctAnswers, isAplEnabled = false) {
  return {
    request: buildStartGameIntent(isAplEnabled),
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
      score: 0,
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
  }
}

function buildNthAnswerTouchEventGameSequenceItem(gameQuestionsIndices, correctAnswers, customerAnswers, isCorrectAnswer, score, index) {
  let prompt;
  if (isCorrectAnswer) {
    prompt = `That answer is correct. Your score is ${score + 1}.`;
  }
  else {
    prompt = `${customerAnswers[index] === null ? `` : `That answer is wrong. `}The correct answer is ${correctAnswers[index]}: ${SCIENCE_CATEGORY} Question Number ${gameQuestionsIndices[index] + 1} / Correct Answer. Your score is ${score}.`;
  }

  return {
    request: new AplUserEventRequestBuilder(skillSettings)
      .withInterfaces({ apl: true })
      .withToken(RESULTS_VIEW_TOKEN)
      .withArguments(
        {
          index: isCorrectAnswer ? correctAnswers[index] : correctAnswers[index] + 1, // +1 to simulate incorrect answer
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
    says: prompt,
    repromptsNothing: true,
    shouldEndSession: false,
    ignoreQuestionCheck: true,
    hasAttributes: {
      category: SCIENCE_CATEGORY,
      correctAnswerIndex: correctAnswers[index],
      correctAnswerText: `${SCIENCE_CATEGORY} Question Number ${gameQuestionsIndices[index] + 1} / Correct Answer`,
      questionIndex: index,
      gameQuestionsIndices: gameQuestionsIndices,
      score: isCorrectAnswer ? score + 1 : score,
    },
    get renderDocument() {
      return {
        token: RESULTS_VIEW_TOKEN,
        document: (doc: any) => {
          return deepEqual(doc, resultsDocument);
        },
        hasDataSources: {
          resultsDataSource: (ds: any) => {
            return verifyResultsDataSource(ds, isCorrectAnswer ? true : false, this.hasAttributes.score);
          },
        },
      }
    },
  }
}

function buildFetchNextQuestionEventGameSequenceItem(gameQuestionsIndices, correctAnswers, score, index) {
  return {
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
  }
}

function buildLastAnswerTouchEventGameSequenceItem(gameQuestionsIndices, correctAnswers, isCorrectAnswer, score, isWinning) {
  let prompt;
  if (isCorrectAnswer) {
    prompt = `That answer is correct. You got ${score + 1} out of ${GAME_LENGTH} questions correct. ${isWinning ? `You won the game. Thank you for playing!` : `Unfortunately, you did not win this game. Thank you for playing!`}`;
  }
  else {
    prompt = `That answer is wrong. The correct answer is ${correctAnswers[GAME_LENGTH - 1]}: ${SCIENCE_CATEGORY} Question Number ${gameQuestionsIndices[GAME_LENGTH - 1] + 1} / Correct Answer. You got ${score} out of ${GAME_LENGTH} questions correct. ${isWinning ? `You won the game. Thank you for playing!` : `Unfortunately, you did not win this game. Thank you for playing!`}`;
  }

  return {
    request: new AplUserEventRequestBuilder(skillSettings)
      .withInterfaces({ apl: true })
      .withToken(RESULTS_VIEW_TOKEN)
      .withArguments(
        {
          index: isCorrectAnswer ? correctAnswers[GAME_LENGTH - 1] : correctAnswers[GAME_LENGTH - 1] + 1, // +1 to simulate incorrect answer
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
    says: prompt,
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
            return verifyResultsDataSource(ds, isCorrectAnswer ? true : false, isCorrectAnswer ? score + 1 : score);
          },
        },
      }
    },
  };
}

function buildNthAnswerIntentGameSequenceItem(gameQuestionsIndices, correctAnswers, customerAnswers, score, index) {
  const isCorrectAnswer = customerAnswers[index];

  let prompt;
  let answerIntent;
  if (isCorrectAnswer) {
    answerIntent = buildAnswerIntent(correctAnswers[index]);
    prompt = `That answer is correct. Your score is ${score + 1}. Question ${index + 2}. ${SCIENCE_CATEGORY} Question `;
  }
  else {
    answerIntent = isCorrectAnswer === null ? buildDontKnowIntent() : buildAnswerIntent(correctAnswers[index] + 1); //+1 to simulate a wrong answer
    prompt = `${isCorrectAnswer === null ? `` : `That answer is wrong. `}The correct answer is ${correctAnswers[index]}: ${SCIENCE_CATEGORY} Question Number ${gameQuestionsIndices[index] + 1} / Correct Answer. Your score is ${score}. Question ${index + 2}. ${SCIENCE_CATEGORY} Question `;
  }

  return {
    request: answerIntent,
    saysLike: prompt,
    repromptsLike: `Question ${index + 2}. ${SCIENCE_CATEGORY} Question `,
    shouldEndSession: false,
    ignoreQuestionCheck: true,
    hasAttributes: {
      category: SCIENCE_CATEGORY,
      correctAnswerIndex: correctAnswers[index + 1],
      correctAnswerText: `${SCIENCE_CATEGORY} Question Number ${gameQuestionsIndices[index + 1] + 1} / Correct Answer`,
      questionIndex: index + 1,
      gameQuestionsIndices: gameQuestionsIndices,
      score: isCorrectAnswer ? score + 1 : score,
    },
  }
}

function buildLastAnswerIntentGameSequenceItem(gameQuestionsIndices, correctAnswers, isCorrectAnswer, score, isWinning) {
  let prompt;
  let answerIntent;

  if (isCorrectAnswer) {
    answerIntent = buildAnswerIntent(correctAnswers[GAME_LENGTH - 1]);
    prompt = `That answer is correct. You got ${score + 1} out of ${GAME_LENGTH} questions correct. ${isWinning ? `You won the game. Thank you for playing!` : `Unfortunately, you did not win this game. Thank you for playing!`}`;
  }
  else {
    answerIntent = isCorrectAnswer === null ? buildDontKnowIntent() : buildAnswerIntent(correctAnswers[GAME_LENGTH - 1] + 1); //+1 to simulate a wrong answer
    prompt = `${isCorrectAnswer === null ? `` : `That answer is wrong. `}The correct answer is ${correctAnswers[GAME_LENGTH - 1]}: ${SCIENCE_CATEGORY} Question Number ${gameQuestionsIndices[GAME_LENGTH - 1] + 1} / Correct Answer. You got ${score} out of ${GAME_LENGTH} questions correct. ${isWinning ? `You won the game. Thank you for playing!` : `Unfortunately, you did not win this game. Thank you for playing!`}`;
  }

  return {
    request: answerIntent,
    says: prompt,
    repromptsNothing: true,
    shouldEndSession: true,
    ignoreQuestionCheck: true,
  };
}

function isWinningGame(customerAnswers) {
  let correctAnswers = 0;
  customerAnswers.forEach(customerAnswer => { if (customerAnswer) correctAnswers++; })

  return correctAnswers / customerAnswers.length >= 0.5
}