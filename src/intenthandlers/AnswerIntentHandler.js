const Alexa = require("ask-sdk-core");
const interactions = require("interactions");

const {
  ANSWER_COUNT,
  GAME_LENGTH,
  determineNextQuestion,
  determineResults
} = require("gameManager");

const userEventHandler = require("eventhandlers/UserEventHandler");
const { APL_INTERFACE } = require("constants/APL");

const GAME_WINNING_THRESHOLD_PERCENTAGE = 0.5;

module.exports = AnswerIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      (handlerInput.requestEnvelope.request.intent.name === "AnswerIntent" ||
        handlerInput.requestEnvelope.request.intent.name === "DontKnowIntent")
    );
  },
  handle(handlerInput) {
    if (handlerInput.requestEnvelope.request.intent.name === "AnswerIntent") {
      return handleUserGuess(handlerInput);
    }
    return handleUserGuess(handlerInput, true);
  },
};

const handleUserGuess = (handlerInput, userGaveUp = false) => {
  const { requestEnvelope, attributesManager, responseBuilder } = handlerInput;
  const { intent } = requestEnvelope.request;

  const sessionAttributes = attributesManager.getSessionAttributes();
  const userAnswer = isAnswerSlotValid(intent) ? parseInt(intent.slots.Answer.value, 10) : null;

  if (Alexa.getSupportedInterfaces(requestEnvelope).hasOwnProperty(APL_INTERFACE)) {
    return userEventHandler.deliverResults(handlerInput, sessionAttributes, userAnswer, userGaveUp);
  }

  const previousQuestionResults = determineResults(sessionAttributes, userAnswer, userGaveUp);
  let updatedSessionAttributes = previousQuestionResults.sessionAttributes;

  // Check if we can exit the game session after GAME_LENGTH questions (zero-indexed)
  if (updatedSessionAttributes.questionIndex === GAME_LENGTH - 1) {
    return endGame(responseBuilder, updatedSessionAttributes, previousQuestionResults);
  }

  const nextQuestionInfo = determineNextQuestion(updatedSessionAttributes, handlerInput.requestEnvelope.request.locale);

  updatedSessionAttributes = nextQuestionInfo.sessionAttributes;
  handlerInput.attributesManager.setSessionAttributes(updatedSessionAttributes);

  return responseBuilder
    .speak(previousQuestionResults.speak + nextQuestionInfo.speak)
    .reprompt(nextQuestionInfo.reprompt)
    .withSimpleCard(interactions.t("GAME_NAME"), nextQuestionInfo.speak) //TODO Cards are not tested in the test file.
    .getResponse();
}

const endGame = (responseBuilder, sessionAttributes, results) => {
  const { score: newScore } = sessionAttributes;
  const isGameWon = newScore / GAME_LENGTH >= GAME_WINNING_THRESHOLD_PERCENTAGE;
  const speechOutput = `${results.speak}${isGameWon ? interactions.t("GAME_WON_MESSAGE") : interactions.t("GAME_LOST_MESSAGE")}`;

  return responseBuilder.speak(speechOutput).getResponse();
}

const isAnswerSlotValid = intent => {
  const answerSlotFilled =
    intent &&
    intent.slots &&
    intent.slots.Answer &&
    intent.slots.Answer.value;
  const answerSlotIsInt =
    answerSlotFilled &&
    !Number.isNaN(parseInt(intent.slots.Answer.value, 10));
  return (
    answerSlotIsInt &&
    parseInt(intent.slots.Answer.value, 10) < ANSWER_COUNT + 1 &&
    parseInt(intent.slots.Answer.value, 10) > 0
  );
}
