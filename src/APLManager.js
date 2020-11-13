const APL = require("constants/APL");
const { GAME_LENGTH } = require("gameManager");

const questionResultsDataSource = require("apl/data/QuestionResultsDatasource");
const questionResultsDocument = require("apl/document/QuestionResultsDocument");

const gameResultsDataSource = require("apl/data/GameResultsDatasource");
const gameResultsDocument = require("apl/document/GameResultsDocument");

const questionAndAnswersDataSource = require("apl/data/QuestionAndAnswersDatasource");
const questionAndAnswersDocument = require("apl/document/QuestionAndAnswersDocument");

const getQuestionAndAnswersViewDirective = (question, answers, sessionAttributes) => {
    // TODO Validate inputs
    const answerMetadata = [];
    for (var index = 0; index < answers.length; index++) {
        const answerMetadatum = {
            index: index + 1,
            type: APL.USER_INITIATED_CLICK_EVENT,
            answerText: answers[index],
        }
        answerMetadata.push(answerMetadatum);
    }

    const data = {
        answers: answerMetadata,
        question: question,
        sessionAttributes: sessionAttributes,
    };

    return {
        type: APL.APL_DOCUMENT_TYPE,
        version: APL.APL_DOCUMENT_VERSION,
        document: questionAndAnswersDocument,
        datasources: { questionAndAnswersDataSource: questionAndAnswersDataSource(data), },
    }
}

/**
 * Returns APL directives to be rendered at the end of the game declaring the game results.
 */
const getGameResultsViewDirectives = (isWon, sessionAttributes) => {
    const { incorrectAnswers, score, skippedAnswers } = sessionAttributes;
    return [{
        type: APL.APL_DOCUMENT_TYPE,
        version: APL.APL_DOCUMENT_VERSION,
        document: gameResultsDocument,
        datasources: {
            gameResultsDataSource: gameResultsDataSource(
                isWon,
                incorrectAnswers,
                score,
                skippedAnswers,
                GAME_LENGTH,
            ),
        },
    },];
}

/**
 * Returns APL directives to be rendered after the user answers a question. 
 */
const getResultsViewDirective = (isCorrect, sessionAttributes) => {
    // TODO Validate inputs
    // TODO ask-sdk-test currently has no provision to test Alexa.Presentation.APL.ExecuteCommands. Report bug.    
    const { incorrectAnswers, score, skippedAnswers } = sessionAttributes;
    return [{
        type: APL.APL_DOCUMENT_TYPE,
        version: APL.APL_DOCUMENT_VERSION,
        token: APL.RESULTS_VIEW_TOKEN,
        document: questionResultsDocument,
        datasources: {
            questionResultsDataSource: questionResultsDataSource(
                isCorrect,
                sessionAttributes.questionIndex + 1,
                incorrectAnswers,
                score,
                skippedAnswers,
                GAME_LENGTH,
            ),
        },
    },
    {
        type: APL.APL_COMMANDS_TYPE,
        token: APL.RESULTS_VIEW_TOKEN,
        commands: [{
            type: "SendEvent",
            arguments: [
                APL.NEXT_QUESTION_AUTO_GENERATED_EVENT,
                sessionAttributes,
            ]
        }],
    }]
}

module.exports = {
    getGameResultsViewDirectives: getGameResultsViewDirectives,
    getResultsViewDirective: getResultsViewDirective,
    getQuestionAndAnswersViewDirective: getQuestionAndAnswersViewDirective,
};