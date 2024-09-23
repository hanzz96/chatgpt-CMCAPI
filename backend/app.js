import express from "express";
import bodyParser from "body-parser";
import OpenAI from "openai";
import dotenv from "dotenv";
import CORS from "cors";
import { getCryptoPrice, getCryptoCurrencyMap } from "./api/api_coin_market.js";
import { toolsBot } from "./api/chat_gpt.js";
import * as nodemailer from "nodemailer";
// Initialize environment variables
dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(CORS());

const NewlineText = (props) => {
  const text = props;
  return text.split("\n").map((str) => `<p>${str}</p>`).join("");
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
    const response = await getCryptoPrice(cryptoSlug, "bitcoin");

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

app.post("/chat", async (req, res) => {
  const { messageContent } = req.body;

  try {
    const tools = toolsBot;

    const completion = await openai.chat.completions.create({
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: `
            You are helpfull assistant.
            You don't need to approach question first.
            If the request is unclear, ask the user for clarification.`,
        },
        { role: "user", content: messageContent },
      ],
      tools: tools,
      model: "gpt-4o",
    });

    
    if (completion.choices[0].finish_reason === "tool_calls") {
      const toolCall = completion.choices[0].message.tool_calls[0];
      const arguments_ = JSON.parse(toolCall.function.arguments);

      const slug = arguments_.slug;
      const sent_email = arguments_.sent_email;
      console.log(slug, sent_email, "extracted_arguments");

      const response = await getCryptoPrice("", slug);

      console.log(response?.data?.data ?? []);

      let dataString = JSON.stringify(response?.data?.data ?? []);

      const finalChat = await openai.completions.create({
        prompt: `
            You are a helpful assistant. 
            Please explain the latest price the following JSON data about cryptocurrency in a simple without saying JSON Data and affirmative word like 'Sure', 'Okay', etc , in non-technical way:
            ${dataString}
        `,
        model: "gpt-4o",
      });

      let textResponse = finalChat.choices[0].text;
      console.log(sent_email, typeof sent_email, "sent_email");

      const isSentMail = sent_email != false || sent_email != "";

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
