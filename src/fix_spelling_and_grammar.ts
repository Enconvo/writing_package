import { Clipboard, StringTemplate, Action, RequestOptions, LLMProvider, BaseChatMessage, UserMessage, ResponseAction, Response, res, SystemMessage, environment, EnconvoResponse, showHUD, SmartBar } from "@enconvo/api";
import { fixSpellingGrammarPrompt } from "./prompts.ts";
import { getDiffHtml } from "./diff_util.ts";


export default async function main(req: Request) {
    const options: RequestOptions = await req.json();
    let { post_action, input_text, selection_text, context, clean_result, history_messages: historyMessages, highlight_edits } = options;

    let message = input_text || context || selection_text;

    if (!message) {
        throw new Error("No text to be processed")
    }


    let promptMessage = fixSpellingGrammarPrompt

    const template = new StringTemplate(promptMessage)
    promptMessage = await template.autoFormat(options)

    let messages: BaseChatMessage[] = [];
    messages = [new UserMessage(promptMessage)];

    historyMessages = historyMessages || []
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
    const resultMessage = await llmProvider.stream({ messages });

    const originalText = message
    const fixedText = resultMessage.text()
    console.log("fixedText", fixedText)

    let correctText = fixedText

    if (Array.isArray(resultMessage.content) && highlight_edits === true) {
        resultMessage.content = resultMessage.content.map(item => {
            if (item.type === 'text') {
                const diffText = getDiffHtml(originalText, fixedText);
                return {
                    id: item.id,
                    type: 'text',
                    text: diffText
                }
            }
            return item
        })
    }

    const actions: ResponseAction[] = [
        Action.Paste({ content: correctText }),
        Action.InsertBelow({ content: correctText }),
        Action.Copy({ content: correctText })
    ]

    res.handlePostAction(correctText, post_action)
    const modifierFlagsResult = res.handleModifierFlags({ options, text: correctText })



    return Response.messages([resultMessage], actions);
}

