import express from "express";
import bodyParser from "body-parser";
import OpenAI from "openai";
import dotenv from "dotenv";
import CORS from "cors";
import {
  getCryptoPrice,
  getCryptoCurrencyMap,
  getTopNCrypto,
} from "./api/api_coin_market.js";
import { toolsBot } from "./api/chat_gpt.js";
import * as nodemailer from "nodemailer";
// Initialize environment variables
dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(CORS());

const NewlineText = (props) => {
  const text = props;
  return text
    .split("\n")
    .map((str) => `<p>${str}</p>`)
    .join("");
};

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.API_KEY_OPEN_AI,
});

const transporter = nodemailer.createTransport({
  service: "Gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  ignoreTLS: false,
  secure: true,
  auth: {
    user: process.env.EMAIL_SMTP_USERNAME,
    pass: process.env.EMAIL_SMTP_PASS,
  },
});

app.get("/", (req, res) => {
  res.send("Welcome to Custom ChatGPT...!");
});

app.get("/list/crypto/:symbol", async (req, res) => {
  const symbol = req.params.symbol.toLowerCase(); // Get the symbol from the URL and convert it to uppercase (e.g., 'BTC')

  try {
    const response = await getCryptoCurrencyMap(symbol);

    const cryptoData = response?.data ?? null;

    res.json({
      data: cryptoData,
    });
  } catch (error) {
    console.error("Error fetching cryptocurrency price:", error.data);
    res.status(500).json({
      error: "Failed to fetch cryptocurrency price",
    });
  }
});

app.get("/price/:slug", async (req, res) => {
  const cryptoSlug = req.params.slug.toLowerCase(); // Get the symbol from the URL and convert it to uppercase (e.g., 'BTC')

  try {
    const response = await getCryptoPrice(cryptoSlug, cryptoSlug);

    const cryptoData = response?.data?.data ?? null;

    res.json({
      data: cryptoData,
    });
  } catch (error) {
    console.error("Error fetching cryptocurrency price:", error.data);
    res.status(500).json({
      error: "Failed to fetch cryptocurrency price",
    });
  }
});

app.get("/top/crypto", async (req, res) => {
  try {
    const response = await getTopNCrypto(200);

    const cryptoData = response?.data?.data ?? null;

    res.json({
      count: cryptoData.length ?? 0,
      data: cryptoData,
    });
  } catch (error) {
    console.error("Error fetching cryptocurrency price:", error);
    res.status(500).json({
      error: "Failed to fetch cryptocurrency price",
    });
  }
});

app.get("/ping-mail", async (req, res) => {
  try {
    let textResponse = "Hai From API";
    const slug = "TRIAL";
    const sent_email = "johanandreas74@gmail.com";

    let message = {
      from: process.env.EMAIL_SMTP_USERNAME, // sender address
      to: sent_email, // list of receivers
      subject: `Info Price of ${slug}`, // Subject line
      html: `<p>${textResponse}</p>`, // html body
    };
    transporter.sendMail(message, function (err, info) {
      if (err) {
        return res.send({ err: err, message: "Failed" });
      }
      return res.send({ message: "Succesfully sent email!" });
    });
  } catch (error) {
    console.error("", error.data);
    res.status(500).json({
      error: "Failed to email",
      trace: error.stack,
    });
  }
});
async function getAsyncTask() {}
app.post("/chat", async (req, res) => {
  const { messageContent } = req.body;

  try {
    const tools = toolsBot;
    // const tryMessage = `
    //         You are specializing in cryptocurrency and chatbots.
    //         You can answer questions about general knowledge such as basic facts, or other common information that does not require deep subject knowledge,
    //         You are not allowed to answer questions outside of these topics, such as games, entertainment, or unrelated general knowledge.
    //         If the user asks a question outside of cryptocurrency or chatbot-related topics, politely inform them that you only provide assistance in your area of expertise.`;
    let messagesAi = [
      {
        role: "system",
        content: `
          You are helpfull assistant.
          You don't need to approach question first.
          You are specialized in crypto. 
          Please focus on answering crypto-related questions and Chat Bot questions. 
          If asked about non-crypto topics, you can respond briefly with a simple acknowledgment or a one-word answer.
          If the request is unclear, ask the user for clarification.`,
      },
      { role: "user", content: messageContent },
    ];
    const completion = await openai.chat.completions.create({
      temperature: 0.4,
      messages: messagesAi,
      tools: tools,
      model: "gpt-4o",
    });

    let results = {};
    let dataString = "";
    let findInTopN = "";
    let n = 10;
    let slug = "";
    let symbol = "";
    let symbolInRanksSearch = "";
    let isSentMail = false;
    let sent_email = "";
    console.log(completion.choices,'choices');
    console.log(completion.choices[0].message.tool_calls, "completion");

    if (completion.choices[0].finish_reason === "tool_calls") {
      const promises = completion.choices[0].message.tool_calls.map(
        async (tool_call) => {
          const toolCall = tool_call;
          const arguments_ = JSON.parse(toolCall.function.arguments);
          if (tool_call.function.name == "get_latest_price") {
            slug = arguments_.slug;
            sent_email = arguments_.sent_email;
            symbol = arguments_.symbol;
            console.log(slug, sent_email, "extracted_arguments");
            isSentMail =
              sent_email != false ||
              sent_email != "" ||
              sent_email !== undefined ||
              sent_email !== null;
            const response = await getCryptoPrice("", slug);
            //maybe bad performance, should use JSON stream
            dataString = JSON.stringify(response?.data?.data ?? []);

            results.latest_price = response?.data?.data ?? [];
            results.price_symbol = symbol;
          } else if (tool_call.function.name == "get_top_cryptocurrency") {
            n = arguments_.n;
            findInTopN = arguments_.slug;
            const response = await getTopNCrypto(n);
            // dataString = JSON.stringify(response?.data?.data ?? []);
            results.top_currencies = response?.data?.data ?? [];
            results.i_want_find_symbol_in_rank = symbol;
          }
        }
      );

      await Promise.all(promises);
      console.log(results.latest_price, "result loop");
      let prompt = `You are a helpful assistant. 
                  Please explain the latest price the following JSON data about cryptocurrency in a simple without saying JSON Data and affirmative word like 'Sure', 'Okay', etc.`;
      if (results.top_currencies) {
        prompt += `explain the ranks, price, market cap, and description brief.`;
      } else if (results.latest_price && results.top_currencies) {
        /**
         * filter this
         */

        const find = results.top_currencies.find((x) => {
          x.slug === slug;
        });

        results.top_currencies = find;

        prompt += `I have a JSON 'top_currencies' of cryptocurrencies. 
        When I provide a cryptocurrency name or slug, please do the following:
          explain the price if im asking, including its rank, price, market cap, and a brief description`;
      }

      dataString = JSON.stringify(results);
      prompt += `You must explain in non-technical way.`;

      prompt += dataString;
      
      // console.log(prompt);
      /**
       * old completions API
       */
      // messagesAi.push({
      //   role: "user",
      //   content: dataString,
      // });
      console.log(prompt, "messageAI");
      const finalChat = await openai.completions.create({
        // messages: messagesAi,
        prompt: `${prompt}`,
        model: "gpt-4o",
      });

      let textResponse = finalChat.choices[0].text;
      // console.log(sent_email, typeof sent_email, "sent_email");

      if (isSentMail) {
        console.log("trying to send email...");
        let message = {
          from: process.env.EMAIL_SMTP_USERNAME, // sender address
          to: sent_email, // list of receivers
          subject: `Info Price of ${slug}`, // Subject line
          html: NewlineText(textResponse), // html body
        };

        return transporter
          .sendMail(message)
          .then((info) => {
            return res.status(200).json({
              msg: "Email sent",
              text: `Successfully sent email to ${sent_email}, please check your email!`,
            });
          })
          .catch((err) => {
            console.log(err);
            return res.status(500).json({ text: err });
          });
      }
      console.log(finalChat.choices[0], "finalChat");

      return res.status(200).json({
        text: textResponse,
      });
    } else {
      let testResponse = completion.choices[0];

      let messages = testResponse.message.content;

      if (messages.messages) {
        messages = messages.messages; //sometimes return inconsisten response?
      }

      let response = completion.choices;
      console.log(response, "response");
      return res.status(200).json({
        text: messages,
      });
    }
  } catch (error) {
    console.error("Error in /chat endpoint:", error);
    res.status(500).send("Error handling chat request");
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
