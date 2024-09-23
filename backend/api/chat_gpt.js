

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
          },
          required: ["slug", "sent_email"],
          additionalProperties: false,
        },
      },
    },
  ];