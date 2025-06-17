import { StringTemplate, Action, RequestOptions, LLMProvider, BaseChatMessage, UserMessage, ResponseAction, Response, res, SystemMessage, environment, ChatMessageContent } from "@enconvo/api";
import { getDiffHtml } from "./diff_util.ts";
import { aiEditPrompt } from "./ai_edit_prompts.ts";


let message: string = ""
export default async function main(req: Request) {
    const options: RequestOptions = await req.json();
    let { post_action, input_text, selection_text, context, history_messages: historyMessages, highlight_edits } = options;

    if (selection_text && selection_text.length > 0) {
        message = selection_text;
    }



    if (!message) {
        throw new Error("No text to be processed")
    }

    let promptMessage = aiEditPrompt

    const template = new StringTemplate(promptMessage)
    promptMessage = template.format({
        instruction: input_text,
        selection_text: message,
        history_messages: historyMessages?.map(item => {
            return (item.content as ChatMessageContent[]).map((content: ChatMessageContent) => {
                if (content.type === 'text') {
                    return content.text
                }
                return JSON.stringify(content)
            }).join('')
        }).join('\n') || ''
    })

    console.log("promptMessage", promptMessage)
    let messages: BaseChatMessage[] = [new UserMessage(promptMessage)];

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

    return Response.messages([resultMessage], actions);
}