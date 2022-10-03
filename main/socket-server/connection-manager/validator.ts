import { Schema, Validator as Validation } from "jsonschema";

export const socketMessageSchema: Schema = {
  id: "/SocketMessage",
  type: "object",
  additionalProperties: {
    type: "object",
    properties: {
      client: { type: "string", required: true },
    },
  },
};

const validator = new Validation();
validator.addSchema(socketMessageSchema, "/SocketMessage");

export default validator;
