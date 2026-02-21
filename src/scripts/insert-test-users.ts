import { Logger } from "../types";

const numberOfAdditionalUsersString = process.argv[2];
const parsed = Number.parseInt(numberOfAdditionalUsersString);

const numberOfAdditionalUsers = parsed ? parsed : 1;

type UserParams = {
  name: string;
  email: string;
  password: string;
};

const createUser = async (
  userParams: UserParams,
  logger: Logger | undefined,
) => {
  const res = await fetch("http://localhost:3000/api/auth/sign-up/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userParams),
  });
  logger?.log(res);
  return res;
};

const additionalUsers = Array.from(
  { length: numberOfAdditionalUsers },
  (_, i) => ({
    name: `John Doe ${i}`,
    email: `john-${i}@example.com`,
    password: "superSecret",
  }),
);

const createUsers = async (logger: Logger | undefined) => {
  const response = await createUser(
    {
      name: "Marcel D",
      email: "marcel@example.com",
      password: "superSecret",
    },
    logger,
  );
  logger?.log(response.status);

  await Promise.all(
    additionalUsers.map(async (user) => {
      const res = await createUser(user, logger);
      logger?.log(res.status);
    }),
  );
};

createUsers(console);
