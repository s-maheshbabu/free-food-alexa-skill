const questionBank = require("./questionBank");
const interactions = require("./interactions");

const ANSWER_COUNT = 4;
const GAME_LENGTH = 5;

const quesionDataSource = require("./apl/data/QuestionDatasource");
const quesionDocument = require("./apl/document/QuestionDocument");

module.exports = {
  populateGameQuestions: function (translatedQuestions) {
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
  },

  populateRoundAnswers: function (
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
  },

  isAnswerSlotValid: function (intent) {
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
  },

  handleUserGuess_ForEvent: function (usersAnswer, handlerInput) {
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
    const roundAnswers = module.exports.populateRoundAnswers(
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
  },

  handleUserGuess: function (userGaveUp, handlerInput) {
    const {
      requestEnvelope,
      attributesManager,
      responseBuilder
    } = handlerInput;
    const { intent } = requestEnvelope.request;

    const answerSlotValid = module.exports.isAnswerSlotValid(intent);

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

    const translatedQuestions = questionBank.getQuestions(
      sessionAttributes.category,
      handlerInput.requestEnvelope.request.locale
    );

    if (
      answerSlotValid &&
      parseInt(intent.slots.Answer.value, 10) ===
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
        correctAnswerIndex,
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
    correctAnswerIndex = Math.floor(Math.random() * ANSWER_COUNT);
    const spokenQuestion = Object.keys(
      translatedQuestions[gameQuestions[currentQuestionIndex]]
    )[0];
    const roundAnswers = module.exports.populateRoundAnswers(
      gameQuestions,
      currentQuestionIndex,
      correctAnswerIndex,
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
      correctAnswerIndex: correctAnswerIndex + 1,
      questions: gameQuestions,
      score: currentScore,
      correctAnswerText:
        translatedQuestion[Object.keys(translatedQuestion)[0]][0]
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

    return responseBuilder
      .speak(speechOutput)
      .reprompt(repromptText)
      .withSimpleCard(interactions.t("GAME_NAME"), repromptText)
      // Add this to render APL document
      .addDirective({
        type: 'Alexa.Presentation.APL.RenderDocument',
        version: '1.0',
        token: "answertoken",
        document: quesionDocument, // Import button APL document
        datasources: quesionDataSource(roundAnswers, correctAnswerIndex)
      }).addDirective({
        type: 'Alexa.Presentation.APL.ExecuteCommands',
        token: "answertoken",
        commands: [sendEventCommand]
      })
      .getResponse();
  },

  startGame: function (newGame, handlerInput) {
    let speechOutput = newGame
      ? interactions.t("WELCOME_MESSAGE", GAME_LENGTH.toString())
      : "";

    const { requestEnvelope } = handlerInput;
    const { intent } = requestEnvelope.request;

    const category =
      intent.slots.game_category.resolutions.resolutionsPerAuthority[0]
        .values[0].value.id;

    const translatedQuestions = questionBank.getQuestions(
      category,
      handlerInput.requestEnvelope.request.locale
    );

    const gameQuestions = module.exports.populateGameQuestions(
      translatedQuestions
    );
    const correctAnswerTargetIndex = Math.floor(Math.random() * ANSWER_COUNT);

    const roundAnswers = module.exports.populateRoundAnswers(
      gameQuestions,
      0,
      correctAnswerTargetIndex,
      translatedQuestions
    );
    const currentQuestionIndex = 0;
    const spokenQuestion = Object.keys(
      translatedQuestions[gameQuestions[currentQuestionIndex]]
    )[0];

    let repromptText = interactions.t(
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
      correctAnswerIndex: correctAnswerTargetIndex + 1,
      questions: gameQuestions,
      category: category,
      score: 0,
      correctAnswerText:
        translatedQuestion[Object.keys(translatedQuestion)[0]][0]
    });

    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(repromptText)
      .withSimpleCard(interactions.t("GAME_NAME"), repromptText)
      // Add this to render APL document
      .addDirective({
        type: 'Alexa.Presentation.APL.RenderDocument',
        version: '1.0',
        document: quesionDocument, // Import button APL document
        datasources: quesionDataSource(roundAnswers, correctAnswerTargetIndex)
      })
      .getResponse();
  }
};
