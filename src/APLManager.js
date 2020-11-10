const APL = require("constants/APL");
const { GAME_LENGTH } = require("gameManager");

const resultsDataSource = require("apl/data/ResultsDatasource");
const resultsDocument = require("apl/document/ResultsDocument");

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

const getResultsViewDirective = (isCorrect, sessionAttributes) => {
    // TODO Validate inputs
    // TODO ask-sdk-test currently has no provision to test Alexa.Presentation.APL.ExecuteCommands. Report bug.
    return [{
        type: APL.APL_DOCUMENT_TYPE,
        version: APL.APL_DOCUMENT_VERSION,
        token: APL.RESULTS_VIEW_TOKEN,
        document: resultsDocument,
        datasources: {
            resultsDataSource: resultsDataSource(
                isCorrect,
                sessionAttributes.questionIndex + 1,
                111,
                sessionAttributes.score,
                222,
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
    getResultsViewDirective: getResultsViewDirective,
    getQuestionAndAnswersViewDirective: getQuestionAndAnswersViewDirective,
};