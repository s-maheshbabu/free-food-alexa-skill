const { determineNextQuestion, determineResults, GAME_LENGTH, GAME_WINNING_THRESHOLD_PERCENTAGE } = require("gameManager");
const APLManager = require("APLManager");

const interactions = require("interactions");

const { NEXT_QUESTION_AUTO_GENERATED_EVENT } = require("constants/APL");

module.exports = UserEventHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'Alexa.Presentation.APL.UserEvent'
    },
    handle(handlerInput) {
        const { responseBuilder } = handlerInput;

        // Take argument sent from the button to speak back to the user
        if (handlerInput.requestEnvelope.request.arguments[0] === NEXT_QUESTION_AUTO_GENERATED_EVENT) {
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
        }

        const sessionAttributes = handlerInput.requestEnvelope.request.arguments[1];
        const userAnswerIndex = handlerInput.requestEnvelope.request.arguments[0].index;

        return deliverResults(handlerInput, sessionAttributes, userAnswerIndex);
    },
    tempExport(handlerInput, sessionAttributes, userAnswerIndex) {
        return deliverResults(handlerInput, sessionAttributes, userAnswerIndex);
    }
}

const deliverResults = (handlerInput, sessionAttributes, userAnswerIndex) => {
    const results = determineResults(sessionAttributes, userAnswerIndex);
    const directives = APLManager.getResultsViewDirective(results.isCorrect, results.sessionAttributes);

    const { responseBuilder } = handlerInput;
    // Check if we can exit the game session after GAME_LENGTH questions (zero-indexed)
    if (results.sessionAttributes.questionIndex === GAME_LENGTH - 1) {
        return endGame(responseBuilder, results.sessionAttributes, results, directives);
    }

    handlerInput.attributesManager.setSessionAttributes(results.sessionAttributes);

    const c = results.speak;
    return responseBuilder
        .addDirective(directives[0]).addDirective(directives[1])
        .speak(results.speak)
        .withShouldEndSession(false)
        .getResponse();
}

const endGame = (responseBuilder, sessionAttributes, results, directives) => {
    const { score: newScore } = sessionAttributes;
    const isGameWon = newScore / GAME_LENGTH >= GAME_WINNING_THRESHOLD_PERCENTAGE;
    const speechOutput = `${results.speak}${isGameWon ? interactions.t("GAME_WON_MESSAGE") : interactions.t("GAME_LOST_MESSAGE")}`;

    return responseBuilder
        .speak(speechOutput)
        .addDirective(directives[0])
        .getResponse();
}