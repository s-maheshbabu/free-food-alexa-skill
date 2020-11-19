const AlexaTest = require('ask-sdk-test').AlexaTest;
const AplUserEventRequestBuilder = require('ask-sdk-test').AplUserEventRequestBuilder;

const deepEqual = require('deep-equal');

const {
    NEW_GAME_USER_GENERATED_EVENT,
    RESULTS_VIEW_TOKEN, } = require("../../src/constants/APL");

const skillHandler = require("../../src/index").handler;
const skillSettings = {
    appId: 'amzn1.ask.skill.00000000-0000-0000-0000-000000000000',
    userId: 'amzn1.ask.account.VOID',
    deviceId: 'amzn1.ask.device.VOID',
    locale: 'en-US',
    debug: true,
};
const alexaTest = new AlexaTest(skillHandler, skillSettings);

const launchGameAudioDocument = require("../../src/responses/LaunchGame/document");

describe("Start new game", () => {
    describe('should be able to start a new game when user clicks on the button to start a new game', () => {
        alexaTest.test(
            [
                {
                    request: new AplUserEventRequestBuilder(skillSettings)
                        .withInterfaces({ apl: true })
                        .withToken(RESULTS_VIEW_TOKEN)
                        .withArguments(NEW_GAME_USER_GENERATED_EVENT).build(),
                    get renderDocument() {
                        return {
                            document: (doc) => {
                                return deepEqual(doc, launchGameAudioDocument);
                            },
                            hasDataSources: (ds) => {
                                return verifyLaunchGameAudioDatasource(ds, welcomeSpeech);
                            },
                        }
                    },
                    reprompts: 'Welcome to Smarty Pants. Choose a category to play. ANIMALS, GENERAL, SCIENCE, SUSTAINABILITY or TECHNOLOGY?',
                    shouldEndSession: false,
                    ignoreQuestionCheck: true,
                }
            ]
        );
    });
});

/**
 * Validate that the APL-A datasource backing the game launch is correctly populated.
 * 
 * @param datasource The APL-A data source to be validated.
 */
function verifyLaunchGameAudioDatasource(datasource, speech) {
    console.log(datasource)
    expect(datasource.speech).to.equal(speech);
    return true;
}