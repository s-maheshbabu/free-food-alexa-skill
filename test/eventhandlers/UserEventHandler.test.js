const AlexaTest = require('ask-sdk-test').AlexaTest;
const AplUserEventRequestBuilder = require('ask-sdk-test').AplUserEventRequestBuilder;

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

describe("Start new game", () => {
    describe('should be able to start a new game when user clicks on the button to start a new game', () => {
        alexaTest.test(
            [
                {
                    request: new AplUserEventRequestBuilder(skillSettings)
                        .withInterfaces({ apl: true })
                        .withToken(RESULTS_VIEW_TOKEN)
                        .withArguments(NEW_GAME_USER_GENERATED_EVENT).build(),
                    says: 'Welcome to Smarty Pants. Choose a category to play. ANIMALS, GENERAL, SCIENCE, SUSTAINABILITY or TECHNOLOGY?',
                    reprompts: 'Welcome to Smarty Pants. Choose a category to play. ANIMALS, GENERAL, SCIENCE, SUSTAINABILITY or TECHNOLOGY?',
                    shouldEndSession: false,
                    ignoreQuestionCheck: true,
                }
            ]
        );
    });
});