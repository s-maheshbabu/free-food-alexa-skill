const { determineNextQuestion, determineResults, GAME_LENGTH, GAME_WINNING_THRESHOLD_PERCENTAGE } = require("gameManager");
const APLManager = require("APLManager");

const interactions = require("interactions");

const { NEXT_QUESTION_USER_GENERATED_EVENT,
    NEXT_QUESTION_AUTO_GENERATED_EVENT,
    NEW_GAME_USER_GENERATED_EVENT, } = require("constants/APL");

const startNewGame = require("requesthandlers/LaunchRequestHandler").handle;

module.exports = UserEventHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'Alexa.Presentation.APL.UserEvent'
    },
    handle(handlerInput) {
        const { responseBuilder } = handlerInput;

        if (handlerInput.requestEnvelope.request.arguments[0] === NEXT_QUESTION_AUTO_GENERATED_EVENT ||
            handlerInput.requestEnvelope.request.arguments[0] === NEXT_QUESTION_USER_GENERATED_EVENT) {
            const sessionAttributes = handlerInput.requestEnvelope.request.arguments[1];
            const nextQuestionInfo = determineNextQuestion(sessionAttributes, handlerInput.requestEnvelope.request.locale);

            updatedSessionAttributes = nextQuestionInfo.sessionAttributes;
            handlerInput.attributesManager.setSessionAttributes(updatedSessionAttributes);

            const directive = APLManager.getQuestionAndAnswersViewDirective(nextQuestionInfo.questionText, nextQuestionInfo.randomizedAnswers, nextQuestionInfo.sessionAttributes);

            return responseBuilder
                .speak(nextQuestionInfo.speak)
                .reprompt(nextQuestionInfo.reprompt)
                .addDirective(directive)
                .withSimpleCard(interactions.t("GAME_NAME"), nextQuestionInfo.speak)
                .getResponse();
        } else if (handlerInput.requestEnvelope.request.arguments[0] === NEW_GAME_USER_GENERATED_EVENT) {
            return startNewGame(handlerInput);
        }

        const sessionAttributes = handlerInput.requestEnvelope.request.arguments[1];
        const userAnswerIndex = handlerInput.requestEnvelope.request.arguments[0].index;

        return deliverResults(handlerInput, sessionAttributes, userAnswerIndex);
    },
    deliverResults(handlerInput, sessionAttributes, userAnswerIndex, userGaveUp) {
        return deliverResults(handlerInput, sessionAttributes, userAnswerIndex, userGaveUp);
    }
}

const deliverResults = (handlerInput, sessionAttributes, userAnswerIndex, userGaveUp = false) => {
    const results = determineResults(sessionAttributes, userAnswerIndex, userGaveUp);

    const { responseBuilder } = handlerInput;
    // Check if we can exit the game session after GAME_LENGTH questions (zero-indexed)
    if (results.sessionAttributes.questionIndex === GAME_LENGTH - 1) {
        return endGame(responseBuilder, results.sessionAttributes, results);
    }

    handlerInput.attributesManager.setSessionAttributes(results.sessionAttributes);

    const directives = APLManager.getResultsViewDirective(results.isCorrect, results.sessionAttributes);
    return responseBuilder
        .addDirective(directives[0]).addDirective(directives[1])
        .speak(results.speak)
        .withShouldEndSession(undefined)
        .getResponse();
}

const endGame = (responseBuilder, sessionAttributes, results) => {
    const { score: newScore } = sessionAttributes;
    const isGameWon = newScore / GAME_LENGTH >= GAME_WINNING_THRESHOLD_PERCENTAGE;
    const speechOutput = `${results.speak}${isGameWon ? interactions.t("GAME_WON_MESSAGE") : interactions.t("GAME_LOST_MESSAGE")}`;

    const directives = APLManager.getGameResultsViewDirectives(isGameWon, sessionAttributes);
    return responseBuilder
        .speak(speechOutput)
        .addDirective(directives[0])
        .getResponse();
}