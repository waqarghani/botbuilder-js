const { TestAdapter, TurnContext } = require('botbuilder');
const { DialogSet, ConfirmPrompt, ListStyle } =  require('../');
const assert = require('assert');

const beginMessage = { text: `begin`, type: 'message' };
const answerMessage = { text: `yes`, type: 'message' };
const invalidMessage = { text: `what?`, type: 'message' };

class TestContext extends TurnContext {
    constructor(request) {
        super(new TestAdapter(), request);
        this.sent = undefined;
        this.onSendActivities((context, activities, next) => {
            this.sent = activities;
            context.responded = true;
        });
    }
}

describe('prompts/ConfirmPrompt', function() {
    this.timeout(5000);

    it('should call ConfirmPrompt using dc.prompt().', function (done) {
        const dialogs = new DialogSet();
        dialogs.add('prompt', new ConfirmPrompt().choiceOptions({}).style(ListStyle.none));
        dialogs.add('a', [
            function (dc) {
                return dc.prompt('prompt', 'foo');
            },
            function (dc, result) {
                assert(result === true);
                done();
            }
        ]);

        const state = {};
        const context = new TestContext(beginMessage);
        const dc = dialogs.createContext(context, state);
        dc.begin('a').then(() => {
            const dc2 = dialogs.createContext(new TestContext(answerMessage), state);
            return dc2.continue();
        });
    });
    
    it('should call ConfirmPrompt with custom validator.', function (done) {
        const dialogs = new DialogSet();
        dialogs.add('prompt', new ConfirmPrompt((context, value) => {
            assert(context);
            return value;
        }).style(ListStyle.none));
        dialogs.add('a', [
            function (dc) {
                return dc.prompt('prompt', 'foo');
            },
            function (dc, result) {
                assert(result === true);
                done();
            }
        ]);

        const state = {};
        const context = new TestContext(beginMessage);
        const dc = dialogs.createContext(context, state);
        dc.begin('a').then(() => {
            const context2 = new TestContext(invalidMessage);
            const dc2 = dialogs.createContext(context2, state);
            return dc2.continue().then(() => {
                assert(context2.sent && context2.sent[0].text === 'foo');
                const dc3 = dialogs.createContext(new TestContext(answerMessage), state);
                return dc3.continue();
            });
        });
    });

    it('should send custom retryPrompt.', function (done) {
        const dialogs = new DialogSet();
        dialogs.add('prompt', new ConfirmPrompt((context, value) => {
            assert(context);
            return value;
        }).style(ListStyle.none));
        dialogs.add('a', [
            function (dc) {
                return dc.prompt('prompt', 'foo', { retryPrompt: 'bar' });
            },
            function (dc, result) {
                assert(result === true);
                done();
            }
        ]);

        const state = {};
        const context = new TestContext(beginMessage);
        const dc = dialogs.createContext(context, state);
        dc.begin('a').then(() => {
            const context2 = new TestContext(invalidMessage);
            const dc2 = dialogs.createContext(context2, state);
            return dc2.continue().then(() => {
                assert(context2.sent && context2.sent[0].text === 'bar');
                const dc3 = dialogs.createContext(new TestContext(answerMessage), state);
                return dc3.continue();
            });
        });
    });

    it('should send ignore retryPrompt if validator replies.', function (done) {
        const dialogs = new DialogSet();
        dialogs.add('prompt', new ConfirmPrompt((context, value) => {
            assert(context);
            if (value === undefined) {
                return context.sendActivity(`bad input`).then(() => undefined);
            }
            return value;
        }));
        dialogs.add('a', [
            function (dc) {
                return dc.prompt('prompt', 'foo', { retryPrompt: 'bar' });
            },
            function (dc, result) {
                assert(result === true);
                done();
            }
        ]);

        const state = {};
        const context = new TestContext(beginMessage);
        const dc = dialogs.createContext(context, state);
        dc.begin('a').then(() => {
            const context2 = new TestContext(invalidMessage);
            const dc2 = dialogs.createContext(context2, state);
            return dc2.continue().then(() => {
                assert(context2.sent && context2.sent[0].text === 'bad input');
                const dc3 = dialogs.createContext(new TestContext(answerMessage), state);
                return dc3.continue();
            });
        });
    });

    it('should not send any retryPrompt no prompt specified.', function (done) {
        const dialogs = new DialogSet();
        dialogs.add('prompt', new ConfirmPrompt((context, value) => {
            assert(context);
            return value;
        }));
        dialogs.add('a', [
            function (dc) {
                return dc.begin('prompt');
            },
            function (dc, result) {
                assert(result === true);
                done();
            }
        ]);

        const state = {};
        const context = new TestContext(beginMessage);
        const dc = dialogs.createContext(context, state);
        dc.begin('a').then(() => {
            const context2 = new TestContext(invalidMessage);
            const dc2 = dialogs.createContext(context2, state);
            return dc2.continue().then(() => {
                assert(!context2.sent);
                const dc3 = dialogs.createContext(new TestContext(answerMessage), state);
                return dc3.continue();
            });
        });
    });
});
