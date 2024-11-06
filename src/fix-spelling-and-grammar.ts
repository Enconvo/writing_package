
import { StringTemplate, uuid as uuidv4, ServiceProvider, ChatHistory, ActionProps, Action, LLMUtil, LLMProviderBase, Command, environment, CoreDataChatHistory } from "@enconvo/api";
import { BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { fixSpellingGrammarPrompt } from "./prompts.ts";


const chatHistory = new CoreDataChatHistory();

export default async function main(req: Request) {
    const { options } = await req.json();
    const { input_text,selection_text ,context, reset, clean_result } = options;

    let message = input_text || context || selection_text;


    if (!message) {
        throw new Error("No text to be processed")
    }

    const requestId = uuidv4()

    let promptMessage = fixSpellingGrammarPrompt

    const template = new StringTemplate(promptMessage)
    promptMessage = await template.autoFormat(options)

    reset && chatHistory.reset();
    const historyMessages = await chatHistory.getMessages()

    let messages: BaseMessage[] = [];
    const hasMessages = historyMessages.length > 0

    if (hasMessages) {
        messages = [
            new SystemMessage(`Your are a bot named ${environment.commandTitle}, your prompt is "${fixSpellingGrammarPrompt}",please respond based on the user's latest input. `),
            ...historyMessages,
            new HumanMessage(message)
        ]

    } else {

        messages = [new HumanMessage(promptMessage)];
    }


    let chat: LLMProviderBase = ServiceProvider.load(options.llm)
    const stream = (await chat.call({ messages })).stream!
    const result = await LLMUtil.invokeLLMStream(stream, options)


    let correctText = result
    // 取第一行
    const lines = result.split("\n")

    if (lines.length > 0) {
        correctText = lines[0] || ''
        // 去掉两头的空格，引号
        correctText = correctText.trim().replace(/^['"]/, '').replace(/['"]$/, '')
        // 去掉两头的 **
        correctText = correctText.replace(/^\*\*/, '').replace(/\*\*$/, '')
    }

    console.log("result", hasMessages, correctText)


    await ChatHistory.saveChatMessages({
        input: message,
        output: result,
        llmOptions: options.llm,
        requestId
    });

    const actions: ActionProps[] = [
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

