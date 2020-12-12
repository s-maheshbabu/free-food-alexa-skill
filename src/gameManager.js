const questionBank = require("questionBank");
const interactions = require("interactions");

const GAME_LENGTH = 5;
const ANSWER_COUNT = 4;

const { random } = require("Random");

const quesionAndAnswersDataSource = require("apl/data/QuestionAndAnswersDatasource");
const quesionAndAnswersDocument = require("apl/document/QuestionAndAnswersDocument");

const GAME_WINNING_THRESHOLD_PERCENTAGE = 0.5;
const { SWIPE } = require("constants/ResponseModes");

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
    const rand = Math.floor(random() * index);
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
    const rand = Math.floor(random() * (index - 1)) + 1;
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

const determineNextQuestion = (sessionAttributes, locale) => {
  const { category, gameQuestionsIndices } = sessionAttributes;

  const allQuestions = questionBank.getQuestions(category, locale);

  const alreadyAskedQuestionIndex = parseInt(sessionAttributes.questionIndex, 10);
  const nextQuestionIndex = alreadyAskedQuestionIndex + 1;

  const nextQuestion = allQuestions[gameQuestionsIndices[nextQuestionIndex]];

  const nextQuestionCorrectAnswerIndex = Math.floor(random() * ANSWER_COUNT);
  const nextQuestionRandomizedAnswers = randomizeAnswers(nextQuestion, nextQuestionCorrectAnswerIndex,);

  let nextQuestionAndAnswersPrompt = interactions.t(
    "TELL_QUESTION_MESSAGE",
    (nextQuestionIndex + 1).toString(),
    Object.keys(nextQuestion)[0],
  );
  for (let i = 0; i < ANSWER_COUNT; i += 1) {
    nextQuestionAndAnswersPrompt += `${i + 1}. ${nextQuestionRandomizedAnswers[i]}. `;
  }

  const updatedSessionAttributes = Object.assign({}, sessionAttributes, {
    correctAnswerIndex: nextQuestionCorrectAnswerIndex + 1,
    correctAnswerText: nextQuestionRandomizedAnswers[nextQuestionCorrectAnswerIndex],
    questionIndex: nextQuestionIndex,
  });

  return {
    speak: `${nextQuestionAndAnswersPrompt}`,
    reprompt: `${nextQuestionAndAnswersPrompt}`,
    questionText: Object.keys(nextQuestion)[0],
    randomizedAnswers: nextQuestionRandomizedAnswers,
    sessionAttributes: updatedSessionAttributes,
  }
}

const determineResults = (responseMode, sessionAttributes, userAnswerIndex, userGaveUp = false) => {
  let correctAnswerIndexOfAlreadyAskedQuestion = parseInt(sessionAttributes.correctAnswerIndex, 10);
  const isUserAnswerCorrect = userAnswerIndex && userAnswerIndex === correctAnswerIndexOfAlreadyAskedQuestion;

  let newScore = parseInt(sessionAttributes.score, 10);
  let newIncorrectAnswers = parseInt(sessionAttributes.incorrectAnswers, 10);
  let newskippedAnswers = parseInt(sessionAttributes.skippedAnswers, 10);
  if (isUserAnswerCorrect) newScore += 1;
  else {
    if (userGaveUp) newskippedAnswers++;
    else newIncorrectAnswers++;
  }
  const updatedSessionAttributes = Object.assign({}, sessionAttributes, {
    score: newScore,
    incorrectAnswers: newIncorrectAnswers,
    skippedAnswers: newskippedAnswers,
  });

  const isEndOfGame = sessionAttributes.questionIndex === GAME_LENGTH - 1;

  const { correctAnswerText: answerTextOfAlreadyAskedQuestion } = sessionAttributes;
  return {
    isCorrect: isUserAnswerCorrect ? true : false,
    speak: `${buildResultsPrompt(responseMode, isUserAnswerCorrect, correctAnswerIndexOfAlreadyAskedQuestion, answerTextOfAlreadyAskedQuestion, userGaveUp)}${buildScorePrompt(newScore, isEndOfGame)}`,
    sessionAttributes: updatedSessionAttributes,
  };
}

const buildScorePrompt = (score, isEndOfGame = false) => {
  if (isEndOfGame) return `${interactions.t("FINAL_SCORE_MESSAGE", score.toString(), GAME_LENGTH.toString())}`;
  return `${interactions.t("SCORE_IS_MESSAGE", score.toString())}`;
}

const buildResultsPrompt = (responseMode, isUserAnswerCorrect, correctAnswerIndexOfAlreadyAskedQuestion, answerTextOfAlreadyAskedQuestion, userGaveUp = false) => {
  if (responseMode === SWIPE)
    return `Sorry but you swiped away ${correctAnswerIndexOfAlreadyAskedQuestion}: ${answerTextOfAlreadyAskedQuestion} which is the correct answer. `;

  let results = userGaveUp ? "" : interactions.t("ANSWER_IS_MESSAGE");
  if (isUserAnswerCorrect) {
    results += interactions.t("ANSWER_CORRECT_MESSAGE");
  }
  else {
    if (!userGaveUp) {
      results += interactions.t("ANSWER_WRONG_MESSAGE");
    }
    results = `${results}${interactions.t("CORRECT_ANSWER_MESSAGE", correctAnswerIndexOfAlreadyAskedQuestion, answerTextOfAlreadyAskedQuestion)}`;
  }

  return results;
}

module.exports = {
  ANSWER_COUNT: ANSWER_COUNT,
  determineNextQuestion: determineNextQuestion,
  determineResults: determineResults,
  fetchRandomGameQuestions: fetchRandomGameQuestions,
  GAME_LENGTH: GAME_LENGTH,
  GAME_WINNING_THRESHOLD_PERCENTAGE: GAME_WINNING_THRESHOLD_PERCENTAGE,
  randomizeAnswers: randomizeAnswers,
};
