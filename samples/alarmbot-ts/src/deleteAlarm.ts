import { renderAlarms } from './showAlarms';

export function begin(context: BotContext): Promise<void> {
    // Delete any existing topic
    if (context.state.conversation.topic) {
        delete context.state.conversation.topic;
    }

    // Render list of topics to user
    const count = renderAlarms(context);
    if (count > 0) {
        // Set topic and prompt user for alarm to delete.
        context.state.conversation.topic = 'deleteAlarm';
        context.reply(`Which alarm would you like to delete?`);
    }
    return Promise.resolve();
}

export function routeReply(context: BotContext): Promise<void> {
    // Validate users reply and delete alarm
    let deleted = false;
    const title = context.request.text.trim();
    const list = context.state.user.alarms || [];
    for (let i = 0; i < list.length; i++) {
        if (list[i].title.toLowerCase() === title.toLowerCase()) {
            list.splice(i, 1);
            deleted = true;
            break;
        }
    }

    // Notify user of deletion or re-prompt
    if (deleted) {
        context.reply(`Deleted the "${title}" alarm.`);
        delete context.state.conversation.topic;
    } else {
        context.reply(`An alarm named "${title}" doesn't exist. Which alarm would you like to delete? Say "cancel" to quit.`)
    }

    return Promise.resolve();
}
