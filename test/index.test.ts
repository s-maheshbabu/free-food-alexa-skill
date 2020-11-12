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

const gameResultsDocument = require("../src/apl/document/GameResultsDocument");
const questionResultsDocument = require("../src/apl/document/QuestionResultsDocument");
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

const { GAME_LENGTH } = require("../src/gameManager");

const ResponseModes = { TOUCH: "touch", VOICE: "voice", };

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
        says: 'Welcome to Smarty Pants. Choose a category to play. ANIMALS, GENERAL, SCIENCE, SUSTAINABILITY or TECHNOLOGY?',
        reprompts: 'Welcome to Smarty Pants. Choose a category to play. ANIMALS, GENERAL, SCIENCE, SUSTAINABILITY or TECHNOLOGY?',
        shouldEndSession: false,
      },
    ]);
  });

  describe('should be able to start over the game.', () => {
    alexaTest.test([
      {
        request: new IntentRequestBuilder(skillSettings, 'AMAZON.StartOverIntent').build(),
        says: 'Welcome to Smarty Pants. Choose a category to play. ANIMALS, GENERAL, SCIENCE, SUSTAINABILITY or TECHNOLOGY?',
        reprompts: 'Welcome to Smarty Pants. Choose a category to play. ANIMALS, GENERAL, SCIENCE, SUSTAINABILITY or TECHNOLOGY?',
        shouldEndSession: false,
      },
    ]);
  });

  describe('should be able to start a game and then half way through, start over a new game.', () => {
    alexaTest.test(
      [
        {
          request: new LaunchRequestBuilder(skillSettings).build(),
          says: 'Welcome to Smarty Pants. Choose a category to play. ANIMALS, GENERAL, SCIENCE, SUSTAINABILITY or TECHNOLOGY?',
          reprompts: 'Welcome to Smarty Pants. Choose a category to play. ANIMALS, GENERAL, SCIENCE, SUSTAINABILITY or TECHNOLOGY?',
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
          says: 'Welcome to Smarty Pants. Choose a category to play. ANIMALS, GENERAL, SCIENCE, SUSTAINABILITY or TECHNOLOGY?',
          reprompts: 'Welcome to Smarty Pants. Choose a category to play. ANIMALS, GENERAL, SCIENCE, SUSTAINABILITY or TECHNOLOGY?',
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

describe("Interactions through touch", () => {
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

describe("Interactions through a combination of voice and touch", () => {
  describe('should be able to play a winning game through a combination of voice and touch responses', () => {
    alexaTest.test(
      buildGameSequence_MixedUIAndVoiceInteraction(
        getGameQuestionsIndices(),
        getCorrectAnswerIndices(),
        [true, true, true, false, false],
        [ResponseModes.TOUCH, ResponseModes.VOICE, ResponseModes.VOICE, ResponseModes.TOUCH, ResponseModes.VOICE],
      ));
  });

  describe('should be able to play a losing game through a combination of voice and touch responses', () => {
    alexaTest.test(
      buildGameSequence_MixedUIAndVoiceInteraction(
        getGameQuestionsIndices(),
        getCorrectAnswerIndices(),
        [true, false, true, false, false],
        [ResponseModes.VOICE, ResponseModes.VOICE, ResponseModes.VOICE, ResponseModes.TOUCH, ResponseModes.TOUCH],
        true));
  });

  describe('should be able to handle the case where user gives up on some questions via voice (by saying -i dont know-) and then goes on to win the game.', () => {
    alexaTest.test(
      buildGameSequence_MixedUIAndVoiceInteraction(
        getGameQuestionsIndices(),
        getCorrectAnswerIndices(),
        [true, false, null, false, false],
        [ResponseModes.VOICE, ResponseModes.VOICE, ResponseModes.VOICE, ResponseModes.TOUCH, ResponseModes.TOUCH],
        true));
  });
});

function buildGameSequence_VoiceInteraction(gameQuestionsIndices, correctAnswers, customerAnswers) {
  return buildGameSequence_MixedUIAndVoiceInteraction(
    gameQuestionsIndices,
    correctAnswers,
    customerAnswers,
    [ResponseModes.VOICE, ResponseModes.VOICE, ResponseModes.VOICE, ResponseModes.VOICE, ResponseModes.VOICE],
    false);
}

function buildGameSequence_UIInteraction(gameQuestionsIndices, correctAnswers, customerAnswers) {
  return buildGameSequence_MixedUIAndVoiceInteraction(
    gameQuestionsIndices,
    correctAnswers,
    customerAnswers,
    [ResponseModes.TOUCH, ResponseModes.TOUCH, ResponseModes.TOUCH, ResponseModes.TOUCH, ResponseModes.TOUCH],
  );
}

function buildGameSequence_MixedUIAndVoiceInteraction(gameQuestionsIndices, correctAnswers, customerAnswers, responseModes, isAplDevice = true) {
  assert(gameQuestionsIndices.length == GAME_LENGTH && correctAnswers.length == GAME_LENGTH && customerAnswers.length == GAME_LENGTH && responseModes.length == GAME_LENGTH);
  let score = 0;

  const gameSequence = [];

  // User initiates the game with voice. The skill launches the game and asks the first question.
  if (responseModes[0] === ResponseModes.TOUCH)
    gameSequence.push(buildStartGameSequenceItem(gameQuestionsIndices, correctAnswers, isAplDevice));
  else if (responseModes[0] === ResponseModes.VOICE)
    gameSequence.push(buildStartGameSequenceItem(gameQuestionsIndices, correctAnswers, isAplDevice));


  for (let index = 0; index < customerAnswers.length - 1; index++) {
    if (responseModes[index] === ResponseModes.TOUCH)
      // User taps on an answer. The skill informs the user whether they are right or wrong and kicks off an auto_generated event.
      gameSequence.push(buildNthAnswerTouchEventGameSequenceItem(gameQuestionsIndices, correctAnswers, customerAnswers, customerAnswers[index], score, index));
    else if (responseModes[index] === ResponseModes.VOICE)
      // User answers by voice. The skill informs the user whether they are right or wrong. If it is an APL device, it then kicks off an auto_generated event
      // to fetch the next question. If it is not an APL device, it just fetches the next question as well and renders.
      gameSequence.push(buildNthAnswerIntentGameSequenceItem(gameQuestionsIndices, correctAnswers, customerAnswers, score, index, isAplDevice));
    if (customerAnswers[index]) {
      score++;
    }

    if (isAplDevice)
      // For APL devices, auto generated event to fetch the next question arrives. The skill fetches the next question and asks the user.
      gameSequence.push(buildFetchNextQuestionEventGameSequenceItem(gameQuestionsIndices, correctAnswers, score, index));
  }

  const customersLastAnswer = customerAnswers[GAME_LENGTH - 1];
  const isWinning = isWinningGame(customerAnswers);
  if (responseModes[GAME_LENGTH - 1] === ResponseModes.TOUCH)
    // User taps on an answer for the last question in the game. The skill informs the user their final score and whether or not they won the game.
    gameSequence.push(buildLastAnswerTouchEventGameSequenceItem(gameQuestionsIndices, correctAnswers, customersLastAnswer, score, isWinning));
  else if (responseModes[GAME_LENGTH - 1] === ResponseModes.VOICE)
    // User answers the last question in the game with voice. The skill informs the user their final score and whether or not they won the game.
    gameSequence.push(buildLastAnswerIntentGameSequenceItem(gameQuestionsIndices, correctAnswers, customersLastAnswer, score, isWinning, isAplDevice));

  console.log(`This is a ${isWinning ? 'Winning' : 'Losing'} game`);
  console.log(`Score is ${score} out of ${GAME_LENGTH}`);
  return gameSequence;
}

function buildStartGameIntent(isAplDevice = false) {
  const startGameIntent = new IntentRequestBuilder(skillSettings, 'StartGameIntent')
    .withInterfaces({ apl: isAplDevice })
    .withSlotResolution(GAME_CATEGORY_SLOT, 'science related', GAME_CATEGORY_SLOT_TYPE, SCIENCE_CATEGORY).build();
  startGameIntent.request.dialogState = 'COMPLETED';

  return startGameIntent;
}

function buildAnswerIntent(answer, isAplDevice = false) {
  return new IntentRequestBuilder(skillSettings, 'AnswerIntent')
    .withInterfaces({ apl: isAplDevice })
    .withSlotResolution(ANSWER_SLOT, answer.toString(), ANSWER_SLOT_TYPE, answer).build();
}

function buildDontKnowIntent(isAplDevice = false) {
  return new IntentRequestBuilder(skillSettings, 'DontKnowIntent')
    .withInterfaces({ apl: isAplDevice })
    .build();
}

/**
 * For the hard-coded 'random sequence', this is the expected questions to be played. If the random sequence is changed, this also needs to be changed.
 */
function getGameQuestionsIndices() {
  return [162, 33, 122, 37, 86];
}

/**
 * For the hard-coded 'random sequence', this is the correct answers. If the random sequence is changed, this also needs to be changed.
 */
function getCorrectAnswerIndices() {
  return [1, 3, 4, 2, 2];
}

/**
 * Validate that the APL datasource backing the results view is correctly populated.
 * 
 * @param datasource The APL data source to be validated.
 */
function verifyQuestionResultsDataSource(datasource, isCorrect, currentQuestionIndex, incorrectAnswers, score, skipped, totalNumberOfQuestions) {
  expect(datasource.isCorrect).to.equal(isCorrect);
  expect(datasource.currentQuestionIndex).to.equal(currentQuestionIndex + 1);
  expect(datasource.incorrectAnswers).to.equal(111);
  expect(datasource.score).to.equal(score);
  expect(datasource.skipped).to.equal(222);
  expect(datasource.totalNumberOfQuestions).to.equal(totalNumberOfQuestions);

  return true;
}

/**
 * Validate that the APL datasource backing the game results view is correctly populated.
 * 
 * @param datasource The APL data source to be validated.
 */
function verifyGameResultsDataSource(datasource, isWon, incorrectAnswers, score, skipped, totalNumberOfQuestions) {
  expect(datasource.isWon).to.equal(isWon);
  expect(datasource.incorrectAnswers).to.equal(111);
  expect(datasource.score).to.equal(score);
  expect(datasource.skipped).to.equal(222);
  expect(datasource.totalNumberOfQuestions).to.equal(totalNumberOfQuestions);

  return true;
}

/**
 * Validate that the APL datasource backing the question&answers view is correctly populated.
 *
 * @param datasource The APL data source to be validated.
 * @param questionIndex The index of the question in the question bank that is to be displayed to the user.
 * @param sessionAttributes The current session attributes. These are used to cross verify the contents of the data source.
 */
function verifyQuestionAndAnswersDataSource(datasource, questionIndex, sessionAttributes) {
  const question = allQuestions[questionIndex];
  const questionText = Object.keys(question)[0];
  const answers = question[Object.keys(question)[0]].slice();
  expect(datasource.title).to.equal(questionText);

  const displayedAnswers = datasource.listItems;
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

// Simulates a StartGameIntent and verifies the expected skill responses.
function buildStartGameSequenceItem(gameQuestionsIndices, correctAnswers, isAplDevice = false) {
  return {
    request: buildStartGameIntent(isAplDevice),
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
      // No APL directives should be included for devices that don't support APL.
      if (!isAplDevice) return undefined;

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

// Simulates the user answering by touch one of the questions in the game (not the last question which is a special case)
// and verifies the expected skill responses.
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
          return deepEqual(doc, questionResultsDocument);
        },
        hasDataSources: {
          questionResultsDataSource: (ds: any) => {
            return verifyQuestionResultsDataSource(ds, isCorrectAnswer ? true : false, this.hasAttributes.questionIndex, null, this.hasAttributes.score, null, GAME_LENGTH);
          },
        },
      }
    },
  }
}

// Simulates an auto-generated event from APL devices to fetch next question and verifies the expected skill responses.
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

// Simulates the user clicking on one of the answers for the last question in the game. It then verifies the expected skill responses
// which includes declaring if the user won or lost the game.
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
          return deepEqual(doc, gameResultsDocument);
        },
        hasDataSources: {
          gameResultsDataSource: (ds: any) => {
            return verifyGameResultsDataSource(ds, isWinning, null, isCorrectAnswer ? score + 1 : score, null, GAME_LENGTH);
          },
        },
      }
    },
  };
}

// Simulates the user answering by voice one of the questions in the game (not the last question which is a special case).
// Users can answer by voice both on APL and non-APL devices. So, we verify that the right responses are returned in each case.
// For APL devices we just deliver results of the previous question and kick off an auto-generated event to fetch the next question.
// For non-APL devices, we deliver results of the previous question and also render the next question.
function buildNthAnswerIntentGameSequenceItem(gameQuestionsIndices, correctAnswers, customerAnswers, score, index, isAplDevice) {
  const isCorrectAnswer = customerAnswers[index];

  let prompt, answerIntent, attributes;
  if (isCorrectAnswer) {
    answerIntent = buildAnswerIntent(correctAnswers[index], isAplDevice);

    // We deliver the next question only on non-APL devices.
    if (!isAplDevice) prompt = `That answer is correct. Your score is ${score + 1}. Question ${index + 2}. ${SCIENCE_CATEGORY} Question`;
    else prompt = `That answer is correct. Your score is ${score + 1}.`;
  }
  else {
    answerIntent = isCorrectAnswer === null ? buildDontKnowIntent(isAplDevice) : buildAnswerIntent(correctAnswers[index] + 1, isAplDevice); //+1 to simulate a wrong answer

    // We deliver the next question only on non-APL devices.
    if (!isAplDevice) prompt = `Question ${index + 2}. ${SCIENCE_CATEGORY} Question`;
    else prompt = `${isCorrectAnswer === null ? `` : `That answer is wrong. `}The correct answer is ${correctAnswers[index]}: ${SCIENCE_CATEGORY} Question Number ${gameQuestionsIndices[index] + 1} / Correct Answer. Your score is ${score}.`;
  }

  // On APL devices, we just deliver the results but won't render the next question. So, the session attributes like 'questionIndex' are not incremented. The
  // indices are incremented for non-APL devices because we actually render the next question in this turn itself.
  if (isAplDevice) {
    attributes = {
      category: SCIENCE_CATEGORY,
      correctAnswerIndex: correctAnswers[index],
      correctAnswerText: `${SCIENCE_CATEGORY} Question Number ${gameQuestionsIndices[index] + 1} / Correct Answer`,
      questionIndex: index,
      gameQuestionsIndices: gameQuestionsIndices,
      score: isCorrectAnswer ? score + 1 : score,
    };
  }
  else {
    attributes = {
      category: SCIENCE_CATEGORY,
      correctAnswerIndex: correctAnswers[index + 1],
      correctAnswerText: `${SCIENCE_CATEGORY} Question Number ${gameQuestionsIndices[index + 1] + 1} / Correct Answer`,
      questionIndex: index + 1,
      gameQuestionsIndices: gameQuestionsIndices,
      score: isCorrectAnswer ? score + 1 : score,
    };
  }

  return {
    request: answerIntent,
    get says() {
      if (!isAplDevice) return undefined;
      else return prompt;
    },
    get saysLike() {
      if (isAplDevice) return undefined;
      else return prompt;
    },
    get repromptsLike() {
      if (isAplDevice) return undefined;
      return `Question ${index + 2}. ${SCIENCE_CATEGORY} Question `;
    },
    shouldEndSession: false,
    ignoreQuestionCheck: true,
    hasAttributes: attributes,
    get renderDocument() {
      if (!isAplDevice) return undefined;
      return {
        token: RESULTS_VIEW_TOKEN,
        document: (doc: any) => {
          return deepEqual(doc, questionResultsDocument);
        },
        hasDataSources: {
          questionResultsDataSource: (ds: any) => {
            return verifyQuestionResultsDataSource(ds, isCorrectAnswer ? true : false, this.hasAttributes.questionIndex, null, this.hasAttributes.score, null, GAME_LENGTH);
          },
        },
      }
    },
  }
}

// Simulates the user answering by voice the last question in the game. It then verifies the expected skill responses
// which includes declaring if the user won or lost the game.
function buildLastAnswerIntentGameSequenceItem(gameQuestionsIndices, correctAnswers, isCorrectAnswer, score, isWinning, isAplDevice) {
  let prompt, answerIntent;

  if (isCorrectAnswer) {
    answerIntent = buildAnswerIntent(correctAnswers[GAME_LENGTH - 1], isAplDevice);
    prompt = `That answer is correct. You got ${score + 1} out of ${GAME_LENGTH} questions correct. ${isWinning ? `You won the game. Thank you for playing!` : `Unfortunately, you did not win this game. Thank you for playing!`}`;
  }
  else {
    answerIntent = isCorrectAnswer === null ? buildDontKnowIntent(isAplDevice) : buildAnswerIntent(correctAnswers[GAME_LENGTH - 1] + 1, isAplDevice); //+1 to simulate a wrong answer
    prompt = `${isCorrectAnswer === null ? `` : `That answer is wrong. `}The correct answer is ${correctAnswers[GAME_LENGTH - 1]}: ${SCIENCE_CATEGORY} Question Number ${gameQuestionsIndices[GAME_LENGTH - 1] + 1} / Correct Answer. You got ${score} out of ${GAME_LENGTH} questions correct. ${isWinning ? `You won the game. Thank you for playing!` : `Unfortunately, you did not win this game. Thank you for playing!`}`;
  }

  return {
    request: answerIntent,
    says: prompt,
    repromptsNothing: true,
    shouldEndSession: true,
    ignoreQuestionCheck: true,
    get renderDocument() {
      if (!isAplDevice) return undefined;
      return {
        token: RESULTS_VIEW_TOKEN,
        document: (doc: any) => {
          return deepEqual(doc, gameResultsDocument);
        },
        hasDataSources: {
          gameResultsDataSource: (ds: any) => {
            return verifyGameResultsDataSource(ds, isWinning, null, isCorrectAnswer ? score + 1 : score, null, GAME_LENGTH);
          },
        },
      }
    },
  };
}

function isWinningGame(customerAnswers) {
  let correctAnswers = 0;
  customerAnswers.forEach(customerAnswer => { if (customerAnswer) correctAnswers++; })

  return correctAnswers / customerAnswers.length >= 0.5
}