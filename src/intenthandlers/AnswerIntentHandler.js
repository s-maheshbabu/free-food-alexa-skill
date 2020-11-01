const randomizeAnswers = require("gameManager").randomizeAnswers;

const interactions = require("interactions");
const questionBank = require("questionBank");

const GAME_LENGTH = 5;
const ANSWER_COUNT = 4;

const questionDataSource = require("apl/data/QuestionDatasource");
const questionDocument = require("apl/document/QuestionDocument");

const GAME_WINNING_THRESHOLD_PERCENTAGE = 0.5;

module.exports = AnswerIntent = {
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

const handleUserGuess = (userGaveUp, handlerInput) => {
  const { requestEnvelope, attributesManager, responseBuilder } = handlerInput;
  const { intent } = requestEnvelope.request;

  const sessionAttributes = attributesManager.getSessionAttributes();
  let correctAnswerIndexOfAlreadyAskedQuestion = parseInt(sessionAttributes.correctAnswerIndex, 10);
  const isUserAnswerCorrect = isAnswerSlotValid(intent) &&
    parseInt(intent.slots.Answer.value, 10) === correctAnswerIndexOfAlreadyAskedQuestion;

  let newScore = parseInt(sessionAttributes.score, 10);
  if (isUserAnswerCorrect)
    newScore += 1;

  const { correctAnswerText: answerTextOfAlreadyAskedQuestion, gameQuestionsIndices } = sessionAttributes;

  const prologue = buildPrologue(isUserAnswerCorrect, correctAnswerIndexOfAlreadyAskedQuestion, answerTextOfAlreadyAskedQuestion, userGaveUp);
  // Check if we can exit the game session after GAME_LENGTH questions (zero-indexed)
  if (sessionAttributes.questionIndex === GAME_LENGTH - 1) {
    return endGame(handlerInput, newScore, prologue, userGaveUp);
  }

  const allQuestions = questionBank.getQuestions(
    sessionAttributes.category,
    handlerInput.requestEnvelope.request.locale
  );

  const alreadyAskedQuestionIndex = parseInt(sessionAttributes.questionIndex, 10);
  const nextQuestionIndex = alreadyAskedQuestionIndex + 1;

  const nextQuestion = allQuestions[gameQuestionsIndices[nextQuestionIndex]];
  const nextQuestionCorrectAnswerIndex = Math.floor(Math.random() * ANSWER_COUNT);
  const nextQuestionRandomizedAnswers = randomizeAnswers(nextQuestion, nextQuestionCorrectAnswerIndex,);

  let nextQuestionAndAnswersPrompt = interactions.t(
    "TELL_QUESTION_MESSAGE",
    (nextQuestionIndex + 1).toString(),
    Object.keys(nextQuestion)[0],
  );
  for (let i = 0; i < ANSWER_COUNT; i += 1) {
    nextQuestionAndAnswersPrompt += `${i + 1}. ${nextQuestionRandomizedAnswers[i]}. `;
  }

  Object.assign(sessionAttributes, {
    correctAnswerIndex: nextQuestionCorrectAnswerIndex + 1,
    correctAnswerText: nextQuestionRandomizedAnswers[nextQuestionCorrectAnswerIndex],
    questionIndex: nextQuestionIndex,
    gameQuestionsIndices: gameQuestionsIndices,
    score: newScore,
  });

  const sendEventCommand = {
    type: "SendEvent",
    delay: 3000,
    arguments: [
      0,
      'whatever',
      `USER_VOICE_INITIATED`,
    ]
  };

  const speechOutput = `${prologue}${interactions.t("SCORE_IS_MESSAGE", newScore.toString())}${nextQuestionAndAnswersPrompt}`;
  return responseBuilder
    .speak(speechOutput)
    .reprompt(nextQuestionAndAnswersPrompt)
    .withSimpleCard(interactions.t("GAME_NAME"), nextQuestionAndAnswersPrompt)
    // Add this to render APL document
    .addDirective({
      type: 'Alexa.Presentation.APL.RenderDocument',
      version: '1.0',
      token: "answertoken",
      document: questionDocument, // Import button APL document
      datasources: questionDataSource(nextQuestionRandomizedAnswers, nextQuestionCorrectAnswerIndex)
    }).addDirective({
      type: 'Alexa.Presentation.APL.ExecuteCommands',
      token: "answertoken",
      commands: [sendEventCommand]
    })
    .getResponse();
}

const endGame = (handlerInput, score, prologue, userGaveUp = false) => {
  const { responseBuilder } = handlerInput;

  const isGameWon = score / GAME_LENGTH >= GAME_WINNING_THRESHOLD_PERCENTAGE;
  const speechOutput = `${prologue}${interactions.t("FINAL_SCORE_MESSAGE", score.toString(), GAME_LENGTH.toString())}${isGameWon ? interactions.t("GAME_WON_MESSAGE") : interactions.t("GAME_LOST_MESSAGE")}`;

  return responseBuilder.speak(speechOutput).getResponse();
}

const buildPrologue = (isUserAnswerCorrect, correctAnswerIndexOfAlreadyAskedQuestion, answerTextOfAlreadyAskedQuestion, userGaveUp = false) => {
  let prologue = userGaveUp ? "" : interactions.t("ANSWER_IS_MESSAGE");
  if (isUserAnswerCorrect) {
    prologue += interactions.t("ANSWER_CORRECT_MESSAGE");
  }
  else {
    if (!userGaveUp) {
      prologue += interactions.t("ANSWER_WRONG_MESSAGE");
    }
    prologue = `${prologue}${interactions.t("CORRECT_ANSWER_MESSAGE", correctAnswerIndexOfAlreadyAskedQuestion, answerTextOfAlreadyAskedQuestion)}`;
  }

  return prologue;
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
