export const toolsBot = [
  {
    type: "function",
    function: {
      name: "get_latest_price",
      description:
        "Get the latest price cryptocurrency for a customer's order. Call this whenever you need to know the latest cryptocurrency, for example when a customer asks 'What is price of bitcoin' or 'Please send email to {email} about price of bitcoin' ",
      parameters: {
        type: "object",
        properties: {
          slug: {
            type: "string",
            description: "slug of cryptocurrency",
          },
          sent_email: {
            type: "string",
            description: "get the email if user want to send",
          },
          symbol: {
            type: "string",
            description:
              "get the symbol name when customer mention cryptocurrency",
          },
        },
        required: ["slug", "sent_email"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_top_cryptocurrency",
      description: `Get the top 'n' cryptocurrency for a customer's. 
          Call this whenever you need to know the top {'n'} cryptocurrency, 
          for example when a customer asks 'get me top {10} token names' or ''`,
      parameters: {
        type: "object",
        properties: {
          n: {
            type: "number",
            description: "how many data need to know",
          },
          slug: {
            type: "string",
            description:
              "get the slug if customer mention the cryptocurrency name",
          },
          symbol: {
            type: "string",
            description:
              "get the symbol name when customer mention cryptocurrency",
          },
        },
        required: ["n", "slug"],
        additionalProperties: false,
      },
    },
  },
];
