const Alexa = require("ask-sdk-core");

const questions = require("./resources/questions");

const LaunchRequestHandler = require("./requesthandlers/LaunchRequestHandler");
const SessionEndedRequestHandler = require("./requesthandlers/SessionEndedRequestHandler");

const ErrorHandler = require("./errors/ErrorHandler");

const YesIntentHandler = require("./intenthandlers/YesIntentHandler");
const StopIntentHandler = require("./intenthandlers/StopIntentHandler");
const NoIntentHandler = require("./intenthandlers/NoIntentHandler");
const CancelIntentHandler = require("./intenthandlers/CancelIntentHandler");
const RepeatIntentHandler = require("./intenthandlers/RepeatIntentHandler");
const HelpIntentHandler = require("./intenthandlers/HelpIntentHandler");
const UnhandledIntentHandler = require("./intenthandlers/UnhandledIntentHandler");

const LocalizationInterceptor = require("./interceptors/LocalizationInterceptor");

const ANSWER_COUNT = 4;
const GAME_LENGTH = 5;

function populateGameQuestions(translatedQuestions) {
  const gameQuestions = [];
  const indexList = [];
  let index = translatedQuestions.length;
  if (GAME_LENGTH > index) {
    throw new Error("Invalid Game Length.");
  }

  for (let i = 0; i < translatedQuestions.length; i += 1) {
    indexList.push(i);
  }

  for (let j = 0; j < GAME_LENGTH; j += 1) {
    const rand = Math.floor(Math.random() * index);
    index -= 1;

    const temp = indexList[index];
    indexList[index] = indexList[rand];
    indexList[rand] = temp;
    gameQuestions.push(indexList[index]);
  }
  return gameQuestions;
}

function populateRoundAnswers(
  gameQuestionIndexes,
  correctAnswerIndex,
  correctAnswerTargetLocation,
  translatedQuestions
) {
  const answers = [];
  const translatedQuestion =
    translatedQuestions[gameQuestionIndexes[correctAnswerIndex]];
  const answersCopy = translatedQuestion[
    Object.keys(translatedQuestion)[0]
  ].slice();
  let index = answersCopy.length;

  if (index < ANSWER_COUNT) {
    throw new Error("Not enough answers for question.");
  }

  // Shuffle the answers, excluding the first element which is the correct answer.
  for (let j = 1; j < answersCopy.length; j += 1) {
    const rand = Math.floor(Math.random() * (index - 1)) + 1;
    index -= 1;

    const swapTemp1 = answersCopy[index];
    answersCopy[index] = answersCopy[rand];
    answersCopy[rand] = swapTemp1;
  }

  // Swap the correct answer into the target location
  for (let i = 0; i < ANSWER_COUNT; i += 1) {
    answers[i] = answersCopy[i];
  }
  const swapTemp2 = answers[0];
  answers[0] = answers[correctAnswerTargetLocation];
  answers[correctAnswerTargetLocation] = swapTemp2;
  return answers;
}

function isAnswerSlotValid(intent) {
  const answerSlotFilled =
    intent && intent.slots && intent.slots.Answer && intent.slots.Answer.value;
  const answerSlotIsInt =
    answerSlotFilled && !Number.isNaN(parseInt(intent.slots.Answer.value, 10));
  return (
    answerSlotIsInt &&
    parseInt(intent.slots.Answer.value, 10) < ANSWER_COUNT + 1 &&
    parseInt(intent.slots.Answer.value, 10) > 0
  );
}

function handleUserGuess(userGaveUp, handlerInput) {
  const { requestEnvelope, attributesManager, responseBuilder } = handlerInput;
  const { intent } = requestEnvelope.request;

  const answerSlotValid = isAnswerSlotValid(intent);

  let speechOutput = "";
  let speechOutputAnalysis = "";

  const sessionAttributes = attributesManager.getSessionAttributes();
  const gameQuestions = sessionAttributes.questions;
  let correctAnswerIndex = parseInt(sessionAttributes.correctAnswerIndex, 10);
  let currentScore = parseInt(sessionAttributes.score, 10);
  let currentQuestionIndex = parseInt(
    sessionAttributes.currentQuestionIndex,
    10
  );
  const { correctAnswerText } = sessionAttributes;
  const requestAttributes = attributesManager.getRequestAttributes();
  const translatedQuestions = requestAttributes.t("QUESTIONS");

  if (
    answerSlotValid &&
    parseInt(intent.slots.Answer.value, 10) ===
      sessionAttributes.correctAnswerIndex
  ) {
    currentScore += 1;
    speechOutputAnalysis = requestAttributes.t("ANSWER_CORRECT_MESSAGE");
  } else {
    if (!userGaveUp) {
      speechOutputAnalysis = requestAttributes.t("ANSWER_WRONG_MESSAGE");
    }

    speechOutputAnalysis += requestAttributes.t(
      "CORRECT_ANSWER_MESSAGE",
      correctAnswerIndex,
      correctAnswerText
    );
  }

  // Check if we can exit the game session after GAME_LENGTH questions (zero-indexed)
  if (sessionAttributes.currentQuestionIndex === GAME_LENGTH - 1) {
    speechOutput = userGaveUp ? "" : requestAttributes.t("ANSWER_IS_MESSAGE");
    speechOutput +=
      speechOutputAnalysis +
      requestAttributes.t(
        "GAME_OVER_MESSAGE",
        currentScore.toString(),
        GAME_LENGTH.toString()
      );

    return responseBuilder.speak(speechOutput).getResponse();
  }
  currentQuestionIndex += 1;
  correctAnswerIndex = Math.floor(Math.random() * ANSWER_COUNT);
  const spokenQuestion = Object.keys(
    translatedQuestions[gameQuestions[currentQuestionIndex]]
  )[0];
  const roundAnswers = populateRoundAnswers(
    gameQuestions,
    currentQuestionIndex,
    correctAnswerIndex,
    translatedQuestions
  );
  const questionIndexForSpeech = currentQuestionIndex + 1;
  let repromptText = requestAttributes.t(
    "TELL_QUESTION_MESSAGE",
    questionIndexForSpeech.toString(),
    spokenQuestion
  );

  for (let i = 0; i < ANSWER_COUNT; i += 1) {
    repromptText += `${i + 1}. ${roundAnswers[i]}. `;
  }

  speechOutput += userGaveUp ? "" : requestAttributes.t("ANSWER_IS_MESSAGE");
  speechOutput +=
    speechOutputAnalysis +
    requestAttributes.t("SCORE_IS_MESSAGE", currentScore.toString()) +
    repromptText;

  const translatedQuestion =
    translatedQuestions[gameQuestions[currentQuestionIndex]];

  Object.assign(sessionAttributes, {
    speechOutput: repromptText,
    repromptText,
    currentQuestionIndex,
    correctAnswerIndex: correctAnswerIndex + 1,
    questions: gameQuestions,
    score: currentScore,
    correctAnswerText: translatedQuestion[Object.keys(translatedQuestion)[0]][0]
  });

  return responseBuilder
    .speak(speechOutput)
    .reprompt(repromptText)
    .withSimpleCard(requestAttributes.t("GAME_NAME"), repromptText)
    .getResponse();
}

function startGame(newGame, handlerInput) {
  const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
  let speechOutput = newGame
    ? requestAttributes.t(
        "NEW_GAME_MESSAGE",
        requestAttributes.t("GAME_NAME")
      ) + requestAttributes.t("WELCOME_MESSAGE", GAME_LENGTH.toString())
    : "";

  requestAttributes.addResourceBundle(
    handlerInput.requestEnvelope.request.locale,
    "translation",
    {
      QUESTIONS: questions.QUESTIONS_EN_US
    }
  );
  console.log(
    requestAttributes.getResourceBundle(
      handlerInput.requestEnvelope.request.locale
    )
  );
  const translatedQuestions = requestAttributes.t("QUESTIONS");
  const gameQuestions = populateGameQuestions(translatedQuestions);
  const correctAnswerIndex = Math.floor(Math.random() * ANSWER_COUNT);

  const roundAnswers = populateRoundAnswers(
    gameQuestions,
    0,
    correctAnswerIndex,
    translatedQuestions
  );
  const currentQuestionIndex = 0;
  const spokenQuestion = Object.keys(
    translatedQuestions[gameQuestions[currentQuestionIndex]]
  )[0];
  let repromptText = requestAttributes.t(
    "TELL_QUESTION_MESSAGE",
    "1",
    spokenQuestion
  );
  for (let i = 0; i < ANSWER_COUNT; i += 1) {
    repromptText += `${i + 1}. ${roundAnswers[i]}. `;
  }

  speechOutput += repromptText;
  const sessionAttributes = {};

  const translatedQuestion =
    translatedQuestions[gameQuestions[currentQuestionIndex]];

  Object.assign(sessionAttributes, {
    speechOutput: repromptText,
    repromptText,
    currentQuestionIndex,
    correctAnswerIndex: correctAnswerIndex + 1,
    questions: gameQuestions,
    score: 0,
    correctAnswerText: translatedQuestion[Object.keys(translatedQuestion)[0]][0]
  });

  handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

  return handlerInput.responseBuilder
    .speak(speechOutput)
    .reprompt(repromptText)
    .withSimpleCard(requestAttributes.t("GAME_NAME"), repromptText)
    .getResponse();
}

const StartGameIntent = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;

    return (
      request.type === "IntentRequest" &&
      request.intent.name === "StartGameIntent"
    );
  },
  handle(handlerInput) {
    return startGame(true, handlerInput);
  }
};

const AnswerIntent = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      (handlerInput.requestEnvelope.request.intent.name === "AnswerIntent" ||
        handlerInput.requestEnvelope.request.intent.name === "DontKnowIntent")
    );
  },
  handle(handlerInput) {
    if (handlerInput.requestEnvelope.request.intent.name === "AnswerIntent") {
      return handleUserGuess(false, handlerInput);
    }
    return handleUserGuess(true, handlerInput);
  }
};

const skillBuilder = Alexa.SkillBuilders.custom();
exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    StartGameIntent,
    HelpIntentHandler,
    AnswerIntent,
    RepeatIntentHandler,
    YesIntentHandler,
    StopIntentHandler,
    CancelIntentHandler,
    NoIntentHandler,
    SessionEndedRequestHandler,
    UnhandledIntentHandler
  )
  .addRequestInterceptors(LocalizationInterceptor)
  .addErrorHandlers(ErrorHandler)
  .lambda();
