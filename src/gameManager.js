const questionBank = require("./questionBank");
const interactions = require("./interactions");

const GAME_LENGTH = 5;

const quesionDataSource = require("./apl/data/QuestionDatasource");
const quesionDocument = require("./apl/document/QuestionDocument");

/**
 * Fetches the requested number of random questions from the given set of
 * questions. If the requested number of questions is greater than the
 * total number of questions available, an error gets thrown.
 */
const fetchRandomGameQuestions = (allQuestions, gameLength) => {
  const gameQuestions = [];
  const indexList = [];
  let index = allQuestions.length;
  if (gameLength > index) {
    throw new Error("Invalid Game Length.");
  }

  for (let i = 0; i < allQuestions.length; i += 1) {
    indexList.push(i);
  }

  for (let j = 0; j < gameLength; j += 1) {
    const rand = Math.floor(Math.random() * index);
    index -= 1;

    const temp = indexList[index];
    indexList[index] = indexList[rand];
    indexList[rand] = temp;
    gameQuestions.push(indexList[index]);
  }
  return gameQuestions;
}

/**
 * Randomizes the answers in the given question putting the correct answer
 * at the given index. The method assumes that the question has at least four
 * answers and the first answer is the correct answer.
 * 
 * @param {*} question The question object whose answers should be randomized.
 * @param {*} correctAnswerTargetIndex The 0-based index where the correct answer
 * should be placed. This has to be less than 4.
 * TODO: Validate inputs and update documentation.
 */
const randomizeAnswers = (
  question,
  correctAnswerTargetIndex,
) => {
  const ANSWER_COUNT = 4;

  const answers = [];
  const answersCopy = question[
    Object.keys(question)[0]
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
  answers[0] = answers[correctAnswerTargetIndex];
  answers[correctAnswerTargetIndex] = swapTemp2;
  return answers;
}

const handleUserGuess_ForEvent = (usersAnswer, handlerInput) => {
  const {
    requestEnvelope,
    attributesManager,
    responseBuilder
  } = handlerInput;

  userGaveUp = false;
  let speechOutput = "";
  let speechOutputAnalysis = "";

  const sessionAttributes = attributesManager.getSessionAttributes();
  const gameQuestions = sessionAttributes.questions;
  let correctAnswerTargetIndex = parseInt(sessionAttributes.correctAnswerIndex, 10);
  let currentScore = parseInt(sessionAttributes.score, 10);
  let currentQuestionIndex = parseInt(
    sessionAttributes.currentQuestionIndex,
    10
  );
  const { correctAnswerText } = sessionAttributes;

  const translatedQuestions = questionBank.getQuestions(
    sessionAttributes.category,
    handlerInput.requestEnvelope.request.locale
  );

  if (
    usersAnswer ===
    sessionAttributes.correctAnswerIndex
  ) {
    currentScore += 1;
    speechOutputAnalysis = interactions.t("ANSWER_CORRECT_MESSAGE");
  } else {
    if (!userGaveUp) {
      speechOutputAnalysis = interactions.t("ANSWER_WRONG_MESSAGE");
    }

    speechOutputAnalysis += interactions.t(
      "CORRECT_ANSWER_MESSAGE",
      correctAnswerTargetIndex,
      correctAnswerText
    );
  }

  // Check if we can exit the game session after GAME_LENGTH questions (zero-indexed)
  if (sessionAttributes.currentQuestionIndex === GAME_LENGTH - 1) {
    speechOutput = userGaveUp ? "" : interactions.t("ANSWER_IS_MESSAGE");

    const isGameWon = currentScore / GAME_LENGTH >= 0.3;
    speechOutput +=
      speechOutputAnalysis +
      interactions.t(
        "FINAL_SCORE_MESSAGE",
        currentScore.toString(),
        GAME_LENGTH.toString()
      ) +
      (isGameWon
        ? interactions.t("GAME_WON_MESSAGE")
        : interactions.t("GAME_LOST_MESSAGE"));

    return responseBuilder.speak(speechOutput).getResponse();
  }
  currentQuestionIndex += 1;
  correctAnswerTargetIndex = Math.floor(Math.random() * ANSWER_COUNT);
  const spokenQuestion = Object.keys(
    translatedQuestions[gameQuestions[currentQuestionIndex]]
  )[0];
  const roundAnswers = randomizeAnswers(
    gameQuestions,
    currentQuestionIndex,
    correctAnswerTargetIndex,
    translatedQuestions
  );
  const questionIndexForSpeech = currentQuestionIndex + 1;
  let repromptText = interactions.t(
    "TELL_QUESTION_MESSAGE",
    questionIndexForSpeech.toString(),
    spokenQuestion
  );

  for (let i = 0; i < ANSWER_COUNT; i += 1) {
    repromptText += `${i + 1}. ${roundAnswers[i]}. `;
  }

  speechOutput += userGaveUp ? "" : interactions.t("ANSWER_IS_MESSAGE");
  speechOutput +=
    speechOutputAnalysis +
    interactions.t("SCORE_IS_MESSAGE", currentScore.toString()) +
    repromptText;

  const translatedQuestion =
    translatedQuestions[gameQuestions[currentQuestionIndex]];

  Object.assign(sessionAttributes, {
    speechOutput: repromptText,
    repromptText,
    currentQuestionIndex,
    correctAnswerIndex: correctAnswerTargetIndex + 1,
    questions: gameQuestions,
    score: currentScore,
    correctAnswerText:
      translatedQuestion[Object.keys(translatedQuestion)[0]][0]
  });

  return responseBuilder
    .addDirective({
      type: 'Alexa.Presentation.APL.RenderDocument',
      version: '1.0',
      document: quesionDocument,
      datasources: quesionDataSource(roundAnswers, correctAnswerTargetIndex)
    })
    .speak(speechOutput)
    .reprompt(repromptText)
    .withSimpleCard(interactions.t("GAME_NAME"), repromptText)
    .getResponse();
}

module.exports = {
  handleUserGuess_ForEvent: handleUserGuess_ForEvent,
  fetchRandomGameQuestions: fetchRandomGameQuestions,
  randomizeAnswers: randomizeAnswers,
};
