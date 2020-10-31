const fetchRandomGameQuestions = require("../gameManager").fetchRandomGameQuestions;
const randomizeAnswers = require("../gameManager").randomizeAnswers;

const interactions = require("../interactions");
const questionBank = require("../questionBank");

const GAME_LENGTH = 5;
const ANSWER_COUNT = 4;

const questionDataSource = require("../apl/data/QuestionDatasource");
const questionDocument = require("../apl/document/QuestionDocument");

module.exports = StartGameIntentHandler = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;

    return (
      request.type === "IntentRequest" &&
      request.intent.name === "StartGameIntent"
    );
  },
  handle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    const { intent } = handlerInput.requestEnvelope.request;

    if (request.dialogState !== "COMPLETED") {
      return handlerInput.responseBuilder.addDelegateDirective().getResponse();
    } else if (
      intent.slots.game_category.resolutions.resolutionsPerAuthority[0].status
        .code != "ER_SUCCESS_MATCH"
    ) {
      return handlerInput.responseBuilder
        .speak(interactions.t("CATEGORY_NOT_SUPPORTED"))
        .getResponse();
    } else {
      return startGame(true, handlerInput);
    }
  }
};

const startGame = (isNewGame, handlerInput) => {
  const { requestEnvelope } = handlerInput;
  const { intent } = requestEnvelope.request;

  const category =
    intent.slots.game_category.resolutions.resolutionsPerAuthority[0]
      .values[0].value.id;

  const allQuestions = questionBank.getQuestions(
    category,
    handlerInput.requestEnvelope.request.locale
  );

  const gameQuestionsIndices = fetchRandomGameQuestions(
    allQuestions, GAME_LENGTH
  );
  const correctAnswerTargetIndex = Math.floor(Math.random() * ANSWER_COUNT);

  const nextQuestionIndex = 0;
  const nextQuestion =
    allQuestions[gameQuestionsIndices[nextQuestionIndex]];
  const nextQuestionRandomizedAnswers = randomizeAnswers(
    nextQuestion,
    correctAnswerTargetIndex,
  );
  const spokenQuestion = Object.keys(
    allQuestions[gameQuestionsIndices[nextQuestionIndex]]
  )[0];

  let questionAndAnswersText = interactions.t("TELL_QUESTION_MESSAGE", "1", spokenQuestion);
  for (let i = 0; i < ANSWER_COUNT; i += 1) {
    questionAndAnswersText += `${i + 1}. ${nextQuestionRandomizedAnswers[i]}. `;
  }

  const sessionAttributes = {};
  Object.assign(sessionAttributes, {
    category: category,
    correctAnswerIndex: correctAnswerTargetIndex + 1,
    correctAnswerText: nextQuestionRandomizedAnswers[correctAnswerTargetIndex],
    questionIndex: nextQuestionIndex,
    gameQuestionsIndices: gameQuestionsIndices,
    score: 0,
  });
  handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

  return handlerInput.responseBuilder
    .speak(`${isNewGame ? `${interactions.t("WELCOME_MESSAGE", GAME_LENGTH.toString())}` : ``}${questionAndAnswersText}`)
    .reprompt(questionAndAnswersText)
    .withSimpleCard(interactions.t("GAME_NAME"), questionAndAnswersText)
    // Add this to render APL document
    .addDirective({
      type: 'Alexa.Presentation.APL.RenderDocument',
      version: '1.0',
      document: questionDocument, // Import button APL document
      datasources: questionDataSource(nextQuestionRandomizedAnswers, correctAnswerTargetIndex)
    })
    .getResponse();
}
