import { StringTemplate, Action, Command, environment, RequestOptions, LLMProvider, BaseChatMessage, SystemMessage, UserMessage, ResponseAction } from "@enconvo/api";
import { fixSpellingGrammarPrompt } from "./prompts.ts";


export default async function main(req: Request) {
    const options: RequestOptions = await req.json();
    const { input_text, selection_text, context, clean_result, history_messages: historyMessages } = options;

    let message = input_text || context || selection_text;

    if (!message) {
        throw new Error("No text to be processed")
    }


    let promptMessage = fixSpellingGrammarPrompt

    const template = new StringTemplate(promptMessage)
    promptMessage = await template.autoFormat(options)

    let messages: BaseChatMessage[] = [];
    const hasMessages = historyMessages.length > 0

    if (hasMessages) {
        messages = [
            new SystemMessage(`Your are a bot named ${environment.commandTitle}, your prompt is "${fixSpellingGrammarPrompt}",please respond based on the user's latest input. `),
            ...historyMessages,
            new UserMessage(message)
        ]

    } else {
        messages = [new UserMessage(promptMessage)];
    }

    const llmProvider = await LLMProvider.fromEnv()
    const resultMessage = await llmProvider.stream({
        messages,
        autoHandle: true
    })

    const result = resultMessage.text()

    let correctText = result

    const lines = result.split("\n")
    if (lines.length > 0) {
        correctText = lines[0] || ''
        correctText = correctText.trim().replace(/^['"]/, '').replace(/['"]$/, '')
        correctText = correctText.replace(/^\*\*/, '').replace(/\*\*$/, '')
    }

    const actions: ResponseAction[] = [
        Action.Paste({ content: correctText }),
        Action.InsertBelow({ content: correctText }),
        Action.Copy({ content: correctText })
    ]

    const output = {
        content: clean_result === true ? correctText : result,
        actions: actions
    }

    Command.setDefaultCommandKey(`${environment.extensionName}|${environment.commandName}`).then()

    return output;
}