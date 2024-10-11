
import { StringTemplate, uuid as uuidv4, ServiceProvider, ChatHistory, ActionProps, Action, LLMUtil, LLMProviderBase, language, Command, environment, CoreDataChatHistory } from "@enconvo/api";
import { BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { fixSpellingGrammarPrompt } from "./prompts.ts";


const chatHistory = new CoreDataChatHistory();

export default async function main(req: Request) {
    const { options } = await req.json();
    const { text, context, reset } = options;

    let message = text || context;


    if (!message) {
        throw new Error("No text to be processed")
    }

    const requestId = uuidv4()


    const promptMessage = fixSpellingGrammarPrompt

    const template = new StringTemplate(promptMessage)

    reset && chatHistory.reset();
    const historyMessages = await chatHistory.getMessages()

    let messages: BaseMessage[] = [];
    const hasMessages = historyMessages.length > 0

    if (hasMessages) {
        messages = [
            new SystemMessage(`Your are a bot named ${environment.commandTitle}, your prompt is "${promptMessage}",please respond based on the user's latest input. `),
            ...historyMessages,
            new HumanMessage(message)
        ]

    } else {

        const promptMessage = template.format({
            text: message,
        });
        messages = [new SystemMessage(promptMessage)];
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
        content: result,
        actions: actions
    }

    Command.setDefaultCommandKey(`${environment.extensionName}|${environment.commandName}`).then()

    return output;
}

