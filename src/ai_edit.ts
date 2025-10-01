import { StringTemplate, Action, RequestOptions, LLMProvider, BaseChatMessage, UserMessage, ResponseAction, Response, res, ChatMessageContent } from "@enconvo/api";
import { getDiffHtml } from "./diff_util.ts";
import { aiEditPrompt } from "./ai_edit_prompts.ts";


interface AiEditOptions extends RequestOptions {
    prompt?: string;
    highlight_edits: boolean;
}

let inputText: string = ""
export default async function main(req: Request) {
    const options: AiEditOptions = await req.json();
    let { post_action, input_text, selection_text, history_messages: historyMessages, highlight_edits } = options;
    console.log("options", options)
    let instruction: string = ''

    if (historyMessages && historyMessages.length === 0) {
        inputText = ''
    }

    if (options.prompt && options.prompt.length > 0) {
        if (selection_text && selection_text.length > 0) {
            instruction = `${options.prompt}\n\nAdditional Instruction: ${input_text}`
            inputText = selection_text
        } else {
            if (historyMessages && historyMessages.length > 0) {
                instruction = `${options.prompt}\n\nAdditional Instruction: ${input_text}`
            } else {
                instruction = options.prompt
                inputText = input_text || ''
            }
        }
    } else {
        if (selection_text && selection_text.length > 0) {
            inputText = selection_text;
        }
        instruction = input_text || ''
    }



    let promptMessage = aiEditPrompt

    const template = new StringTemplate(promptMessage)
    promptMessage = template.format({
        instruction: instruction,
        selection_text: inputText,
        history_messages: historyMessages?.map(item => {
            const content = (item.content as ChatMessageContent[]).map((content: ChatMessageContent) => {
                if (content.type === 'text') {
                    return content.text
                }
                return JSON.stringify(content)
            }).join('')
            return `${item.role}: ${content}`
        }).join('\n') || ''
    })

    console.log("promptMessage", promptMessage)
    let messages: BaseChatMessage[] = [new UserMessage(promptMessage)];

    const llmProvider = await LLMProvider.fromEnv()
    const resultMessage = await llmProvider.stream({ messages });

    const originalText = inputText
    const fixedText = resultMessage.text
    console.log("fixedText", fixedText)
    let correctText = fixedText



    if (Array.isArray(resultMessage.content) && highlight_edits === true && originalText.length > 0) {
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

    inputText = fixedText

    const actions: ResponseAction[] = [
        Action.Paste({ content: correctText }),
        Action.InsertBelow({ content: correctText }),
        Action.Copy({ content: correctText })
    ]

    res.handlePostAction(correctText, post_action)

    const modifierFlagsResult = res.handleModifierFlags({ options, text: correctText })

    return Response.messages([resultMessage], actions);
}